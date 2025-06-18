---
author: Jonathan Haas
pubDate: 2025-05-03
title: "Building the HTTP for Agents: A Complete Guide to Agent Infrastructure"
description: "As AI agents grow from niche experiments to core infrastructure, we need a new control plane—identity, policy, and secrets—standardized and scalable. Here's how to build the HTTP layer for autonomous agents, from Envoy sidecars to Vault-backed secrets and a Python SDK."
featured: false
draft: false
tags:
  - ai
  - ai-agents
  - infrastructure
  - engineering
  - technical
  - framework
  - developer-tools
image:
  url: "https://images.pexels.com/photos/11035546/pexels-photo-11035546.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
  alt: "Abstract network of connected dots representing digital agents and protocols"
---

Most teams aren't ready for what's coming.

Autonomous agents aren't just prototypes anymore. They're parsing docs, calling APIs, triaging support tickets—and doing it all while running 24/7 in prod. But while the AI layer is getting smarter, the plumbing around it is falling behind.

Ask around and you'll hear the same story: each team hand-rolls identity flows, secrets management, and policy enforcement. Every new agent spins up another snowflake.

It doesn't scale.

We've been here before. Web services hit the same wall a decade ago. The answer was a shared layer: HTTP, OAuth, JWTs, Envoy, Vault, OPA.

It's time to give agents the same treatment.

We can build a control plane that feels like HTTP for agents—with identity, policy, and secrets as first-class citizens. This guide assumes a working knowledge of cloud-native concepts like microservices, APIs, containers, and familiar tools like Docker, Kubernetes, Auth0, OPA, and Vault.

Here's how.

## 1. The Vision

Right now, agent infrastructure is fragmented.

- **Every team rolls their own onboarding logic**
- **Policies live in GitHub READMEs**
- **Secrets are long-lived and manually rotated**
- **Audit trails? If you're lucky.**

That's a problem.

### What We Actually Need

We need a **shared runtime model** for agents, where:

- Identity is established via OAuth2 or SPIFFE
- Policy is enforced via sidecars and Rego bundles
- Secrets are short-lived and injected automatically
- Every action is observable and scoped by identity

If we get this right, developers can spin up new agents in minutes. Security gets auditability and control. Infra teams stop reinventing the wheel.

Just like HTTP gave us a common language for web services, this stack gives us a common language for agents.

### The Pain Points Today

Let's be brutally honest about where we are:

1.  **Identity is an afterthought**: Most AI agents today run with static API keys or service account credentials with little-to-no fine-grained access control. Rotating credentials is a manual process that often gets neglected.
2.  **Isolation is poor**: Agents often share environments, credentials, and execution contexts, making it nearly impossible to attribute actions to specific agents or contain blast radius during incidents.
3.  **Permissions are binary**: Agents either have access to everything within a system or nothing at all. There's rarely any contextual authorization based on the task being performed or the data being accessed.
4.  **Auditability is limited**: When something goes wrong, it's hard to trace exactly what happened, which agent took which action, and under what context.
5.  **Onboarding is complex**: Setting up a new agent requires coordinating across multiple teams, manually configuring credentials, and documenting tribal knowledge.

Without solving these problems systematically, we're setting ourselves up for security incidents, compliance nightmares, and scalability bottlenecks. The sooner we address this, the less technical debt we'll accumulate.

## 2. The Architecture Overview

Before diving into the components, let's visualize the flow. An Agent interacts with the rest of the world *only* through its local Envoy sidecar. The sidecar acts as a policy enforcement point (PEP) and interacts with control plane services (Auth0, OPA, Vault) to make decisions before proxying the request to an upstream Skill or Service.

![High-level architecture: control plane and data plane with Auth0, OPA, Vault, Envoy, and Agent Application](/images/agent-architecture-diagram.png)

*Figure 1: High-level architecture illustrating the request flow and interactions. (See image for details.)*

This sidecar pattern provides a clean separation of concerns: the agent focuses on its core logic, and the sidecar handles the cross-cutting infrastructure concerns of identity, policy, secrets, and observability.

## 3. The Core Components

Let's break down the key pieces of the control plane: **Identity**, **Policy**, and **Secrets**.

### 3.1 Identity with Auth0 (or SPIFFE)

Every agent needs to authenticate securely—ideally using short-lived tokens that are easy to verify and hard to misuse. Auth0 provides a robust identity platform supporting standard protocols like OAuth2/OIDC.

You'll need:

-   An **Auth0 Resource Server** representing your control plane API audience.
-   A **Machine-to-Machine (M2M) Application** configured for each agent, using the Client Credentials flow.

```hcl
# Define the audience for your agent control plane API
resource "auth0_resource_server" "mcp_api" {
  identifier = "https://mcp.example.com/" # This is the API audience agents will request access to
  name       = "AI Agent Control Plane"
  signing_alg = "RS256"
  token_lifetime = 3600 # Tokens valid for 1 hour
  skip_consent_for_verifiable_first_party_clients = true
  token_dialect = "access_token_authz" # Include permissions and custom claims in the token
  # NOTE: 'token_dialect' might be specific; the general goal is to embed permissions/claims.
  # This is often configured via RBAC settings (e.g., "Add Permissions in the Access Token")
  # or Auth0 Actions/Rules for more complex claim manipulation. Verify with current Auth0 docs.

  # Define scopes representing capabilities or permissions within the control plane
  scopes {
    value = "skills:invoke"
    description = "Invoke registered skills"
  }
  # ... other scopes ...
  scopes {
    value = "data:write"
    description = "Write to registered data sources"
  }
}

# Define a machine-to-machine application representing a specific agent
resource "auth0_client" "agent_app" {
  name = "support-triage-agent"
  app_type = "non_interactive" # Machine-to-machine application
  grant_types = ["client_credentials"]
  token_endpoint_auth_method = "client_secret_post"

  jwt_configuration {
    lifetime_in_seconds = 3600
    alg = "RS256"
  }

  # Custom metadata added to the agent's identity, included in the JWT payload
  client_metadata = {
    agent_type = "support"
    team = "customer-success"
    environment = "production"
  }
}

# Grant the agent application specific permissions (scopes) for the control plane audience
resource "auth0_client_grant" "agent_permissions" {
  client_id = auth0_client.agent_app.id
  audience = auth0_resource_server.mcp_api.identifier
  scope = ["skills:invoke", "data:read"] # This agent can invoke skills and read data
}
```

#### Flow:

1.  The Agent application, using its `client_id` and `client_secret`, makes an OAuth2 Client Credentials request to Auth0's `/oauth/token` endpoint.
2.  Auth0 authenticates the agent and issues a short-lived JWT access token.
3.  The agent includes this JWT in the `Authorization: Bearer <token>` header for all requests it makes to services via its sidecar.

#### JWT Claims Structure:

The JWT issued by Auth0 contains critical metadata for your authorization system:

```json
{
  "iss": "https://your-tenant.auth0.com/", // Issuer (your Auth0 tenant)
  "sub": "client-id@clients", // Subject (the agent's client ID)
  "aud": "https://mcp.example.com/", // Audience (your control plane API)
  "iat": 1683026400, // Issued At timestamp
  "exp": 1683030000, // Expiration timestamp
  "azp": "client-id", // Authorized party (client ID again)
  "gty": "client-credentials", // Grant type used
  "permissions": [
    "skills:invoke",
    "data:read"
  ], // Scopes granted by Auth0
  "https://mcp.example.com/agent_type": "support", // Custom claims from client_metadata
  "https://mcp.example.com/team": "customer-success",
  "https://mcp.example.com/environment": "production"
}
```

These claims provide rich context for policy decisions downstream (in OPA), enabling fine-grained access control based on:

-   Who the agent is (the `sub` claim identifies the agent)
-   What it's generally allowed to do (the `permissions` claim)
-   What context it's operating in (custom claims like `team`, `environment`, `agent_type`)

#### Alternative: SPIFFE for Zero Trust

For organizations already invested in a service mesh like Istio or prefer a more Kubernetes-native approach focused on workload identity, SPIFFE (Secure Production Identity Framework for Everyone) offers a compelling alternative. SPIFFE provides cryptographically verifiable short-lived identities (`spiffe://<trust_domain>/...`) to workloads, often delivered via a mechanism like the SPIFFE Workload API and X.509-SVIDs.

```yaml
apiVersion: spiffeid.spiffe.io/v1beta1 # Check for latest API version
kind: SpiffeID
metadata:
  name: support-triage-agent
  namespace: agents
spec:
  spiffeId: spiffe://your-trust-domain.com/agent/support-triage # Explicit SPIFFE ID
  parentId: spiffe://your-trust-domain.com/k8s-workload-registrar # Parent ID (e.g., registrar)
  # dnsNames: # DNS names are often automatically generated or configured elsewhere
  # - support-triage-agent.agents.svc.cluster.local # Common DNS representation
  # Select the Kubernetes pods that should receive this identity
  selector:
    podSelector: # Use podSelector in newer APIs
      matchLabels:
        app: support-triage-agent
        environment: production
  # Optional: Federation configuration if interacting with external trust domains
  # federatesWith:
  # - trustDomain: example.com
  #   bundleEndpointURL: https://spiffe-bundle.example.com
```

In a SPIFFE-based setup, the Envoy sidecar would use mTLS with the SPIFFE identity to authenticate the agent workload. OPA policies could then use the extracted SPIFFE ID (e.g., from the client certificate URI SAN) as the subject for authorization decisions, potentially fetching additional metadata about the workload from a separate identity registry if needed. Both Auth0 JWTs and SPIFFE provide strong, verifiable identity signals that are crucial for the authorization layer.

### 3.2 Policy with OPA + Envoy

Use [Open Policy Agent (OPA)](https://www.openpolicyagent.org/) to write policy bundles in Rego. Unlike hardcoded `if/else` rules within services, Rego gives you a declarative language for expressing complex, context-aware authorization logic externalized from your application code. Envoy acts as the Policy Enforcement Point (PEP), querying OPA (the Policy Decision Point or PDP) for authorization decisions before forwarding requests.

#### Base Policy Structure (Rego)

```rego
package mcp.authz # Define the policy package

import future.keywords # Enable future keywords like 'if' and 'contains'
import input.jwt as token # Alias input.jwt for easier access to JWT payload

# --- Default Decision ---
# Default deny everything unless explicitly allowed by another rule.
default allow := false

# --- Common Conditions ---
# Basic checks for token validity and expiry are fundamental.
token_valid := token.valid == true
token_not_expired := time.now_ns() < (token.payload.exp * 1000000000) # JWT exp is in seconds

# --- Core Allow Rule ---
# A request is allowed if the token is valid, not expired, AND passes specific permission checks.
allow if {
  token_valid         # Is the token structurally valid and trusted? (checked by Envoy JWT filter)
  token_not_expired   # Has the token expired?
  has_permission_for_action # Does the token's permissions allow this *type* of action?
  # Note: Additional context-specific checks (service, env, team) are separate allow rules below.
}

# --- Permission Check: Action Type ---
# Checks if the agent's JWT permissions include the scope required for the request path.
# Example: A request to /mcp://skill-name/invoke_skill requires the "skills:invoke" permission.
has_permission_for_action if {
  # NOTE: Relying on fixed path indices (input.request.path[n]) can be brittle.
  # Consider using regex matching or having the Lua filter extract 'action'
  # into a dedicated field (e.g., input.request.action) for robustness.
  path_parts := input.request.path
  count(path_parts) > 3 # Basic check for expected structure

  action_verb := path_parts[3] # Assuming path structure like /mcp://service/action/...

  # Map action verbs to required OAuth2 scopes (permissions)
  action_permission_map := {
    "invoke_skill": "skills:invoke",
    "access_tool": "tools:access",
    "read_data": "data:read",
    "write_data": "data:write",
    "list_skills": "skills:list",
    "status": "system:status" # Example for a system-level check
  }

  required_permission := action_permission_map[action_verb] # Lookup the required scope

  # Check if the required permission is present in the agent's token payload
  token.payload.permissions contains required_permission
}

# --- Permission Check: Service-Specific ---
# This rule allows access based on the *specific service* being called,
# potentially requiring permissions *in addition* to the general action permission.
allow if {
  token_valid
  token_not_expired

  # NOTE: Brittle path parsing, same as above.
  service := input.request.path[2] # Assuming path structure /mcp://service/action/...

  # Check if agent has the required service-specific permission(s)
  has_service_permission(service)
}

# Helper function to check for service-specific permissions
has_service_permission(service) if {
  # Define a map of services to lists of required permissions
  # Agent must have ALL permissions in the list for that service
  service_permissions := {
    "customer-data": ["data:read", "customer:access"],
    "billing-system": ["billing:read", "finance:access"],
    "support-tools": ["support:access"],
    "sentiment-analysis": ["skills:invoke"] # Redundant but shows pattern
  }

  # Check if the requested service exists in our map
  required_permissions := service_permissions[service]

  # Ensure the agent has ALL permissions specified for this service
  required_permissions_set := {p | some p in required_permissions}
  agent_permissions_set := {p | some p in token.payload.permissions}

  required_permissions_set & agent_permissions_set == required_permissions_set
}

# --- Contextual Rules: Environment-Specific ---
# Rule to enforce access based on the environment of the resource being accessed
# compared to the environment claim in the agent's token.
allow if {
  token_valid
  token_not_expired

  # Get the resource environment (e.g., fetched by Lua filter from a registry)
  resource_env := input.resource.metadata.environment

  # Get the agent's environment claim from the JWT
  agent_env := token.payload["https://mcp.example.com/environment"]

  # Allow if the resource environment matches the agent's environment
  resource_env == agent_env
}

# --- Contextual Rules: Team-Based ---
# Rule to enforce that agents can only access resources belonging to their team.
allow if {
  token_valid
  token_not_expired

  # Get the agent's team claim from the JWT
  agent_team := token.payload["https://mcp.example.com/team"]

  # Get the resource team (e.g., fetched by Lua filter)
  resource_team := input.resource.metadata.team

  # Allow if the resource team matches the agent's team
  agent_team == resource_team
}

# --- Deny Rule: Off-Hours Restrictions ---
# Define specific conditions that result in an explicit deny, overriding allow rules.
# This example denies certain operations during off-hours.
deny_reason := "Operation not permitted during off-hours" if {
  # Get the current hour (UTC assumed for simplicity)
  hour := time.clock(time.now_ns())[0]

  # Define off-hours (e.g., before 9 AM or after 5 PM UTC)
  hour < 9 or hour > 17

  # Define high-risk HTTP methods
  high_risk_methods := {"PUT", "POST", "DELETE", "PATCH"} # Use set for efficient lookup

  # Check if the request method is considered high-risk
  high_risk_methods[input.request.method]

  # Optionally add other conditions, e.g., not a critical agent type
  # token.payload["https://mcp.example.com/agent_type"] != "critical-incident-response"
}

# The final decision is 'allow' IF NOT 'deny' AND one of the 'allow' rules is true.
# The default 'allow := false' handles cases where no specific allow rule matches.
# The 'deny_reason' rule provides context when a deny occurs.
```

#### Request Context Structure (OPA Input)

For the OPA policy to evaluate correctly, Envoy needs to construct an appropriate input document based on the incoming request and extracted JWT claims. The policy expects a structure like this:

```json
{
  "jwt": {
    "valid": true, // Set by Envoy JWT filter
    "payload": {
      "sub": "client-id@clients",
      "permissions": ["skills:invoke", "data:read"],
      "https://mcp.example.com/agent_type": "support",
      "https://mcp.example.com/team": "customer-success",
      "https://mcp.example.com/environment": "production",
      "exp": 1683030000 // JWT expiration timestamp (seconds since epoch)
    }
  },
  "request": {
    "method": "POST",
    "path": ["", "mcp:", "sentiment-analysis", "invoke_skill"], // Path split into segments
    "headers": {
      "x-source-system": "support-portal",
      "content-type": "application/json",
      "authorization": "Bearer ..." # Note: Sensitive headers might be excluded in production
    }
  },
  "resource": {
    "type": "service", // Type of resource being accessed (e.g., service, data_source, tool)
    "id": "sentiment-analysis", // Identifier of the resource
    "metadata": {
      # Contextual metadata about the resource, crucial for policy decisions
      # In production, this metadata would ideally be fetched from a configuration
      # registry or service catalog based on the resource ID (e.g., by the Lua filter).
      "team": "ml",
      "environment": "production",
      "data_classification": "low"
    }
  }
}
```

Envoy uses filters in its HTTP connection manager to build this input.

#### Wiring it up in Envoy:

The Envoy configuration defines a chain of HTTP filters that process incoming requests before routing them to the upstream service.

```yaml
http_filters:
  # 1. JWT Authentication Filter: Validates the incoming JWT.
  #    It extracts claims and stores them in request metadata.
  - name: envoy.filters.http.jwt_authn
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication"
      providers:
        auth0: # Name of the JWT provider configuration
          issuer: "https://your-tenant.auth0.com/"
          audiences: ["https://mcp.example.com/"]
          forward: true # Pass the Authorization header upstream (optional, depends on downstream)
          from_headers:
            - name: "Authorization" # Look for the token in the Authorization header
              value_prefix: "Bearer "
          remote_jwks: # How to fetch public keys to verify the JWT signature
            http_uri:
              uri: "https://your-tenant.auth0.com/.well-known/jwks.json"
              cluster: auth0_jwks # Envoy cluster pointing to Auth0's JWKS endpoint
              timeout: 5s
            cache_duration: # Cache the JWKS response
              seconds: 300
            # NOTE: For local demos with complex mocking, consider using:
            # insecure_skip_signature_verification: true
            # This is NOT secure for production.
      rules:
        # Apply this JWT validation rule only to requests starting with /mcp://
        - match:
            prefix: "/mcp://"
          requires:
            provider_name: "auth0" # This rule requires validation by the 'auth0' provider

  # 2. Lua Filter (Pre-Authz): A small Lua script runs after JWT validation.
  #    Its job is to extract data (JWT claims, request path/headers) and
  #    format it into the JSON structure required by the OPA policy input.
  #    It then adds this OPA input as a request header for the ext_authz filter.
  - name: envoy.filters.http.lua
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
      inline_code: |
        -- Load cjson library (ensure it's available in your Envoy build)
        local cjson = require "cjson"
        -- Called before request is sent to upstream
        function envoy_on_request(request_handle)
          -- Access the JWT payload stored in metadata by the jwt_authn filter
          local metadata = request_handle:streamInfo():dynamicMetadata()
          local jwt_payload = metadata:get("envoy.filters.http.jwt_authn")["jwt_payload"]

          if not jwt_payload then
            -- This should not happen if jwt_authn filter is configured correctly
            -- and 'requires' rule matched, but good for safety.
            request_handle:logWarn("JWT payload not found in metadata.")
            return
          end

          -- Extract service name and split path for OPA input
          local path = request_handle:headers():get(":path")
          local path_parts = split_path(path)

          -- Add agent identity headers for downstream services (useful for logging/auditing)
          request_handle:headers():add("x-agent-id", jwt_payload["sub"])
          request_handle:headers():add("x-agent-type", jwt_payload["https://mcp.example.com/agent_type"])
          request_handle:headers():add("x-agent-team", jwt_payload["https://mcp.example.com/team"])

          -- Build the OPA input document structure
          local service_name = "unknown"
          if #path_parts >= 2 then
             service_name = path_parts[2] -- Service name is the second part after /mcp://
          end

          local opa_input = {
            jwt = {
              valid = true, -- JWT filter validated structural integrity
              payload = jwt_payload
            },
            request = {
              method = request_handle:headers():get(":method"),
              path = path_parts, -- Pass split path
              headers = extract_headers(request_handle) -- Extract relevant headers
            },
            resource = {
              type = "service", -- Type of the entity being accessed
              id = service_name,
              metadata = service_metadata(service_name) -- Fetch/derive resource metadata
            }
          }

          -- Encode the OPA input as JSON and add it as a header.
          -- The ext_authz filter is configured to read this specific header.
          request_handle:headers():add("x-opa-input", cjson.encode(opa_input))
        end

        -- Helper functions for Lua script
        function split_path(path)
          local parts = {}
          -- Simple split by '/', improved to handle leading/trailing slashes better
          for part in string.gmatch(path or "", "([^/]+)") do
            table.insert(parts, part)
          end
          -- Handle the root case or mcp:// alone
          if path == "/" then return {""} end
          if #parts == 0 and string.sub(path, 1, 1) == "/" then return {""} end
          -- Add leading empty string to match OPA example structure if path starts with '/'
          if string.sub(path, 1, 1) == "/" then table.insert(parts, 1, "") end
          return parts
        end

        function extract_headers(handle)
          local headers = {}
          -- Example: Only extract a few specific headers. Avoid sensitive ones.
          headers["x-source-system"] = handle:headers():get("x-source-system")
          headers["content-type"] = handle:headers():get("content-type")
          -- In a real system, carefully curate which headers are sent to OPA
          return headers
        end

        function service_metadata(service)
          -- In a production environment, this metadata (team, environment, etc.)
          -- would be dynamically fetched from a centralized service registry,
          -- config service, or database based on the 'service' identifier.
          -- For this example, we use a hardcoded map.
          local metadata_map = {
            ["hello-skill"] = { team = "platform", environment = "production", data_classification = "low" },
            ["sentiment-analysis"] = { team = "ml", environment = "production", data_classification = "low" },
            ["customer-lookup"] = { team = "customer-success", environment = "production", data_classification = "medium" },
            ["support-system"] = { team = "customer-success", environment = "production", data_classification = "medium" }
            -- Add metadata for other services...
          }
          -- Return metadata if found, or default unknown metadata
          return metadata_map[service] or { team = "unknown", environment = "unknown", data_classification = "unknown" }
        end

        -- Called after response is received from upstream (useful for observability headers)
        function envoy_on_response(response_handle)
          -- Add trace ID for debugging/correlation
          response_handle:headers():add("x-mcp-trace-id", response_handle:streamInfo():requestId())
        end

  # 3. External Authorization (ExtAuthz) Filter: Sends the OPA input to OPA
  #    and enforces the decision returned by OPA.
  - name: envoy.filters.http.ext_authz
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz"
      failure_mode_allow: false # If OPA is down, deny requests. Crucial for security.
      http_service:
        server_uri: # Configure how to connect to the OPA server
          uri: http://opa:8181/v1/data/mcp/authz # OPA's API endpoint for our policy
          cluster: opa # Envoy cluster pointing to the OPA service
          timeout: 0.5s # Timeout for the OPA authorization query
        authorization_request:
          # Configure which headers from the original request are sent to OPA.
          # We only need the 'x-opa-input' header prepared by the Lua filter.
          allowed_headers:
            patterns:
              - exact: "x-opa-input"
        authorization_response:
          # Configure which headers returned by OPA (if any) are allowed to be
          # added to the request sent upstream or the response sent downstream.
          # Useful for OPA adding context, e.g., user ID.
          allowed_upstream_headers:
            patterns:
              - exact: "x-agent-id" # Allow the agent ID header added by Lua
              - exact: "x-agent-type" # Allow the agent type header added by Lua
              - exact: "x-agent-team" # Allow the agent team header added by Lua
              - prefix: "x-mcp-" # Allow any custom headers OPA or Lua might add starting with x-mcp-

  # 4. Lua Filter (Post-Authorization Logic / Request ID Injection): <-- Renamed/Clarified Purpose
  #    This filter runs *after* successful authorization.
  #    Its primary role here is demonstration, like adding a request ID.
  #    In a real scenario, complex post-auth logic might live here, but
  #    *secret injection* should happen via mechanisms like Vault Agent,
  #    *not* by adding secret headers here due to security risks.
  - name: envoy.filters.http.lua
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
      inline_code: |
        -- Called before request is sent to upstream, after ext_authz
        function envoy_on_request(request_handle)
          -- Example: Add Envoy's unique request ID to the request going upstream
          request_handle:headers():add("x-request-id", request_handle:streamInfo():requestId())

          -- Mock header indicating auth passed and secrets *could* be available
          -- (but are actually injected via Vault Agent, not here)
          request_handle:headers():add("x-mcp-secrets-available", "true")
        end

  # 5. Router Filter: The final filter, responsible for routing the request
  #    to the correct upstream cluster based on the route configuration.
  - name: envoy.filters.http.router
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.router.v3.Router"
```

#### Understanding the `mcp://` Scheme

You'll notice routes configured with `prefix: "/mcp://"`. The Python SDK also uses URLs like `mcp://skill-name/path`.

**Crucially, `mcp://` is *not* a new global internet protocol.** It's a local **convention** used *within this specific sidecar architecture*.

1.  The **Agent SDK** constructs URLs starting with `mcp://<service-name>/<path>` (e.g., `mcp://sentiment-analysis/analyze`).
2.  The **Agent** sends this HTTP request (via the SDK) to its **local Envoy sidecar** (`http://127.0.0.1:15000`).
3.  The **Envoy sidecar** receives the request. Its `route_config` contains a route matching the `/mcp://` prefix.
4.  This route uses a `regex_rewrite` to remove the `/mcp://<service-name>` part from the path, leaving only the original path (`/analyze` in the example).
5.  More importantly, the route configuration uses the `<service-name>` part from the original path (`sentiment-analysis`) to dynamically select the correct **upstream cluster**. The cluster name is typically derived directly from the service name (e.g., the `sentiment-analysis` cluster).
6.  The request is then routed to the selected upstream cluster with the rewritten path (`/analyze`).

*(Note: The Envoy configuration snippet above shows the `http_filters` but **omits the `route_config` block for brevity**. A complete `envoy.yaml` would require a `route_config` section defining the virtual hosts, routes matching `/mcp://...`, the `regex_rewrite` logic, and the dynamic cluster selection based on the path.)*

This pattern provides a simple abstraction for the agent: it just needs to know the logical name of the service (`sentiment-analysis`), and the sidecar handles finding and routing to the actual network location of that service.

#### Deployment and Bundle Management

OPA policies should be treated like code – versioned, tested, and deployed through CI/CD pipelines. OPA can be configured to pull policy bundles from a remote HTTP server, S3 bucket, or other sources.

```yaml
# opa-bundler.yaml - Example OPA configuration for fetching bundles
bundles:
  authz: # Name of the bundle
    service: bundles # Reference to the service configuration below
    resource: bundles/authz # Path on the bundle server where the bundle is located
    persist: true # Store the bundle on disk
    polling: # Configure how often OPA checks for updates
      min_delay_seconds: 60
      max_delay_seconds: 120

services:
  bundles: # Configuration for the bundle server
    url: https://opa-bundles.example.com # URL where bundles are hosted
    credentials: # Authentication for the bundle server (e.g., Bearer token)
      bearer:
        token_file: /var/run/secrets/bundle-auth-token # File containing the token

plugins:
  envoy_ext_authz_grpc: # If using gRPC ext_authz (alternative to HTTP)
    addr: :9191
    path: mcp/authz/allow # The policy decision path OPA should expose via gRPC
    dry-run: false
    enable-reflection: false
```

For policy testing, create a suite of test cases in Rego:

```rego
package mcp.authz_test # Define a test package

import data.mcp.authz # Import the policy we are testing

# Helper timestamps for tests
future_timestamp := time.now_ns() / 1000000000 + 3600 # 1 hour in the future (seconds)
past_timestamp := time.now_ns() / 1000000000 - 3600 # 1 hour in the past (seconds)

# Test case: Allow request with valid token and required permission
test_allow_valid_token_with_permission {
  allow_result := authz.allow with input as { # Evaluate authz.allow rule with this input
    "jwt": {
      "valid": true,
      "payload": {
        "permissions": ["skills:invoke"], # Agent has invoke permission
        "exp": future_timestamp # Token is not expired
      }
    },
    "request": {
      "method": "POST",
      "path": ["", "mcp:", "sentiment-analysis", "invoke_skill"] # Requesting an action that needs skills:invoke
    },
    "resource": {
       "id": "sentiment-analysis",
      "metadata": {
        "team": "ml", # Example metadata
        "environment": "production"
      }
    }
  }

  allow_result == true # Expect the result to be true
}

# Test case: Deny request with an expired token
test_deny_expired_token {
  allow_result := authz.allow with input as {
    "jwt": {
      "valid": true,
      "payload": {
        "permissions": ["skills:invoke"],
        "exp": past_timestamp # Token is expired
      }
    },
    "request": {
      "method": "POST",
      "path": ["", "mcp:", "sentiment-analysis", "invoke_skill"]
    },
     "resource": {
        "id": "sentiment-analysis",
      "metadata": {
        "team": "ml",
        "environment": "production"
      }
    }
  }

  allow_result == false # Expect the result to be false
}

# Add more tests covering:
# - Missing permission
# - Service-specific permission check failure / success
# - Environment mismatch / match
# - Team mismatch / match
# - Off-hours deny rule triggers
# - Off-hours deny rule does NOT trigger for allowed operations/times
# - Default deny when no rules match
```

### 3.3 Secrets with Vault

HashiCorp Vault provides a secure, centralized secrets management system with powerful features like dynamic secrets, leasing, and fine-grained access control based on identity.

#### Setup JWT Auth Backend

Vault can be configured to authenticate users or machines using JWTs issued by trusted identity providers like Auth0.

```hcl
# Enable and configure the JWT auth backend to trust Auth0
resource "vault_jwt_auth_backend" "auth0" {
  path = "jwt" # Mount the auth method at /auth/jwt
  default_role = "agent" # Assign a default role if not specified in login
  jwks_url = "https://your-tenant.auth0.com/.well-known/jwks.json" # Vault fetches Auth0's public keys here
  # jwt_validation_pubkeys = [] # Alternative to jwks_url for static keys
  bound_issuer = "https://your-tenant.auth0.com/" # Validate the 'iss' claim in the JWT
}

# Define a role that maps properties from the JWT to Vault policies and TTLs
resource "vault_jwt_auth_backend_role" "agent" {
  backend = vault_jwt_auth_backend.auth0.path
  role_name = "agent"
  role_type = "jwt" # This role is for JWT authentication

  bound_audiences = ["https://mcp.example.com/"] # Validate the 'aud' claim
  bound_claims = { # Validate specific claims in the JWT payload
    "https://mcp.example.com/environment" = "production" # Only allow agents from production env
  }
  bound_claims_type = "string" # Type of bound_claims values

  user_claim = "sub" # Use the JWT 'sub' claim as the Vault identity name
  token_ttl = 600 # Vault tokens issued have a default TTL of 10 minutes
  token_max_ttl = 1200 # Max TTL of 20 minutes
  token_policies = ["agent-base"] # Assign the 'agent-base' Vault policy to tokens issued via this role
}

# Define a Vault policy that grants permissions to paths based on identity metadata
resource "vault_policy" "agent_base" {
  name = "agent-base"

  policy = <<EOF
# Base access for all agents
path "secret/data/mcp/agents/common/*" {
  capabilities = ["read"] # Allow reading secrets in the common path
}

# Team-specific access: Use identity metadata derived from JWT claims
# {{identity.entity.metadata.team}} will be substituted by Vault
path "secret/data/mcp/agents/teams/{{identity.entity.metadata.team}}/*" {
  capabilities = ["read"]
}

# Agent-specific access: Use the entity name derived from the JWT 'sub' claim
# {{identity.entity.name}} will be substituted by Vault
path "secret/data/mcp/agents/{{identity.entity.name}}/*" {
  capabilities = ["read"]
}

# Dynamic credentials access: Allow reading dynamic database credentials based on agent type
# This assumes a database secret backend configured with roles like 'support-readonly', 'analysis-readonly'
path "database/creds/{{identity.entity.metadata.agent_type}}-readonly" {
  capabilities = ["read"]
}

# Allow agents to create short-lived, restricted tokens for downstream services (if needed)
path "auth/token/create/service" {
  capabilities = ["update"] # The 'create' operation is an 'update' capability on the /auth/token path
  allowed_parameters = { # Restrict parameters the agent can set when creating tokens
    "policies" = ["service-policy"] # Only allow assigning the 'service-policy'
    "ttl" = ["5m", "10m"] # Only allow TTLs of 5 or 10 minutes
  }
}
EOF
}

# Create Vault Identity entities and aliases to link external identities (like JWT 'sub')
# to internal Vault identities and metadata. This allows policies to use identity metadata.
resource "vault_identity_entity" "agent" {
  # NOTE: Ensure this name matches how the agent is identified internally in Vault,
  # often derived from the 'user_claim' (sub) in the JWT role.
  name = "support-triage-agent" # Example name, might need adjustment based on actual 'sub' claim format
  metadata = { # Store metadata about the agent, e.g., from Auth0 custom claims
    team = "customer-success"
    agent_type = "support"
    environment = "production"
  }
}

# Link the Auth0 client ID (from JWT 'sub') to the Vault Identity entity
resource "vault_identity_entity_alias" "agent_jwt" {
  # NOTE: Ensure this name *exactly* matches the 'sub' claim in the JWT tokens being used.
  # For Auth0 M2M clients, this is typically client_id@clients format. Adjust if needed.
  name = auth0_client.agent_app.id # Assumes 'sub' claim is the Auth0 client_id@clients
  canonical_id = vault_identity_entity.agent.id # Link to the Identity entity created above
  mount_accessor = vault_jwt_auth_backend.auth0.accessor # Link to the JWT auth backend mount
}
```

#### Dynamic Database Credentials

For agents that need database access, Vault can generate dynamic, short-lived credentials on demand.

```hcl
# Configure a PostgreSQL secrets backend
resource "vault_database_secret_backend" "postgres" {
  path = "database" # Mount the backend at /database

  # Configure a specific PostgreSQL connection
  postgresql {
    name = "customer-db"
    plugin_name = "postgresql-database-plugin"
    # Connection string using a Vault admin user
    connection_url = "postgresql://{{username}}:{{password}}@db:5432/customer?sslmode=disable"
    allowed_roles = ["support-readonly", "analysis-readonly"] # Roles that can use this connection
    username = "vault"
    password = var.db_admin_password # Vault admin password (managed securely)
  }
}

# Define a role that specifies how to create credentials for a specific use case
resource "vault_database_secret_backend_role" "support_readonly" {
  backend = vault_database_secret_backend.postgres.path
  name = "support-readonly" # Role name (used in policies and lookup paths)
  db_name = "customer-db" # Reference the database connection configured above

  # SQL statements Vault will execute to create a user and grant permissions
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO \"{{name}}\";",
    "GRANT USAGE ON SCHEMA public TO \"{{name}}\";"
  ]

  default_ttl = 300 # Credentials valid for 5 minutes by default
  max_ttl = 600 # Max validity of 10 minutes
}
```

#### Agent Access Flow:

1.  The agent obtains a JWT from Auth0 (or has a SPIFFE identity).
2.  The agent (or more commonly, a **Vault Agent sidecar/injector**) presents the JWT to Vault's `/auth/jwt/login` endpoint (or uses its SPIFFE ID for mTLS auth).
3.  Vault validates the JWT (or SPIFFE ID), matches it to a Vault Identity Entity via an Alias, and issues a short-lived Vault token based on the configured Role (`agent`) and the Entity's policies (`agent-base`). The Vault token is bound to this specific agent's identity and metadata.
4.  The agent (or Vault Agent) uses this Vault token to read static secrets (e.g., `secret/data/mcp/agents/common/api-keys`) or request dynamic credentials (e.g., `database/creds/support-readonly`).
5.  Secrets/credentials obtained via Vault tokens are short-lived and automatically rotated by Vault when their lease expires.

```python
# Example Python snippets showing Vault interaction
# *** NB: This code is for illustration only. In practice, the Vault Agent sidecar
# handles token fetching and secret injection, making secrets available as files or env vars.
# The application code itself usually does NOT directly interact with the Vault API. ***
import requests

def fetch_vault_token(jwt_token, vault_addr="http://vault:8200"):
    """Exchange JWT for a Vault token. (Usually done by Vault Agent)"""
    resp = requests.post(
        f"{vault_addr}/v1/auth/jwt/login",
        json={"jwt": jwt_token, "role": "agent"} # Use the 'agent' role
    )
    resp.raise_for_status()
    # The client_token returned here has policies bound based on the agent's identity
    return resp.json()["auth"]["client_token"]

def get_db_credentials(vault_token, vault_addr="http://vault:8200"):
    """Fetch dynamic DB credentials using a Vault token. (Usually done by Vault Agent)"""
    headers = {"X-Vault-Token": vault_token}
    resp = requests.get(
        f"{vault_addr}/v1/database/creds/support-readonly", # Use the dynamic role path
        headers=headers
    )
    resp.raise_for_status()
    # This returns username/password valid for a short lease
    return resp.json()["data"]

def get_static_secret(vault_token, path, vault_addr="http://vault:8200"):
     """Fetch a static secret using a Vault token. (Usually done by Vault Agent)"""
     headers = {"X-Vault-Token": vault_token}
     # Construct the full path for KV v2
     full_path = f"{vault_addr}/v1/secret/data/{path}"
     resp = requests.get(full_path, headers=headers)
     resp.raise_for_status()
     # Returns the secret data (KV v2 nests under 'data')
     return resp.json()["data"]["data"]

# In a real deployment, fetching and managing Vault tokens and secrets
# is best handled by the Vault Agent sidecar or the Vault Agent Injector
# Kubernetes controller, which makes secrets available as files or env vars
# to the application container automatically and securely.
```

#### Secret Injection Sidecar (Vault Agent)

Vault Agent is a lightweight process that can run alongside your application (as a sidecar container in Kubernetes). It's configured to:

1.  Authenticate to Vault using various methods (like the JWT from your agent's service account or a projected volume).
2.  Obtain and automatically renew Vault tokens.
3.  Fetch secrets (static or dynamic) using the acquired token.
4.  Render secrets into files using Consul-Template syntax, or inject them as environment variables.
5.  Automatically rotate the rendered secrets when the lease expires, and optionally signal the application to reload.

This is the **most secure and developer-friendly** way to handle secrets, as the agent application doesn't need to know anything about fetching tokens or secrets from Vault directly.

```hcl
# Example Vault Agent configuration (config.hcl) placed in the agent's container

# pid_file = "/home/vault/pidfile" # Optional: path for PID file

# exit_after_auth = false # Keep agent running to manage renewals and templates

# Define how Vault Agent authenticates to Vault
auto_auth {
    method "jwt" {
        # mount_path = "auth/jwt" # Defaults to auth/<type> if not set
        # Provide config details for the JWT auth method
        config = {
            role = "agent" # The Vault role defined for agents
            # How the agent obtains the JWT. For K8s, use service account token projection:
            jwt = { from_file = "/var/run/secrets/kubernetes.io/serviceaccount/token" }
            # Or if agent gets JWT from Auth0 itself and writes to a file:
            # jwt = { from_file = "/path/to/auth0-jwt.token" }
        }
    }

    # Define where the obtained Vault token is stored (e.g., for other tools or debugging)
    sink "file" {
        # wrap_ttl = "5m" # Optional: wrap the token
        # aad_env_var = "AAD_ENV_VAR" # Optional: Azure AAD
        config = {
            path = "/home/vault/.vault-token" # Write the token to a file
            mode = 0600 # Restrict permissions
        }
    }
}

# cache block configures token caching behavior (optional but recommended)
cache {
  use_auto_auth_token = true # Use the token obtained by auto_auth
}

# listener block can expose Vault Agent's proxy features (optional)
# listener "tcp" {
#  address     = "127.0.0.1:8100"
#  tls_disable = true
# }

# template block defines which secrets to fetch and how to render them
template {
  # Source Consul Template file path (within the container)
  source      = "/vault/agent/templates/credentials.ctmpl"
  # Destination file path where the rendered secret will be written
  destination = "/etc/app/config/agent_credentials.json"
  perms       = "0400" # File permissions (read-only for owner)

  # Optional command to run after the file is updated (e.g., signal app to reload config)
  # command = "kill -HUP <pid>" or "/app/reload_config.sh"
}

template {
  source      = "/vault/agent/templates/db_creds.ctmpl"
  destination = "/etc/app/config/db_credentials.json"
  perms       = "0400"
  # command = "..." # Signal app if needed
}

# --- Example Consul-Template syntax for the source template files ---

# /vault/agent/templates/credentials.ctmpl
# Fetches a static secret from KV v2 engine mounted at 'secret/'
{{ `{{ with secret "secret/data/mcp/agents/demo-agent/credentials" }}` }}
{
  "api_key": "{{ `{{ .Data.data.api_key }}` }}",
  "environment": "{{ `{{ .Data.data.environment }}` }}"
}
{{ `{{ end }}` }}

# /vault/agent/templates/db_creds.ctmpl
# Fetches dynamic database credentials
{{ `{{ with secret "database/creds/support-readonly" }}` }}
{
  "db": {
    "host": "customer-db.internal", # Use internal DNS name
    "port": 5432,
    "username": "{{ `{{ .Data.username }}` }}",
    "password": "{{ `{{ .Data.password }}` }}",
    "database": "customer",
    "lease_duration": "{{ `{{ .LeaseDuration }}` }}" # Expose lease duration if useful
  }
}
{{ `{{ end }}` }}
```
*(Note: The double curly braces `{{` `}}` are escaped as `{{"{{"}}` `{{ "}}" }}` in the markdown block above because the outer markdown processor might interpret them. In the actual `.ctmpl` files, you would use single braces like `{{ with secret ... }}` and `{{ .Data.data.api_key }}`.)*

This approach ensures:

-   Credentials are not hardcoded or passed directly to the application process.
-   Rotation happens automatically before expiry, managed by Vault Agent.
-   The application only needs to read from the rendered files (or environment variables if using `envtemplate`). Minimal changes are required for secret rotation if the app can reload configuration dynamically or is signaled.

## 4. Agent SDK (Python)

To make agent development easy, provide an SDK that abstracts away the complexity of token management (if not handled externally), calling the sidecar, and potentially interacting with other control plane features.

```python
# mcp_agent.py
import os
import time
import json
import logging
import threading
import requests
import re # Needed for workflow template parsing
import random # Needed for jitter
from typing import Dict, Any, Optional, List, Union
from datetime import datetime # Needed for hello-skill example

class MCPAgentError(Exception):
    """Base exception for MCP Agent SDK errors."""
    pass

class AuthenticationError(MCPAgentError):
    """Error during authentication or token refresh."""
    pass

class RequestError(MCPAgentError):
    """Error during HTTP request via sidecar."""
    pass

class MCPAgent:
    """Machine Control Plane Agent SDK

    Provides methods to interact with skills and data sources via the local MCP sidecar proxy.
    Handles token acquisition and refresh using Auth0 Client Credentials flow if configured,
    otherwise assumes authentication is handled externally (e.g., mTLS, Vault Agent).
    """

    def __init__(
        self,
        client_id: str = None,
        client_secret: str = None,
        auth0_domain: str = None,
        audience: str = "https://mcp.example.com/",
        proxy_url: str = "http://127.0.0.1:15000", # URL of the Envoy sidecar
        token_refresh_margin: int = 300,  # Refresh token 5 minutes before expiry
        logger: logging.Logger = None,
        # Allow providing token externally (e.g. if Vault Agent writes it to a file/env var)
        token_provider: callable = None
    ):
        """Initialize the MCP Agent SDK.

        Args:
            client_id: Auth0 Client ID (defaults to MCP_CLIENT_ID env var). Required for Auth0 flow.
            client_secret: Auth0 Client Secret (defaults to MCP_CLIENT_SECRET env var). Required for Auth0 flow.
            auth0_domain: Auth0 domain (defaults to AUTH0_DOMAIN env var). Required for Auth0 flow.
            audience: API audience (defaults to https://mcp.example.com/).
            proxy_url: URL of the Envoy sidecar (defaults to http://127.0.0.1:15000).
                       All agent traffic goes through this local proxy.
            token_refresh_margin: Seconds before expiry to refresh token (used only with Auth0 flow).
            logger: Custom logger (defaults to standard logging).
            token_provider: Optional callable function that returns the current Bearer token string.
                            If provided, the internal Auth0 flow is disabled.
        """
        self.client_id = client_id or os.environ.get("MCP_CLIENT_ID")
        self.client_secret = client_secret or os.environ.get("MCP_CLIENT_SECRET")
        self.auth0_domain = auth0_domain or os.environ.get("AUTH0_DOMAIN")
        self.audience = audience
        self.proxy_url = proxy_url
        self.token_refresh_margin = token_refresh_margin
        self.logger = logger or logging.getLogger("mcp_agent")
        self.token_provider = token_provider

        # Token state management (only used if token_provider is NOT set)
        self._access_token: Optional[str] = None
        self._token_expiry: float = 0.0
        self._token_lock = threading.RLock() # Protect token access
        self._refresh_thread: Optional[threading.Thread] = None
        self._running = True
        self._can_fetch_token_internally = False

        if self.token_provider:
            self.logger.info("Using external token provider. Internal Auth0 token fetching disabled.")
        elif all([self.client_id, self.client_secret, self.auth0_domain]):
             self.logger.info("Using internal Auth0 Client Credentials flow for token management.")
             self._can_fetch_token_internally = True
             # Initial token fetch
             try:
                 self._fetch_token()
                 # Start token refresh thread
                 self._refresh_thread = threading.Thread(
                     target=self._token_refresh_loop,
                     daemon=True # Thread exits when main program exits
                 )
                 self._refresh_thread.start()
             except AuthenticationError as e:
                 self.logger.error(f"Initial token fetch failed: {e}")
                 # Treat initial fetch failure as fatal if SDK is managing tokens
                 raise
        else:
            self.logger.warning(
                "No external token provider and missing Auth0 credentials. "
                "SDK will not add Authorization headers. Ensure auth is handled by sidecar (e.g., mTLS)."
            )

    def _fetch_token(self) -> None:
        """Internal method to fetch a new access token from Auth0."""
        if not self._can_fetch_token_internally:
             # This should not be called if using external provider or no creds
             self.logger.error("Internal error: _fetch_token called unexpectedly.")
             return

        self.logger.debug("Fetching new token from Auth0...")
        try:
            response = requests.post(
                f"https://{self.auth0_domain}/oauth/token",
                json={
                    "grant_type": "client_credentials",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "audience": self.audience
                },
                timeout=10
            )
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)
            token_data = response.json()

            with self._token_lock:
                self._access_token = token_data["access_token"]
                # Calculate expiry time from 'expires_in' (seconds until expiry)
                self._token_expiry = time.time() + token_data["expires_in"]

            self.logger.info(
                f"New token acquired via internal fetch, expires at: "
                f"{datetime.fromtimestamp(self._token_expiry).isoformat()}"
            )
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch token from Auth0: {str(e)}")
            raise AuthenticationError(f"Auth0 token request failed: {e}") from e
        except (KeyError, json.JSONDecodeError) as e:
            self.logger.error(f"Failed to parse token response from Auth0: {str(e)}")
            raise AuthenticationError(f"Invalid token response from Auth0: {e}") from e

    def _token_refresh_loop(self) -> None:
        """Background thread to refresh the token before it expires (internal Auth0 flow only)."""
        while self._running:
            sleep_duration = 60 # Default check interval
            try:
                with self._token_lock:
                    if not self._access_token: # Should have token if thread is running
                         self.logger.warning("Token refresh loop running without initial token. Attempting fetch.")
                         self._fetch_token() # Try to recover
                         continue

                    time_to_expiry = self._token_expiry - time.time()

                # Refresh if within the margin or if already expired
                if time_to_expiry < self.token_refresh_margin:
                    self.logger.info(f"Token expiring soon ({time_to_expiry:.0f}s remaining), refreshing...")
                    try:
                        self._fetch_token()
                        # After successful refresh, recalculate sleep time based on new expiry
                        with self._token_lock:
                             time_to_expiry = self._token_expiry - time.time()
                    except AuthenticationError as e:
                        self.logger.error(f"Token refresh failed: {e}. Retrying in 60s.")
                        # Back off and retry later on failure
                        sleep_duration = 60
                        # Keep using the old token for now, hoping it's still valid for a bit
                else:
                     # Determine sleep duration: aim to refresh near the margin.
                     # Sleep for slightly less than the time until the refresh margin is hit.
                     sleep_duration = max(10, time_to_expiry - self.token_refresh_margin - 10)
                     # Clamp sleep duration to a reasonable maximum (e.g., 15 minutes)
                     sleep_duration = min(sleep_duration, 900)

            except Exception as e:
                # Catch unexpected errors in the refresh loop itself
                self.logger.error(f"Unexpected error in token refresh loop: {e}", exc_info=True)
                sleep_duration = 60 # Wait before retrying

            self.logger.debug(f"Next token refresh check in {sleep_duration:.0f} seconds.")
            time.sleep(sleep_duration)

    def get_token(self) -> Optional[str]:
        """Get the current valid access token."""
        if self.token_provider:
            try:
                token = self.token_provider()
                if not token:
                     self.logger.warning("External token provider returned empty token.")
                return token
            except Exception as e:
                 self.logger.error(f"External token provider failed: {e}")
                 raise AuthenticationError("Failed to get token from external provider") from e

        elif self._can_fetch_token_internally:
            with self._token_lock:
                # Check if token needs refreshing NOW (e.g., if called right before expiry
                # and background thread hasn't run yet)
                if time.time() > self._token_expiry - 10: # Small buffer
                     if self._running: # Avoid refresh if shutting down
                         self.logger.warning("Token called very close to expiry or expired, attempting synchronous refresh.")
                         try:
                             self._fetch_token() # Attempt synchronous refresh
                         except AuthenticationError as e:
                              self.logger.error(f"Synchronous token refresh failed: {e}")
                              # Decide: return potentially expired token or raise? Raising is safer.
                              raise
                     else:
                          self.logger.warning("SDK closing, returning potentially expired token.")

                # Return the current (possibly just refreshed) token
                return self._access_token
        else:
            # No token provider and no internal fetching configured
            self.logger.debug("No token management configured; returning None.")
            return None

    def _make_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Helper to make HTTP requests via the sidecar proxy."""
        headers = kwargs.pop("headers", {})
        token = self.get_token() # Get current token (refreshes if needed, handles different providers)
        if token:
           # Ensure we don't override an explicitly provided Authorization header
           if "Authorization" not in headers:
               headers["Authorization"] = f"Bearer {token}"
        elif "Authorization" not in headers:
             self.logger.debug("No token available and Authorization header not provided.")
             # Proceed without Authorization header if no token management is active

        # Requests always go to the local sidecar proxy, with the mcp:// path
        full_url = f"{self.proxy_url}{url}"

        # Basic retry logic for transient network issues or specific status codes
        retry_count = kwargs.pop("retry_count", 2)
        timeout = kwargs.pop("timeout", 30)
        retry_statuses = {502, 503, 504} # Retry on these gateway/timeout errors
        needs_auth_retry = False

        for attempt in range(retry_count + 1):
            try:
                self.logger.debug(f"Request Attempt {attempt+1}: {method} {full_url}")
                response = requests.request(
                    method,
                    full_url,
                    headers=headers,
                    timeout=timeout,
                    **kwargs # Pass remaining kwargs (json, params, etc.)
                )

                # Check for 401 Unauthorized - potentially needs token refresh
                if response.status_code == 401 and self._can_fetch_token_internally and attempt < retry_count:
                    self.logger.warning("Received 401 Unauthorized. Attempting token refresh and retry.")
                    needs_auth_retry = True # Signal to refresh token *after* this block
                    # Don't retry immediately, let the loop handle potential backoff

                # Check for other retryable status codes
                elif response.status_code in retry_statuses and attempt < retry_count:
                    self.logger.warning(f"Received {response.status_code}. Retrying...")
                    # Fall through to backoff and retry logic

                else:
                    # Success or non-retryable error
                    response.raise_for_status() # Raise HTTPError for non-retryable 4xx/5xx
                    return response

            except requests.exceptions.Timeout as e:
                if attempt < retry_count:
                     self.logger.warning(f"Request timed out ({method} {full_url}), retrying ({attempt+1}/{retry_count}): {e}")
                else:
                     self.logger.error(f"Request timed out after {retry_count} retries ({method} {full_url}): {e}")
                     raise RequestError(f"Request timed out after retries: {e}") from e
            except requests.exceptions.ConnectionError as e:
                 if attempt < retry_count:
                     self.logger.warning(f"Connection error ({method} {full_url}), retrying ({attempt+1}/{retry_count}): {e}")
                 else:
                     self.logger.error(f"Connection error after {retry_count} retries ({method} {full_url}): {e}")
                     raise RequestError(f"Connection error after retries: {e}") from e
            except requests.exceptions.RequestException as e:
                # Catch other request exceptions (could be non-retryable)
                self.logger.error(f"Request failed ({method} {full_url}): {e}")
                raise RequestError(f"Request failed: {e}") from e

            # --- Retry Logic ---
            if attempt < retry_count:
                 # Refresh token if we got a 401
                 if needs_auth_retry:
                     try:
                         self._fetch_token() # Synchronous token refresh
                         token = self._access_token # Get the new token
                         headers["Authorization"] = f"Bearer {token}" # Update headers for next attempt
                         needs_auth_retry = False # Reset flag
                         self.logger.info("Token refreshed successfully after 401.")
                     except AuthenticationError as auth_e:
                         self.logger.error(f"Token refresh failed during 401 retry attempt: {auth_e}")
                         # If refresh fails, we can't succeed. Re-raise the original 401 error.
                         response.raise_for_status() # Raise the original 401

                 # Exponential backoff with jitter
                 backoff_time = (2 ** attempt) + random.uniform(0, 1)
                 self.logger.info(f"Waiting {backoff_time:.2f}s before retry {attempt+2}...")
                 time.sleep(backoff_time)
                 continue # Continue to the next attempt
            else:
                 # If retries exhausted, raise the last response's error
                 response.raise_for_status()

        # Should not be reachable if retries are configured > 0
        raise RequestError("Request failed after exhausting retries.")


    def call_skill(
        self,
        skill_name: str,
        path: str, # Path on the skill's API (e.g., /analyze)
        payload: Optional[Dict[str, Any]] = None,
        method: str = "POST", # Allow specifying method
        params: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        retry_count: int = 2,
        **kwargs # Allow passing other requests options
    ) -> Any: # Return type depends on response content-type
        """Call a skill or service through the MCP sidecar.

        Constructs the mcp:// URL and handles auth/retries via the sidecar.

        Args:
            skill_name: The logical name of the target skill/service.
            path: The API path on the target service (e.g., '/analyze'). Should start with '/'.
            payload: JSON serializable data for POST/PUT/PATCH request body.
            method: HTTP method (POST, GET, PUT, DELETE, etc.). Defaults to POST.
            params: Dictionary of query string parameters for GET requests.
            timeout: Request timeout in seconds.
            retry_count: Number of retries on transient errors.
            **kwargs: Additional keyword arguments passed to requests.request().

        Returns:
            Parsed JSON response if Content-Type is application/json, otherwise raw response text.

        Raises:
            RequestError: If the request fails after retries.
            AuthenticationError: If token acquisition fails.
        """
        if not path.startswith('/'):
             path = '/' + path # Ensure leading slash for consistency

        # Construct the mcp:// URL for the sidecar
        mcp_url = f"/mcp://{skill_name}{path}"
        self.logger.debug(f"Calling {method} {mcp_url}")

        try:
            response = self._make_request(
                method.upper(),
                mcp_url,
                json=payload if method.upper() in ["POST", "PUT", "PATCH"] else None,
                params=params if method.upper() == "GET" else None,
                timeout=timeout,
                retry_count=retry_count,
                **kwargs
            )

            # Attempt to parse JSON if response indicates it
            content_type = response.headers.get("content-type", "").lower()
            if "application/json" in content_type:
                try:
                    return response.json()
                except json.JSONDecodeError:
                    self.logger.warning(f"Failed to decode JSON response from {mcp_url}, returning raw text.")
                    return response.text
            else:
                # Return raw text for non-JSON responses
                return response.text

        except requests.exceptions.HTTPError as e:
            # Catch HTTP errors raised by _make_request -> response.raise_for_status()
            self.logger.error(f"{method} {mcp_url} failed with status {e.response.status_code}: {e.response.text}")
            raise RequestError(f"Request failed: {e.response.status_code} - {e.response.text}") from e
        # Other exceptions (Timeout, ConnectionError, AuthenticationError) are raised directly by _make_request


    # --- Convenience Methods ---

    def get_data(
        self,
        data_source: str,
        path: str, # Path on the data source's API (e.g., /customers/123)
        params: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        retry_count: int = 2,
        **kwargs
    ) -> Any:
        """Read data from a registered data source (convenience for GET requests)."""
        return self.call_skill(
            skill_name=data_source,
            path=path,
            method="GET",
            params=params,
            timeout=timeout,
            retry_count=retry_count,
            **kwargs
        )

    def write_data(
        self,
        data_sink: str,
        path: str, # Path on the data sink's API (e.g., /tickets/456/status)
        payload: Dict[str, Any], # Data to write (JSON body)
        method: str = "PUT", # Default to PUT, allow POST/PATCH via method param
        timeout: int = 30,
        retry_count: int = 2,
        **kwargs
    ) -> Any:
        """Write data to a registered data sink (convenience for PUT/POST requests)."""
        return self.call_skill(
            skill_name=data_sink,
            path=path,
            method=method,
            payload=payload,
            timeout=timeout,
            retry_count=retry_count,
            **kwargs
        )


    # --- Declarative Workflow Execution (Conceptual Sketch within SDK) ---
    # NOTE: This remains a *very basic* sketch to illustrate how the SDK *could* be used
    # by a workflow engine. A real engine would be a separate, more complex component.
    def run_workflow_sketch(
        self,
        workflow_definition: Dict[str, Any], # Parsed YAML/JSON workflow
        initial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a simple, sequential workflow defined declaratively (Basic Sketch)."""
        context = initial_context or {}
        outputs = {} # Store outputs mapped by step name

        self.logger.info(f"Starting workflow sketch: {workflow_definition.get('name', 'Unnamed Workflow')}")

        for i, step in enumerate(workflow_definition.get("steps", [])):
            step_name = step.get("name", f"step-{i+1}")
            skill_name = step.get("skill")
            path = step.get("path")
            method = step.get("method", "POST").upper()

            if not skill_name or not path:
                self.logger.error(f"Workflow Step '{step_name}': Missing skill or path. Skipping.")
                # In a real engine: raise validation error or handle failure state
                continue

            self.logger.info(f"Workflow Step {i+1}: '{step_name}' -> {method} {skill_name}{path}")

            # --- Input/Path Templating (VERY Basic - Needs proper engine) ---
            step_input_payload = {}
            step_params = {}
            processed_path = path

            try:
                # Resolve path parameters first (e.g., /tickets/$inputs.ticket_id)
                processed_path = self._resolve_workflow_template(path, context, outputs, step_name)

                # Resolve input payload/params
                input_template_map = step.get("input", {})
                resolved_inputs = {}
                for key, template_value in input_template_map.items():
                     resolved_inputs[key] = self._resolve_workflow_template(template_value, context, outputs, step_name)

                if method == "GET":
                     step_params = resolved_inputs
                else:
                     step_input_payload = resolved_inputs

            except Exception as e:
                 self.logger.error(f"Workflow Step '{step_name}': Failed to resolve inputs/path: {e}")
                 raise MCPAgentError(f"Workflow input/path resolution failed for step '{step_name}'") from e


            # --- Execute Step using SDK ---
            try:
                result = self.call_skill(
                    skill_name=skill_name,
                    path=processed_path,
                    method=method,
                    payload=step_input_payload if method not in ["GET", "DELETE"] else None,
                    params=step_params if method == "GET" else None
                )

                self.logger.info(f"Workflow Step '{step_name}': Completed successfully.")
                # Store output mapped to the step name based on 'output' spec (basic $response)
                output_mapping = step.get("output", {})
                for output_key, output_path_template in output_mapping.items():
                    if output_path_template == "$response":
                         outputs[output_key] = result
                    else:
                         # Basic support for selecting sub-fields, e.g., $response.data.score
                         if isinstance(output_path_template, str) and output_path_template.startswith("$response."):
                             try:
                                 parts = output_path_template.split('.')[1:] # Skip '$response'
                                 value = result
                                 for part in parts:
                                     if isinstance(value, dict):
                                         value = value.get(part)
                                     elif isinstance(value, list) and part.isdigit():
                                          value = value[int(part)] if 0 <= int(part) < len(value) else None
                                     else: value = None
                                     if value is None: break
                                 outputs[output_key] = value
                             except Exception as e:
                                  self.logger.warning(f"Workflow Step '{step_name}': Failed to map output path '{output_path_template}': {e}")
                                  outputs[output_key] = None # Set to None on failure
                         else:
                            self.logger.warning(f"Workflow Step '{step_name}': Unsupported output mapping '{output_path_template}'. Storing raw response.")
                            outputs[output_key] = result # Fallback to storing raw response


            except Exception as e:
                self.logger.error(f"Workflow Step '{step_name}': Execution failed: {e}")
                # In real engine: implement retry, error handling, compensation
                raise # Re-raise the SDK or RequestError for this sketch

        self.logger.info("Workflow sketch finished.")
        return outputs # Return accumulated outputs from all steps


    def _resolve_workflow_template(self, template: Any, context: Dict, outputs: Dict, step_name: str) -> Any:
        """Extremely basic template resolver for workflow sketch."""
        if not isinstance(template, str):
            return template # Not a string, return as-is

        resolved_value = template

        # Replace $inputs.key or $inputs.key.subkey
        for match in re.findall(r'\$inputs\.([a-zA-Z0-9_.]+)', resolved_value):
            value = self._get_nested_value(context, match.split('.'))
            resolved_value = resolved_value.replace(f"$inputs.{match}", str(value) if value is not None else '')

        # Replace $outputs.step_name.key or $outputs.step_name.key.subkey
        for match in re.findall(r'\$outputs\.([a-zA-Z0-9_.]+)', resolved_value):
             value = self._get_nested_value(outputs, match.split('.'))
             resolved_value = resolved_value.replace(f"$outputs.{match}", str(value) if value is not None else '')

        # Handle basic default value || syntax
        if "||" in resolved_value:
             parts = resolved_value.split("||", 1)
             primary = parts[0].strip()
             default = parts[1].strip().strip('"').strip("'") # Basic string default
             if not primary or primary == 'None' or primary == '':
                 resolved_value = default
             else:
                 resolved_value = primary # Use the resolved primary value

        # Attempt to parse as JSON/number if it looks like one and is the whole string
        if resolved_value == template: # Only parse if no substitutions happened
            try: return json.loads(resolved_value)
            except (json.JSONDecodeError, TypeError): pass # Ignore if not valid JSON
            try: return int(resolved_value)
            except (ValueError, TypeError): pass
            try: return float(resolved_value)
            except (ValueError, TypeError): pass

        return resolved_value # Return as string if substitutions occurred or parsing failed

    def _get_nested_value(self, source: Dict, path_parts: List[str]) -> Any:
        """Helper to get value from nested dict using list of keys."""
        value = source
        try:
            for part in path_parts:
                 if isinstance(value, dict):
                      value = value.get(part)
                 elif isinstance(value, list) and part.isdigit():
                      idx = int(part)
                      value = value[idx] if 0 <= idx < len(value) else None
                 else:
                      return None # Path doesn't exist or type mismatch
                 if value is None: return None
            return value
        except Exception:
            return None


    def close(self) -> None:
        """Clean up resources (e.g., stop background threads)."""
        self.logger.info("Closing MCPAgent SDK...")
        self._running = False
        if self._refresh_thread and self._refresh_thread.is_alive():
            # Give the refresh thread a moment to finish its current sleep/work cycle
            self.logger.debug("Waiting for token refresh thread to exit...")
            self._refresh_thread.join(timeout=2.0)
            if self._refresh_thread.is_alive():
                 self.logger.warning("Token refresh thread did not terminate gracefully.")
        self.logger.info("MCPAgent SDK closed.")

# Context manager support for 'with MCPAgent() as agent:'
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        # Returning False propagates exceptions from the 'with' block
        return False

```

### Example Usage:

```python
# support_agent.py
import logging
from mcp_agent import MCPAgent, RequestError, AuthenticationError
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("support-agent")

# Example: If Vault Agent writes token to a file
def vault_token_provider(token_path="/vault/secrets/mcp-token"):
    """Reads token from a file managed by Vault Agent."""
    try:
        with open(token_path, 'r') as f:
            return f.read().strip()
    except FileNotFoundError:
        logger.error(f"Vault token file not found at {token_path}")
        return None
    except Exception as e:
        logger.error(f"Error reading Vault token file: {e}")
        return None

def process_ticket(ticket_id, customer_id):
    """Process a support ticket using the agent infrastructure."""

    # Initialize the agent SDK.
    # Option 1: Use internal Auth0 flow (requires env vars set)
    # agent_provider = None

    # Option 2: Use external token provider (e.g., Vault Agent)
    agent_provider = vault_token_provider

    try:
        # Using 'with' ensures agent.close() is called for cleanup
        with MCPAgent(token_provider=agent_provider) as agent:
            logger.info("MCPAgent initialized.")

            # Step 1: Look up customer information using a 'skill'
            logger.info(f"Looking up customer {customer_id}...")
            customer = agent.call_skill(
                "customer-lookup", # Target service name
                "/customer",       # Path on that service
                payload={"customer_id": customer_id}, # Body for POST
                method="POST"
            )
            logger.info(f"Retrieved customer: {customer.get('name', 'N/A') if isinstance(customer, dict) else customer}")

            # Step 2: Get ticket content from a 'data source' (using GET helper)
            logger.info(f"Getting ticket {ticket_id}...")
            ticket = agent.get_data(
                "support-system",
                f"/tickets/{ticket_id}" # Path with ticket ID
                # params={"expand": "details"} # Optional query params
            )
            logger.info(f"Retrieved ticket: {ticket.get('subject', 'N/A') if isinstance(ticket, dict) else ticket}")

            # Step 3: Analyze sentiment using another 'skill'
            logger.info("Analyzing sentiment...")
            sentiment = agent.call_skill(
                "sentiment-analysis",
                "/analyze",
                payload={"text": ticket.get("description", "") if isinstance(ticket, dict) else ""}
            )
            logger.info(f"Sentiment score: {sentiment.get('score', 'N/A') if isinstance(sentiment, dict) else sentiment}")

            # Step 4: Generate response (example)
            logger.info("Generating response...")
            response_payload = {
                    "ticket": ticket,
                    "customer": customer,
                    "sentiment": sentiment,
                    "language": customer.get("preferred_language", "en") if isinstance(customer, dict) else "en"
                }
            response = agent.call_skill(
                "response-generator",
                "/generate",
                payload=response_payload
            )
            logger.info(f"Generated response (partial): {str(response)[:100]}...")

            # Step 5: Write response back (using PUT helper)
            logger.info(f"Writing response to ticket {ticket_id}...")
            update_payload = {"response": response.get("text", "") if isinstance(response, dict) else str(response)}
            write_result = agent.write_data(
                "support-system",
                f"/tickets/{ticket_id}/responses", # Path for writing response
                payload=update_payload,
                method="PUT" # Or POST depending on API design
            )
            logger.info(f"Wrote response to ticket {ticket_id}. Result: {write_result}")

            # Return key results of the process
            return {
                "ticket_id": ticket_id,
                "customer_id": customer_id,
                "sentiment_score": sentiment.get("score") if isinstance(sentiment, dict) else None,
                "response_snippet": (response.get("text", "")[:50] + "...") if isinstance(response, dict) and response.get("text") else None
            }

    except AuthenticationError as e:
         logger.error(f"Authentication failed: {e}", exc_info=True)
         raise
    except RequestError as e:
        logger.error(f"Request failed for ticket {ticket_id}: {e}", exc_info=True)
        raise # Re-raise the specific error
    except Exception as e:
        logger.error(f"An unexpected error occurred during ticket processing for {ticket_id}: {e}", exc_info=True)
        raise # Re-raise unexpected exceptions

if __name__ == "__main__":
    # Example usage:
    ticket_id = "TKT-1234"
    customer_id = "CUST-5678"

    # Check if using internal Auth0 flow and warn if creds are missing
    # (Modify this check based on whether you expect internal or external token mgmt)
    # if not os.getenv("VAULT_TOKEN_PATH") and not all([os.getenv("MCP_CLIENT_ID"), os.getenv("MCP_CLIENT_SECRET"), os.getenv("AUTH0_DOMAIN")]):
    #     logger.warning("No external token provider path (e.g., VAULT_TOKEN_PATH) and missing Auth0 creds.")
    #     logger.warning("Ensure authentication is handled externally or provide MCP_CLIENT_ID, MCP_CLIENT_SECRET, AUTH0_DOMAIN.")
         # For local demo with docker-compose, ensure these are set if using internal flow:
         # os.environ['MCP_CLIENT_ID'] = 'demo-agent'
         # os.environ['MCP_CLIENT_SECRET'] = 'demo-secret'
         # os.environ['AUTH0_DOMAIN'] = 'auth-mock:8080'

    try:
        result = process_ticket(ticket_id, customer_id)
        logger.info(f"Ticket processed successfully: {result}")
    except Exception:
         logger.error("Ticket processing failed.")
```

### Declarative Workflow Definition (Sketch):

This YAML defines a simple sequence of steps. It's a basic illustration of the *concept* of declarative workflows, which would be executed by a specialized workflow engine component built *on top of* the Agent SDK. The `run_workflow_sketch` method within the `MCPAgent` class shows how such an engine *might* leverage the SDK.

```yaml
# support_workflow.yaml
name: support-ticket-triage
description: Automated support ticket triage and response
version: 1.0.0

# Define expected inputs to the workflow
inputs:
  ticket_id: string
  customer_id: string
  send_draft: boolean # Optional input

steps:
  - name: customer-lookup # Unique name for this step
    skill: customer-lookup # The MCP service name to call
    path: /customer # The path on that service
    method: POST # HTTP method (default is POST)
    input: # Map workflow inputs/outputs to step inputs (basic mapping)
      customer_id: $inputs.customer_id # Get customer_id from initial workflow inputs
    output: # How to capture the step's response
      customer: $response # Store the entire response body under the key 'customer'

  - name: get-ticket
    skill: support-system
    path: /tickets/$inputs.ticket_id # Path includes parameter from workflow inputs
    method: GET # Use GET method
    input: {} # No body needed for this GET, but input block can hold query params
    output:
      ticket: $response

  - name: analyze-sentiment
    skill: sentiment-analysis
    path: /analyze
    method: POST
    input:
      # Get the description from the ticket output of the previous step
      text: $outputs.get-ticket.ticket.description
    output:
      sentiment: $response.score # Example: Select only the score field

  # Add more steps as needed...
  # - name: classify-issue
  #   skill: issue-classifier
  #   path: /classify
  #   method: POST
  #   input:
  #     text: $outputs.get-ticket.ticket.description
  #     customer_tier: $outputs.customer-lookup.customer.tier
  #   output:
  #     classification: $response

  - name: generate-response
    skill: response-generator
    path: /generate
    method: POST
    input:
      ticket_subject: $outputs.get-ticket.ticket.subject # Pass specific fields
      customer_name: $outputs.customer-lookup.customer.name
      sentiment_score: $outputs.analyze-sentiment.sentiment # Pass mapped sentiment score
      # classification: $outputs.classify-issue.classification # If classify step existed
      # Use || for basic default value if preferred_language is null/missing
      language: $outputs.customer-lookup.customer.preferred_language || "en"
    output:
      response_details: $response # Store the full response object

  - name: save-response
    skill: support-system
    path: /tickets/$inputs.ticket_id/responses
    method: PUT
    input:
      # Get the response text from the generate-response step output
      response_text: $outputs.generate-response.response_details.text
      # Get send_draft from initial workflow inputs, provide default false
      mark_as_draft: $inputs.send_draft || false
    output: # Example: Capture the status from the write operation
      save_status: $response.status
```
*(Note: The standalone `run_workflow_sketch` function from the original has been removed to avoid redundancy with the SDK method. A real implementation would likely use a dedicated workflow library like `temporalio`, `prefect`, or `argo-workflows` which would invoke the `MCPAgent` SDK methods within its task definitions.)*

## 5. Hello World: End to End

To demonstrate the flow, let's build a simple "Hello World" skill service that accepts a name and returns a greeting, illustrating how it receives agent identity headers and can access injected secrets.

### Skill Service (`services/hello/app.py`)

This is a minimal Flask application representing one of the "Skills" or "Services" that agents interact with.

```python
from flask import Flask, request, jsonify, Response
import os
import logging
from datetime import datetime # Import datetime for timestamp

# Set up logging for the skill service
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("hello-skill")

app = Flask(__name__)

@app.before_request
def log_request_metadata():
    """Log key request metadata provided by the Envoy sidecar."""
    # Envoy's Lua filter adds these headers after authentication and initial processing
    agent_id = request.headers.get('x-agent-id', 'unknown')
    agent_type = request.headers.get('x-agent-type', 'unknown')
    agent_team = request.headers.get('x-agent-team', 'unknown')
    request_id = request.headers.get('x-request-id', 'n/a') # Envoy's unique request ID

    logger.info(
        f"Received request [{request.method} {request.path}] [TraceID: {request_id}] "
        f"from agent: {agent_id} (type={agent_type}, team={agent_team})"
    )
    # Note: The original Authorization header might or might not be forwarded by Envoy,
    # depending on the Envoy config ('forward: true'). Downstream services often
    # don't need the raw JWT if identity is asserted via simpler headers like x-agent-id.


@app.route("/say-hello", methods=["POST"])
def hello() -> Response:
    """
    Simple greeting endpoint.
    Accepts a name in the JSON body and returns a greeting.
    Demonstrates accessing injected secrets and agent metadata.
    """
    # Get agent identity asserted by the sidecar
    agent_id = request.headers.get('x-agent-id', 'unknown')

    # Access injected secrets (e.g., made available by Vault Agent as an environment variable)
    # In a real scenario, this might be database creds, API keys, etc.
    secret_value = os.getenv("MCP_SECRET", "no-secret-found")

    # Get optional 'name' from the JSON request body
    try:
        data = request.get_json() if request.is_json else {}
        if data is None: data = {} # Handle empty body case
    except Exception as e:
        logger.warning(f"Could not parse JSON body: {e}")
        data = {}

    # Default the name to the agent_id if no name is provided in the payload
    name = data.get("name", agent_id)

    logger.info(f"Generating greeting for '{name}' using secret status: {'found' if secret_value != 'no-secret-found' else 'missing'}")

    # Return a JSON response
    response_data = {
        "message": f"👋 Hello, {name}!",
        "agent_id": agent_id, # Include agent ID in response for traceability
        "timestamp": datetime.now().isoformat(),
        "secret_configured": bool(secret_value != "no-secret-found") # Show if secret was accessible
    }
    return jsonify(response_data)

@app.route("/health", methods=["GET"])
def health() -> Response:
    """Standard health check endpoint."""
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

if __name__ == "__main__":
    # Run the Flask application
    # In a containerized environment like Docker/Kubernetes, host='0.0.0.0' is standard
    # The service will be exposed via the sidecar, not directly on this port typically.
    port = int(os.environ.get("PORT", 8080))
    logger.info(f"Starting hello-skill service on port {port}")
    app.run(host="0.0.0.0", port=port)

```

### Infra Setup (Docker Compose)

Here's a Docker Compose setup that ties all the components together for a local demonstration:

```yaml
# docker-compose.yaml
version: '3.8'

services:
  # Identity Provider Mock (WireMock acts as a mock Auth0)
  auth-mock:
    image: wiremock/wiremock:3.3.1 # Use a recent version
    volumes:
      - ./wiremock:/home/wiremock # Mount WireMock mappings and __files
    ports:
      - "8090:8080" # Map host port 8090 to WireMock's default 8080
    # Enable templating for dynamic JWTs and CORS for JWKS endpoint if needed
    command: --verbose --global-response-templating --enable-browser-proxying
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/__admin/health"]
      interval: 5s
      timeout: 2s
      retries: 5

  # Vault for Secrets Management
  vault:
    image: hashicorp/vault:1.15.6 # Use a recent version
    cap_add:
      - IPC_LOCK # Required by Vault
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: root-token # Dev server with a fixed root token
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
      VAULT_ADDR: http://127.0.0.1:8200
      # Required for newer Vault dev mode UI/API listener split
      VAULT_API_ADDR: http://0.0.0.0:8200
    ports:
      - "8200:8200" # Expose Vault's API port
    volumes:
      - ./vault/config:/vault/config
      - ./vault/policies:/vault/policies
      - ./vault/scripts:/vault/scripts
    command: server -dev # Run in development mode
    healthcheck:
      # Check Vault status using the CLI inside the container
      test: ["CMD", "vault", "status", "-address=http://127.0.0.1:8200"]
      interval: 5s
      timeout: 3s
      retries: 10

  # Vault Initialization Script (runs once after Vault is healthy)
  vault-init:
    image: hashicorp/vault:1.15.6
    environment:
      VAULT_ADDR: http://vault:8200 # Connect to the Vault service via Docker network name
      VAULT_TOKEN: root-token # Use the development root token
    volumes:
      - ./vault/scripts:/scripts # Mount the setup script
    # Wait briefly, then execute setup.sh; script should handle Vault readiness check
    command: sh -c "apk add --no-cache curl jq && sleep 5 && /scripts/setup.sh"
    depends_on:
      vault:
        condition: service_healthy # Ensure Vault is healthy before initializing

  # OPA for Policy Enforcement
  opa:
    image: openpolicyagent/opa:0.62.1 # Use a recent version
    volumes:
      - ./opa/policies:/policies # Mount Rego policies
    # Run OPA as a server, listen on 8181, enable decision logging, load policies
    command: run --server --addr :8181 --set decision_logs.console=true /policies # Load all .rego files in /policies
    ports:
      - "8181:8181" # Expose OPA's API port
    healthcheck:
        test: ["CMD", "curl", "-f", "http://localhost:8181/health"]
        interval: 5s
        timeout: 2s
        retries: 5

  # Envoy as Agent Sidecar Proxy
  envoy:
    image: envoyproxy/envoy:v1.29-latest # Use a recent version
    volumes:
      - ./envoy/envoy.yaml:/etc/envoy/envoy.yaml:ro # Mount Envoy configuration read-only
    ports:
      - "15000:15000" # Agent talks to this port
      - "9901:9901"   # Envoy admin interface
    # Wait for control plane dependencies
    depends_on:
      auth-mock:
        condition: service_healthy
      opa:
        condition: service_healthy
      vault-init: # Depend on vault-init finishing to ensure Vault is configured
        condition: service_completed_successfully
    # The actual envoy.yaml should define clusters pointing to these services by name
    # e.g., cluster 'hello-skill' points to 'hello-skill:8080'

  # --- Example Skill Services ---

  # Hello Skill Service (the one we implement)
  hello-skill:
    build:
      context: ./services/hello
      dockerfile: Dockerfile
    environment:
      # Example of injecting a secret via env var (less ideal than file mount)
      MCP_SECRET: ${MCP_SECRET:-a-default-dev-secret-value}
      PORT: 8080 # Standardize port
    # No ports exposed to host; communication goes via Envoy sidecar
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s

  # Sentiment Analysis Skill (Placeholder - needs basic app with /health)
  sentiment-analysis:
    build:
      context: ./services/sentiment # Needs Dockerfile + app.py
      dockerfile: Dockerfile
    environment: { PORT: 8080 }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s

  # Customer Lookup Skill (Placeholder - needs basic app with /health)
  customer-lookup:
    build:
      context: ./services/customer-lookup # Needs Dockerfile + app.py
      dockerfile: Dockerfile
    environment: { PORT: 8080 }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s

  # Support System Service (Placeholder - needs basic app with /health)
  support-system:
    build:
      context: ./services/support-system # Needs Dockerfile + app.py
      dockerfile: Dockerfile
    environment: { PORT: 8080 }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 10s
      timeout: 3s
      retries: 5
      start_period: 5s

  # --- Demo Agent Application ---
  demo-agent:
    build:
      context: ./agent # Agent code using the SDK
      dockerfile: Dockerfile
    environment:
      # Configure SDK to use internal Auth0 flow (pointing to mock)
      AUTH0_DOMAIN: auth-mock:8080
      MCP_CLIENT_ID: demo-agent # Matches mock/Vault config
      MCP_CLIENT_SECRET: demo-secret # Matches mock/Vault config
      MCP_PROXY_URL: http://envoy:15000 # Point SDK to Envoy service name
      LOG_LEVEL: DEBUG # Enable debug logging for demo
      PYTHONUNBUFFERED: 1 # Ensure logs appear immediately
      # VAULT_TOKEN_PATH: /vault/secrets/mcp-token # Example if using external provider
    volumes:
      # Example: Mount a volume where Vault Agent *could* write secrets/token
      # - vault_secrets:/vault/secrets
    # Wait for Envoy and target skills to be ready
    depends_on:
      envoy:
        condition: service_started # Basic check, real check needs admin endpoint
      hello-skill:
        condition: service_healthy
      sentiment-analysis:
        condition: service_healthy
      customer-lookup:
        condition: service_healthy
      support-system:
        condition: service_healthy

# volumes:
#   vault_secrets: # Example volume for sharing secrets if needed
```

*(Note: You would need to create dummy Dockerfiles and potentially simple Flask/FastAPI apps in `./services/sentiment`, `./services/customer-lookup`, and `./services/support-system` directories with a basic `/health` endpoint for the Docker Compose health checks to pass. The `wiremock` directory needs `mappings` and `__files` subdirectories with JSON files to mock Auth0 endpoints. The Vault setup script below covers Vault initialization.)*

### WireMock Setup (`./wiremock`)

Create these files:

`./wiremock/mappings/oauth-token.json`:

```json
{
  "priority": 1,
  "request": {
    "method": "POST",
    "url": "/oauth/token",
    "bodyPatterns": [
      { "equalToJson": { "grant_type": "client_credentials", "client_id": "demo-agent", "client_secret": "demo-secret", "audience": "https://mcp.example.com/" }, "ignoreArrayOrder": true, "ignoreExtraElements": true }
    ]
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "bodyFileName": "access_token.json",
    "transformers": ["response-template"]
  }
}
```

`./wiremock/__files/access_token.json`:

```json
{
  "access_token": "{{{jwt (jsonPath request.body '$.client_id') sub=(jsonPath request.body '$.client_id') aud=(array (jsonPath request.body '$.audience')) exp='+1h' iss='https://auth-mock/' nbf='now' iat='now' permissions=(array 'skills:invoke' 'data:read' 'tools:access') team='customer-success' agent_type='support' env='production'}}}",
  "scope": "skills:invoke data:read tools:access",
  "expires_in": 3600,
  "token_type": "Bearer"
}

```
*(Note: The `{{{jwt ...}}}` syntax is specific to WireMock's Handlebars JWT helper. Ensure your WireMock image includes necessary extensions if using complex helpers. Claims like `team`, `agent_type`, `env` are added directly here for the mock. The `aud` claim is correctly set as an array.)*

`./wiremock/mappings/jwks.json`:

```json
{
  "priority": 2,
  "request": {
    "method": "GET",
    "url": "/.well-known/jwks.json"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*" # Allow CORS for browser clients if needed
    },
    "bodyFileName": "jwks.json"
  }
}
```

`./wiremock/__files/jwks.json`:
Generate a public/private RSA key pair (e.g., using `openssl genrsa -out private.pem 2048` and `openssl rsa -in private.pem -pubout -out public.pem`). Use the **private key** to sign the JWT in the WireMock template (WireMock's helper *should* handle this if configured with the key) and place the corresponding **public key** in JWKS format here. Online tools or libraries (`python-jose`, `node-jose`) can help create the JWKS structure from the public key.

**Example `jwks.json` (replace with your actual public key details):**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "e": "AQAB", // Public exponent (usually AQAB)
      "kid": "wiremock-demo-key-1", // Key ID (must match 'kid' in JWT header if used)
      "alg": "RS256", // Algorithm
      "n": "u..." // Modulus (long base64url-encoded string from your public key)
    }
    // Add more keys if needed
  ]
}
```
**Important:** Getting JWT signing and JWKS correct in a mock can be tricky. **For simpler local demos, consider configuring Envoy's JWT filter with `insecure_skip_signature_verification: true` for the `auth0_jwks` provider (as noted in the Envoy config). This bypasses signature checking but is insecure for production.**

### Vault Initialization Script (`./vault/scripts/setup.sh`)

```bash
#!/bin/bash
# /vault/scripts/setup.sh

# Ensure script fails on error
set -e

echo "Waiting for Vault API to be ready at http://vault:8200..."
# Use curl to poll the Vault health endpoint
until curl -sf -o /dev/null http://vault:8200/v1/sys/health?standbyok=true; do
  echo "Vault not ready yet, sleeping..."
  sleep 2
done
echo "Vault API is ready."

# Use VAULT_TOKEN for authentication
export VAULT_TOKEN="root-token"
export VAULT_ADDR="http://vault:8200"

echo "--- Vault Setup Starting ---"

# Enable JWT auth backend (idempotent)
if ! vault auth list -format=json | jq -e '.["jwt/"]'; then
  echo "Enabling JWT auth backend at path 'jwt'..."
  vault auth enable jwt
else
  echo "JWT auth backend already enabled."
fi

# Get the accessor for the JWT auth backend (needed for entity alias)
JWT_ACCESSOR=$(vault auth list -format=json | jq -r '.["jwt/"].accessor')
if [ -z "$JWT_ACCESSOR" ]; then
  echo "ERROR: Could not get JWT auth mount accessor!"
  exit 1
fi
echo "JWT auth accessor: $JWT_ACCESSOR"

# Configure JWT auth backend
echo "Configuring JWT auth backend (JWKS URL, Bound Issuer)..."
vault write auth/jwt/config \
  jwks_url="http://auth-mock:8080/.well-known/jwks.json" \
  bound_issuer="https://auth-mock/" \
  oidc_discovery_url="http://auth-mock:8080" \
  default_role="agent" # Assign default role

# Create policy for agents (idempotent using read/write)
echo "Writing 'agent-policy'..."
vault policy write agent-policy - <<EOF
# Allow reading common secrets
path "secret/data/mcp/agents/common/*" {
  capabilities = ["read"]
}
# Allow reading agent-specific secrets based on entity name
path "secret/data/mcp/agents/{{identity.entity.name}}/*" {
  capabilities = ["read"]
}
# Allow reading team-specific secrets based on entity metadata
path "secret/data/mcp/agents/teams/{{identity.entity.metadata.team}}/*" {
  capabilities = ["read"]
}
EOF

# Create JWT role 'agent' (idempotent using read/write)
echo "Writing JWT role 'agent'..."
vault write auth/jwt/role/agent \
  role_type="jwt" \
  user_claim="sub" \
  bound_audiences="https://mcp.example.com/" \
  bound_claims_type="glob" \
  bound_claims='{"env": ["production", "staging"]}' `# Example: Allow specific envs` \
  token_policies="agent-policy" \
  token_ttl="1h" \
  token_max_ttl="2h"

# Enable KV v2 secrets engine at path 'secret' (idempotent)
if ! vault secrets list -format=json | jq -e '.["secret/"]'; then
  echo "Enabling KV v2 secrets engine at path 'secret'..."
  vault secrets enable -version=2 -path=secret kv
else
  echo "KV v2 secrets engine 'secret/' already enabled."
fi

# Write demo secrets (use -cas=0 to write only if key doesn't exist, or just overwrite)
echo "Writing demo secrets..."
vault kv put secret/mcp/agents/common/api-keys \
  stripe="sk_test_123..." \
  sendgrid="SG.abc..."

vault kv put secret/mcp/agents/demo-agent/credentials \
  api_key="demo-agent-key-$(date +%s)" \
  environment="development"

# Create Vault Identity Entity for the demo agent (idempotent)
echo "Creating Vault Identity Entity for 'demo-agent'..."
ENTITY_NAME="demo-agent"
ENTITY_ID=$(vault read identity/entity/name/${ENTITY_NAME} -format=json 2>/dev/null | jq -r .data.id)
if [ "$ENTITY_ID" == "null" ] || [ -z "$ENTITY_ID" ]; then
    echo "Entity '${ENTITY_NAME}' not found, creating..."
    ENTITY_ID=$(vault write -field=id identity/entity name="${ENTITY_NAME}" \
      metadata='team="customer-success"' \
      metadata='agent_type="support"' \
      metadata='env="production"')
    echo "Created entity ID: $ENTITY_ID"
else
    echo "Entity '${ENTITY_NAME}' already exists (ID: $ENTITY_ID). Updating metadata..."
    # Update metadata if needed (Vault >= 1.9)
    vault write identity/entity/id/${ENTITY_ID} \
      metadata='team="customer-success"' \
      metadata='agent_type="support"' \
      metadata='env="production"'
fi

# Create Vault Identity Alias for the demo agent (idempotent)
# The alias name MUST match the 'sub' claim from the mock JWT.
ALIAS_NAME="demo-agent" # Matches 'sub' claim in mock JWT
echo "Creating/Updating entity alias '${ALIAS_NAME}' for entity '${ENTITY_NAME}' on mount '${JWT_ACCESSOR}'..."
# Find existing alias ID, if any
ALIAS_ID=$(vault list -format=json identity/entity-alias/id | jq -r --arg name "$ALIAS_NAME" --arg accessor "$JWT_ACCESSOR" '.[] | select(startswith($name + "@" + $accessor))')

if [ -z "$ALIAS_ID" ]; then
    echo "Alias '${ALIAS_NAME}' not found, creating..."
    vault write identity/entity-alias name="${ALIAS_NAME}" \
      canonical_id="$ENTITY_ID" \
      mount_accessor="$JWT_ACCESSOR"
    echo "Created entity alias '${ALIAS_NAME}' linked to entity '${ENTITY_NAME}'."
else
     echo "Alias '${ALIAS_NAME}' already exists (ID: ${ALIAS_ID}). Ensuring link is correct..."
     # Update if necessary (e.g., if canonical_id changed, though unlikely here)
     vault write identity/entity-alias/id/${ALIAS_ID} \
       canonical_id="$ENTITY_ID" \
       mount_accessor="$JWT_ACCESSOR" > /dev/null
fi

echo "--- Vault Setup Complete ---"

```

### Demo Run

```bash
# Navigate to your project directory containing docker-compose.yaml and subdirectories
cd your-project-directory

# Optional: Set a host environment variable for the demo secret
export MCP_SECRET="my-super-secret-for-hello-$(date +%s)"

# Build images and start services in detached mode
echo "Building and starting services..."
docker-compose up --build -d

# Wait for services to become healthy (adjust sleep time as needed)
echo "Giving services time to initialize (check logs for details)..."
sleep 20 # Increase sleep time to allow for healthchecks and vault init

# Check status of containers
echo "--- Container Status ---"
docker-compose ps

# Follow logs from the demo agent (Ctrl+C to exit)
echo "--- Following demo-agent logs ---"
docker-compose logs -f demo-agent

# --- Expected output fragments in demo-agent logs ---
# INFO:mcp_agent:Using internal Auth0 Client Credentials flow for token management.
# INFO:mcp_agent:New token acquired via internal fetch, expires at: ...
# INFO:mcp_agent:MCPAgent initialized.
# INFO:support-agent:Looking up customer CUST-5678...
# DEBUG:mcp_agent:Calling POST /mcp://customer-lookup/customer
# INFO:support-agent:Retrieved customer: {'name': 'Mock Customer', ...}
# INFO:support-agent:Getting ticket TKT-1234...
# DEBUG:mcp_agent:Calling GET /mcp://support-system/tickets/TKT-1234
# INFO:support-agent:Retrieved ticket: {'subject': 'Mock Ticket Subject', ...}
# INFO:support-agent:Analyzing sentiment...
# DEBUG:mcp_agent:Calling POST /mcp://sentiment-analysis/analyze
# INFO:support-agent:Sentiment score: 0.95
# INFO:support-agent:Generating response...
# DEBUG:mcp_agent:Calling POST /mcp://response-generator/generate
# INFO:support-agent:Generated response (partial): {'text': 'Mock generated response...', ...}
# INFO:support-agent:Writing response to ticket TKT-1234...
# DEBUG:mcp_agent:Calling PUT /mcp://support-system/tickets/TKT-1234/responses
# INFO:support-agent:Wrote response to ticket TKT-1234. Result: {'status': 'success', ...}
# INFO:support-agent:Ticket processed successfully: {'ticket_id': ..., 'sentiment_score': 0.95, ...}
# INFO:mcp_agent:Closing MCPAgent SDK...
# INFO:mcp_agent:MCPAgent SDK closed.

# --- Check other logs ---
# OPA logs (should show policy decisions): docker-compose logs opa
# Envoy logs (should show requests/routing): docker-compose logs envoy
# Vault logs (should show auth/secret access): docker-compose logs vault
# Skill logs (should show requests received): docker-compose logs hello-skill

# Clean up all services and networks
# echo "Cleaning up..."
# docker-compose down -v --remove-orphans
```

## 6. Advanced Control Plane Features

Building the core Identity, Policy, and Secrets components provides a solid foundation. Here are some advanced features to consider for a production-ready agent control plane.

### 6.1 Dynamic Agent Registration and Provisioning

Instead of manually defining each agent in Auth0, Vault, and potentially OPA configuration, implement a self-service registration system. This system would expose an API developers can use to programmatically onboard new agents.

```hcl
# Example Terraform for API Gateway + Lambda for agent registration
provider "aws" {
  region = "us-west-2"
}

variable "auth0_domain" {}
variable "auth0_management_client_id" {}
variable "auth0_management_client_secret" {}
variable "vault_addr" {}
variable "vault_token" {} # Consider Vault AppRole or AWS auth for Lambda instead

resource "aws_iam_role" "agent_registration_lambda_role" {
  name = "agent-registration-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
    }],
  })
  # Add policies allowing access to Auth0 Mgmt API (via secrets) and Vault
}

resource "aws_lambda_function" "agent_registration" {
  function_name = "agent-registration"
  handler       = "index.handler" # e.g., Node.js or Python handler
  runtime       = "python3.9" # Example runtime
  role          = aws_iam_role.agent_registration_lambda_role.arn
  # package_type  = "Zip"
  # filename      = "path/to/lambda_package.zip"

  environment {
    variables = {
      AUTH0_DOMAIN     = var.auth0_domain
      # Store sensitive creds securely (e.g., Secrets Manager)
      AUTH0_MGMT_CLIENT_ID_SECRET_ARN = "arn:aws:secretsmanager:..."
      AUTH0_MGMT_CLIENT_SECRET_SECRET_ARN = "arn:aws:secretsmanager:..."
      VAULT_ADDR       = var.vault_addr
      # VAULT_ROLE_ID_SECRET_ARN = "..." # Better auth for Lambda
      # VAULT_SECRET_ID_SECRET_ARN = "..."
    }
  }
  # Add VPC config if Lambda needs to access private resources (like Vault)
}

# API Gateway Setup
resource "aws_apigatewayv2_api" "mcp_api" {
  name          = "mcp-control-api"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.mcp_api.id
  integration_type = "AWS_PROXY"
  integration_uri  = aws_lambda_function.agent_registration.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_agent" {
  api_id    = aws_apigatewayv2_api.mcp_api.id
  route_key = "POST /agents"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
  # Add authorization (e.g., JWT authorizer configured for developers)
  # authorization_type = "JWT"
  # authorizer_id = aws_apigatewayv2_authorizer.jwt_authorizer.id
}

resource "aws_apigatewayv2_stage" "default" {
  api_id = aws_apigatewayv2_api.mcp_api.id
  name   = "$default"
  auto_deploy = true
}
```

The registration Lambda function would:

1.  Authenticate and authorize the developer making the request (via API Gateway authorizer).
2.  Validate the requested agent configuration (name, type, team, environment, requested permissions/scopes).
3.  Interact with the Auth0 Management API to create an M2M application.
4.  Register the agent's metadata in a central Agent Registry (e.g., DynamoDB, RDS).
5.  Interact with the Vault API (authenticating securely) to create Identity entities/aliases and potentially seed initial secrets or configure dynamic secret roles.
6.  Optionally update OPA data sources if policy relies on external data about agents.
7.  Generate and securely return the agent's initial credentials (Client ID, Client Secret) to the developer (e.g., via a secure channel or temporary secret store).

### 6.2 Layered Policy System

As your agent fleet grows, managing policies can become complex. A layered policy model in OPA allows for better organization and reduces redundancy:

1.  **Global policies:** Rules that apply to *all* agents (e.g., default deny, token validation, basic off-hours restrictions).
2.  **Team policies:** Rules specific to agents belonging to a particular team (e.g., restricting access to certain services or data sources based on the team claim in the JWT).
3.  **Agent type policies:** Rules specific to categories of agents (e.g., 'support' agents vs. 'analysis' agents have different default access).
4.  **Agent-specific policies:** Overrides or specific grants/denials for individual agents (used sparingly).

This is achieved by structuring your Rego policies into different files (packages) and using the `import` keyword in the main policy entry point to load and evaluate rules from different layers.

```rego
# --- Main Policy: mcp/authz.rego ---
package mcp.authz

import future.keywords
import input.jwt as token
import input.request as request
import input.resource as resource

# Import policies from different layers/files
import data.mcp.policy.global
import data.mcp.policy.teams
import data.mcp.policy.agent_types
import data.mcp.policy.agents

# --- Default Decision ---
default allow := false # Deny by default

# --- Explicit Deny Evaluation ---
# Check if any policy layer explicitly denies the request.
# An explicit deny should typically override any allow.
deny[reason] { # Capture the reason for denial
  reason := global.deny_reasons[_] # Check global deny rules
}
deny[reason] {
  team := token.payload["https://mcp.example.com/team"]
  reason := teams.deny_reasons[team][_] # Check deny rules for the agent's team
}
# ... add similar checks for agent_type and agent_specific denies ...

# --- Core Allow Decision ---
# A request is allowed ONLY IF there is NO explicit deny AND at least one allow rule permits it.
allow if {
  count(deny) == 0 # No deny rule fired

  # Token must be valid and not expired (basic global checks)
  global.is_token_valid(token)

  # The request must be allowed by *at least one* of the policy layers.
  is_allowed_by_any_layer
}

# Rule that checks if any of the policy layers explicitly allows the action.
is_allowed_by_any_layer {
  global.allow # Check global allow rules
} else = is_allowed { # Use 'else' for cleaner OR logic
  team := token.payload["https://mcp.example.com/team"]
  teams.allow[team] # Check allow rules for the agent's team
} else = is_allowed {
  agent_type := token.payload["https://mcp.example.com/agent_type"]
  agent_types.allow[agent_type] # Check allow rules for the agent's type
} else = is_allowed {
  agent_id := token.payload.sub
  agents.allow[agent_id] # Check allow rules for the specific agent ID
}


# --- Example Team Policy: mcp/policy/teams.rego ---
package mcp.policy.teams

import future.keywords
import input # Access input directly if needed, or pass via function calls
import data.mcp.authz # Avoid circular imports if possible

# Deny customer-success team agents from accessing 'billing-system' service
deny_reasons["customer-success"] = reason {
   input.resource.id == "billing-system"
   reason := "Customer Success agents cannot access the billing system"
}

# Allow customer-success team agents to read customer data
allow["customer-success"] if {
   input.resource.id == "customer-data"
   input.request.method == "GET"
   input.jwt.payload.permissions contains "data:read"
}
# Add rules for other teams...
```

OPA can load external data (e.g., JSON files mapping agent IDs to specific permissions) alongside policy rules, allowing configuration to be managed separately from logic.

### 6.3 Rate Limiting and Circuit Breaking

Autonomous agents can potentially generate high request volumes or encounter downstream service failures. Integrating rate limiting and circuit breaking into the sidecar prevents abuse and improves system resilience.

Envoy has built-in filters for both:

```yaml
# Envoy Rate Limit Filter configuration example snippet
# (Requires a separate Rate Limit Service deployment, e.g., github.com/envoyproxy/ratelimit)
http_filters:
  # ... other filters (jwt_authn, lua, ext_authz) ...
  - name: envoy.filters.http.ratelimit # Note: Correct name is 'ratelimit', not 'rate_limit'
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.ratelimit.v3.RateLimit"
      domain: mcp_agent_limits # Domain used to configure limits in the Rate Limit Service
      failure_mode_deny: true # Deny requests if the rate limit service is unavailable
      # Define how descriptors are generated for the Rate Limit Service
      rate_limit_service:
        grpc_service:
          envoy_grpc:
            cluster_name: rate_limit_service # Cluster pointing to your rate limit service
          timeout: 0.1s # Short timeout for rate limit checks
        transport_api_version: V3

# --- Envoy Cluster Circuit Breaking example snippet ---
static_resources:
  clusters:
    - name: some_skill_service
      # ... other cluster config (type, lb_policy, load_assignment) ...
      outlier_detection: # Enable circuit breaking
        consecutive_5xx: 5 # Break after 5 consecutive 5xx errors
        interval: 10s # Check interval
        base_ejection_time: 30s # Eject host for 30s initially
        max_ejection_percent: 50 # Eject max 50% of hosts
        enforcing_consecutive_5xx: 100 # Enforce consecutive 5xx errors
      # Optional: Connection pool limits also contribute to resilience
      # circuit_breakers:
      #  thresholds:
      #    - priority: DEFAULT
      #      max_connections: 100
      #      max_pending_requests: 100
      #      max_requests: 100
      #      max_retries: 3
```

You would need to deploy a rate limit service (like the reference implementation backed by Redis) and configure it with limits for different descriptors (e.g., `{agent_id: <id>}`, `{skill: <name>}`). Circuit breaking is configured directly on Envoy's upstream clusters.

### 6.4 Observability Pipeline

A unified observability pipeline is critical for understanding agent behavior, debugging issues, and monitoring the health and security of the control plane. Envoy sidecars are excellent points to collect telemetry (metrics, logs, traces).

```yaml
# Example docker-compose.observability.yml to run alongside the main services
version: '3.8'

services:
  # Metrics: Prometheus scrapes Envoy sidecars and skills
  prometheus:
    image: prom/prometheus:v2.48.1 # Use a recent version
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090" # Expose Prometheus UI
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle' # Allows reload via API
    depends_on:
      - envoy # Ensure Envoy is started to be scraped

  # Dashboarding: Grafana visualizes metrics and logs
  grafana:
    image: grafana/grafana:10.3.3 # Use a recent version
    ports:
      - "3000:3000" # Expose Grafana UI
    volumes:
      - grafana_data:/var/lib/grafana # Persist Grafana data
      - ./grafana/provisioning:/etc/grafana/provisioning # Configure datasources/dashboards
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
      # GF_INSTALL_PLUGINS: some-plugin # Optional plugins
    depends_on:
      - prometheus
      - loki

  # Logging: Loki stores collected logs
  loki:
    image: grafana/loki:2.9.5 # Use a recent version
    ports:
      - "3100:3100" # Expose Loki API
    volumes:
      - ./loki/config:/etc/loki
      - loki_data:/loki
    command: -config.file=/etc/loki/loki-config.yaml # Loki configuration
    depends_on:
      - promtail # Depends on Promtail sending logs

  # Logging Agent: Promtail collects logs from containers and sends to Loki
  promtail:
    image: grafana/promtail:2.9.5 # Use matching version
    volumes:
      - /var/log:/var/log:ro # Standard host log path (may vary)
      - ./promtail:/etc/promtail # Promtail configuration
      - /var/lib/docker/containers:/var/lib/docker/containers:ro # Access Docker logs
      - /var/run/docker.sock:/var/run/docker.sock:ro # Needed for Docker service discovery
    command: -config.file=/etc/promtail/promtail-config.yaml

  # Tracing: Jaeger receives traces from Envoy and applications
  jaeger:
    image: jaegertracing/all-in-one:1.53 # Use a recent version
    ports:
      - "16686:16686" # Jaeger UI
      - "6831:6831/udp" # Agent - Thrift UDP
      - "6832:6832/udp" # Agent - Thrift Binary UDP
      - "5778:5778" # Agent - Config server
      - "14268:14268" # Collector - Thrift HTTP
      - "14250:14250" # Collector - Thrift gRPC
      - "9411:9411"   # Collector - Zipkin V2 HTTP
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ":9411" # Enable Zipkin collector endpoint
      # MEMORY_MAX_TRACES: 100000 # Optional: Adjust memory storage limits
    # depends_on: # Tracing is often best-effort; less strict dependency

volumes:
  prometheus_data: {}
  grafana_data: {}
  loki_data: {}
```

#### 6.4.1 Metrics

Envoy sidecars expose a `/stats/prometheus` endpoint (or similar depending on configuration) that provides detailed metrics about requests (volume, duration, size), upstream cluster health, connections, and filter-specific statistics (like authorization denial counts from the `ext_authz` filter). Prometheus can scrape this endpoint from each Envoy sidecar. Your agent and skill applications should also expose standard application metrics (e.g., using client libraries for Prometheus, OpenTelemetry, etc.).

Grafana integrates with Prometheus to build dashboards visualizing key metrics such as:

-   Request volume per agent, per skill, per team.
-   Error rates (HTTP 4xx/5xx) per agent/skill/endpoint.
-   Latency percentiles (p95, p99) through the sidecar and to upstream services.
-   Authorization denial rate and breakdown by reason (if exposed by OPA/Envoy metrics).
-   Secret lookup/rotation rates from Vault Agent metrics.
-   Resource utilization (CPU/Memory) per agent/skill pod.

#### 6.4.2 Logging

Centralize logs from all components for debugging and auditing:

-   **Envoy:** Access logs provide a record of every request processed by the sidecar, including source/destination, request method/path, response code, request duration, and crucial metadata like the `x-agent-id` header added by the Lua filter, and potentially OPA decision outcomes if configured. Filter logs capture errors or warnings from filters. Configure Envoy's access log format for JSON output.
-   **OPA:** Decision logs are critical for auditing. They record every policy evaluation, including the `input` document (containing agent identity, request details, resource context) and the `result` (allow/deny) with associated reasons. Policy errors are also logged. Configure OPA for JSON decision logging.
-   **Vault:** Audit logs provide an immutable record of all authenticated interactions with Vault (login attempts, secret read/write, policy changes), including the identity of the client (the agent's Vault identity). System logs capture operational issues. Ensure audit devices are enabled and configured for JSON output.
-   **Agents/Skills:** Application logs from your agent and skill services are essential. Implementing **structured logging** (e.g., JSON logs) and including correlation IDs (like the `x-request-id` header from Envoy) makes searching and analyzing logs across components much easier.

Logging agents like Promtail (used with Loki), Filebeat (with Elasticsearch/Logstash), or Fluentd can collect logs from container stdio or files and send them to a centralized logging backend like Loki, Elasticsearch, or a cloud provider's logging service. Grafana integrates with Loki via LogQL for powerful log querying.

#### 6.4.3 Distributed Tracing

Distributed tracing allows you to follow a single request as it traverses multiple services and infrastructure components. Envoy can initiate or join traces using standard headers (like W3C Trace Context, B3).

Configure Envoy's tracing provider (e.g., Zipkin, Jaeger, OpenTelemetry) to send traces to a collector. The Agent SDK and your skill services should be instrumented using OpenTelemetry (or similar) libraries to propagate trace context headers and create spans for internal operations (like SDK calls, database queries, business logic). This provides end-to-end visibility, invaluable for diagnosing latency or errors in complex agent workflows spanning multiple steps and services.

### 6.5 Auditing and Compliance

With identity, policy, and secrets managed centrally and observability data collected, creating a comprehensive audit trail becomes significantly more feasible and reliable compared to distributed, per-agent logging.

-   **Envoy Access Logs:** Provide a high-level record of agent activity (who called what service, when, with what result). Include `x-agent-id` and `x-request-id`.
-   **OPA Decision Logs:** Offer detailed proof of *why* a specific request was allowed or denied, linking the decision directly to the agent's identity and the policy input context. Correlate with `x-request-id`.
-   **Vault Audit Logs:** Verify when and by whom secrets were accessed, including the agent's Vault identity and associated metadata.
-   **Application Logs:** Provide context on what the agent or skill *did* internally after policy checks passed (e.g., "processed ticket TKT-1234", "updated customer record CUST-5678"). Include correlation IDs.

By collecting and correlating logs from these sources (e.g., using request/trace IDs), you build a powerful audit trail. Feed these correlated logs into a Security Information and Event Management (SIEM) system or a data lake for long-term storage, analysis, alerting on suspicious activity, and generating compliance reports. This enables you to answer critical questions for security and compliance:

-   Which agents accessed sensitive skill X or data source Y?
-   Were there any attempts by unauthorized agents to access restricted resources?
-   Can we demonstrate that access to resource Z is restricted based on team/environment policies?
-   When did agent A fetch credentials for database B, and what did it do afterwards?

## 7. Deployment Considerations

Implementing this stack requires careful consideration of deployment topologies and scalability.

### 7.1 Kubernetes Native Approach

Kubernetes is a natural fit for this architecture:

-   **Envoy:** Deploy as a **sidecar container** alongside each agent and skill pod. Service Meshes like Istio or Linkerd manage this injection and configuration automatically. If not using a full mesh, manually add the sidecar to Deployments or use tools like the Envoy Gateway project.
-   **OPA:** Can run as a **sidecar** (for lowest latency authz decisions) or as a **centralized Deployment/StatefulSet** scaled independently. Centralized deployment is simpler for managing policy bundles but adds network latency. Node-local deployment via DaemonSet is a hybrid option. OPA instances fetch policy bundles from a central source (e.g., S3, Git repo via CI/CD, OPA Management API).
-   **Vault:** Typically runs as a **StatefulSet** with a highly available storage backend (like Consul or integrated Raft storage) and automated unseal mechanisms (e.g., Auto-Unseal with Cloud KMS/HSM). The **Vault Agent Injector** (a Kubernetes Mutating Webhook Controller) automatically injects the Vault Agent sidecar and configures secret rendering/injection into application pods based on annotations.
-   **Auth0:** A managed cloud service; requires no self-hosting infrastructure beyond configuring necessary connections and rules.
-   **Agent Services/Skills:** Deploy as standard Kubernetes Deployments or StatefulSets. They interact with their local Envoy sidecar via `localhost:<port>`.

### 7.2 Scaling and Availability

-   **Envoy:** As a sidecar, scales horizontally with application pods. Monitor sidecar resource usage. If using a central Envoy gateway, scale it appropriately. Ensure the control plane providing Envoy configuration (e.g., Istio control plane, custom xDS server) is highly available.
-   **OPA:** Scale replicas based on authorization request load. Monitor query latency. Policy bundle updates should be efficient. Consider OPA's caching options. For very high load, explore sharding or advanced distribution.
-   **Vault:** Requires a robust **highly available cluster** setup (multiple replicas, reliable storage/HA backend). Monitor Vault performance and ensure Vault Agent caching is configured appropriately to reduce load on the Vault servers.
-   **Control Plane Services:** Custom registration or management APIs must be designed for scalability (stateless, load-balanced).

### 7.3 Secrets Rotation Automation

Vault Agent's secret injection via templates or environment variables **automatically handles secret rotation** for dynamic secrets and leased static secrets. When a secret lease nears expiry, Vault Agent requests a new secret/lease renewal from Vault, updates the local file/environment, and can optionally signal the application (e.g., via `SIGHUP` or executing a command) to reload its configuration. This **removes the burden of rotation logic from the application itself**.

## 8. Future Directions and Challenges

Building the "HTTP for Agents" is just the beginning. Several areas require further exploration and standardization:

### 8.1 Standardizing Agent Capabilities & Discovery

How do agents discover what skills or tools are available and their specific interfaces (inputs, outputs, schemas)? A standardized agent capability schema (perhaps extending OpenAPI, using function calling schemas, or a new standard) and a discovery mechanism (like a central registry queried via the control plane) are needed. This allows agents to dynamically find and interact with required capabilities securely through the sidecar infrastructure.

### 8.2 Balancing Autonomy and Control

Autonomous agents make decisions. How do we provide sufficient policy guardrails (safety, compliance, resource usage) without excessively constraining their effectiveness or adaptability? The layered policy approach helps, but defining appropriate, potentially dynamic policies for highly autonomous agents is a complex policy engineering challenge. Can OPA policies reference runtime agent state, goals, or adapt based on observed behavior?

### 8.3 LLMs and Policy

LLMs are core to many agents. Policy needs to extend beyond just external API calls. How do we enforce policies on:
    - **LLM Inputs:** Prevent sensitive data (PII, secrets) from being sent to the LLM (especially external ones)? Filter harmful prompts?
    - **LLM Outputs:** Ensure responses adhere to safety guidelines? Redact sensitive information? Prevent harmful or biased content generation?
This likely requires integrating policy checks *within* the agent's interaction loop with the LLM, possibly using dedicated content safety filters or extending the OPA/sidecar model to mediate LLM calls.

### 8.4 Graph-Based Authorization

Agent interactions can become complex graphs involving delegation, resource ownership, and multi-step workflows (Agent A, acting for User B, needs Skill C to access Data D owned by Team E). Standard RBAC/ABAC might struggle. Graph-based authorization models (like Google Zanzibar, OpenFGA, or extending OPA with graph data) could represent and enforce these complex relationships more effectively.

### 8.5 Developer Experience

While this infrastructure provides power, it also introduces complexity. Simplifying the developer experience is crucial:
    - Tools for bootstrapping new agents integrated with the control plane.
    - Easier ways to define, test, and deploy policies (Policy-as-Code).
    - Streamlined management of agent identities and credentials.
    - Integrated observability dashboards tailored for agent interactions.
    - Seamless integration into existing CI/CD pipelines and developer platforms.

## Conclusion

As AI agents move from experimental sidelines to critical business functions, the need for a robust, standardized control plane is no longer optional—it's a necessity. Hand-rolled, per-agent solutions for identity, policy, and secrets are unsustainable; they introduce security risks, hinder scalability, and slow down development.

By adopting battle-tested patterns from the world of microservices and API gateways—leveraging standard protocols and tools like Auth0/SPIFFE for identity, OPA for policy enforcement, Vault for secure secrets management, and Envoy as a ubiquitous, observable sidecar—we can build the foundational infrastructure agents desperately need.

This "HTTP for Agents" provides:

*   **Strong, Verifiable Identity:** Every agent action is attributable to a specific, authenticated identity.
*   **Fine-grained Authorization:** Control agent access to skills, data, and tools based on their identity, type, team, environment, and other contextual factors via externalized policies.
*   **Secure Secrets Management:** Eliminate hardcoded or long-lived credentials using short-lived, dynamically injected secrets.
*   **Unified Observability:** Gain deep visibility into agent behavior, interactions, and the security posture of the system through centralized metrics, logs, and traces.
*   **Accelerated Development:** Abstract away infrastructure complexity for agent builders, allowing them to focus on the agent's core intelligence and task execution.
*   **Enhanced Compliance:** Meet regulatory and internal auditing requirements with a comprehensive, centralized audit trail.

Building this layer unlocks the true potential of autonomous agents, allowing teams to deploy them safely, scalably, and with confidence. It's time to give agents the solid, enterprise-grade infrastructure they deserve.

Start experimenting with these components today. Share your experiences and challenges. Let's collaborate to define and build the future of agent infrastructure.
