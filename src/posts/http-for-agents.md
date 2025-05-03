---
author: Jonathan Haas
pubDate: 2025-05-03
title: "Building the HTTP for Agents: A Complete Guide to Agent Infrastructure"
description: "As AI agents grow from niche experiments to core infrastructure, we need a new control plane—identity, policy, and secrets—standardized and scalable. Here's how to build the HTTP layer for autonomous agents, from Envoy sidecars to Vault-backed secrets and a Python SDK."
featured: false
draft: false
tags:
  - ai-infrastructure
  - identity
  - authorization
  - policy-engine
  - observability
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

  # Define scopes representing capabilities or permissions within the control plane
  scopes {
    value = "skills:invoke"
    description = "Invoke registered skills"
  }

  scopes {
    value = "tools:access"
    description = "Access registered tools"
  }

  scopes {
    value = "data:read"
    description = "Read from registered data sources"
  }

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
apiVersion: security.spiffe.io/v1beta1
kind: SpiffeID
metadata:
  name: support-triage-agent
  namespace: agents
spec:
  # Define the SPIFFE ID structure
  dnsNames:
  - support-triage-agent.agents.svc.cluster.local # Common DNS representation
  # Select the Kubernetes pods that should receive this identity
  selector:
    app: support-triage-agent
    environment: production
  # Optional: Federation configuration if interacting with external trust domains
  federatesWith:
  - trustDomain: example.com
    bundleEndpointURL: https://spiffe-bundle.example.com
```

In a SPIFFE-based setup, the Envoy sidecar would use mTLS with the SPIFFE identity to authenticate the agent workload. OPA policies could then use the extracted SPIFFE ID (e.g., from the client certificate) as the subject for authorization decisions, potentially fetching additional metadata about the workload from a separate identity registry if needed. Both Auth0 JWTs and SPIFFE provide strong, verifiable identity signals that are crucial for the authorization layer.

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
  # The request path is split into parts by the Envoy Lua filter.
  # input.request.path[0] is usually the empty string before the first '/'
  # input.request.path[1] is the first part, e.g., "mcp:"
  # input.request.path[2] is the second part, e.g., "skill-name"
  # input.request.path[3] is the third part, e.g., "invoke_skill" -- This is the 'action' verb we'll map

  action_verb := input.request.path[3] # Assuming path structure like /mcp://service/action/...

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

  # Extract the service name from the path (e.g., 'sentiment-analysis' from /mcp://sentiment-analysis/...)
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
  high_risk_methods := ["PUT", "POST", "DELETE", "PATCH"] # Consider specific paths too

  # Check if the request method is considered high-risk
  high_risk_methods contains input.request.method

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
        -- Called before request is sent to upstream
        function envoy_on_request(request_handle)
          -- Access the JWT payload stored in metadata by the jwt_authn filter
          local metadata = request_handle:streamInfo():dynamicMetadata()
          local jwt_payload = metadata:get("envoy.filters.http.jwt_authn")["jwt_payload"]

          if not jwt_payload then
            -- This should not happen if jwt_authn filter is configured correctly
            -- and 'requires' rule matched, but good for safety.
            -- If JWT auth is optional, handle missing payload here.
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
              id = path_parts[2], -- Service name is the second part after /mcp://
              metadata = service_metadata(path_parts[2]) -- Fetch/derive resource metadata
            }
          }

          -- Encode the OPA input as JSON and add it as a header.
          -- The ext_authz filter is configured to read this specific header.
          request_handle:headers():add("x-opa-input", cjson.encode(opa_input))
        end

        -- Helper functions for Lua script
        function split_path(path)
          local parts = {}
          -- Simple split by '/', handling potential empty strings at start/end
          for part in string.gmatch(path, "([^/]+)") do
            table.insert(parts, part)
          end
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
            ["hello-skill"] = { team = "platform", environment = "production" },
            ["sentiment-analysis"] = { team = "ml", environment = "production" },
            ["customer-lookup"] = { team = "customer-success", environment = "production" }
            -- Add metadata for other services...
          }
          -- Return metadata if found, or default unknown metadata
          return metadata_map[service] or { team = "unknown", environment = "unknown" }
        end

        -- Called after response is received from upstream (useful for observability headers)
        function envoy_on_response(response_handle)
          -- Add trace ID for debugging/correlation
          response_handle:headers():add("x-mcp-trace-id", response_handle:streamInfo():requestId())

          -- Optionally add metrics headers (less common, metrics usually scraped)
          -- local metrics = { ... }
          -- response_handle:headers():add("x-mcp-metrics", cjson.encode(metrics))
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
              - exact: "x-agent-id" # Allow the agent ID header added by Lua (OPA doesn't add it, but needed upstream)
              - prefix: "x-mcp-" # Allow any custom headers OPA or Lua might add starting with x-mcp-

  # 4. Lua Filter (Post-Authz/Secret Injection Mock):
  #    In a real scenario, Vault Agent or a dedicated secret injection filter
  #    would make secrets available to the application container.
  #    This second Lua filter *could* potentially add sensitive headers based
  #    on successful authz & fetched secrets, but *directly adding secrets as headers
  #    is generally NOT recommended* due to security risks (leaking in logs, etc.).
  #    This filter is kept here primarily to show where post-authz logic happens,
  #    and as a *mock* for concepts like adding a request ID or marking 'secret injected'.
  - name: envoy.filters.http.lua
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
      inline_code: |
        -- Called before request is sent to upstream, after ext_authz
        function envoy_on_request(request_handle)
          -- Secret injection from Vault:
          -- In a real implementation, this would use Vault Agent or
          -- a custom filter/mechanism to inject secrets directly into
          -- the application environment or a file, *not* as headers.
          -- Envoy could potentially interact with a Vault sidecar/agent here.

          -- For demonstration purposes, we'll just add some headers:
          request_handle:headers():add("x-secret-injected", "true")
          request_handle:headers():add("x-request-id", request_handle:streamInfo():requestId()) # Add Envoy Request ID
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
5.  More importantly, the route configuration (not fully detailed above for brevity, but shown in the full config later) uses the `<service-name>` part from the original path (`sentiment-analysis`) to dynamically select the correct **upstream cluster**. The cluster name is typically derived directly from the service name (e.g., the `sentiment-analysis` cluster).
6.  The request is then routed to the selected upstream cluster with the rewritten path (`/analyze`).

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
# - Service-specific permission check failure
# - Environment mismatch
# - Team mismatch
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
  name = "support-triage-agent" # Name derived from the JWT 'sub' or a mapping
  metadata = { # Store metadata about the agent, e.g., from Auth0 custom claims
    team = "customer-success"
    agent_type = "support"
    environment = "production"
  }
}

# Link the Auth0 client ID (from JWT 'sub') to the Vault Identity entity
resource "vault_identity_entity_alias" "agent_jwt" {
  name = auth0_client.agent_app.client_id # The 'sub' claim from the JWT (Auth0 client_id@clients)
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
2.  The agent (or more commonly, a Vault Agent sidecar/injector) presents the JWT to Vault's `/auth/jwt/login` endpoint (or uses its SPIFFE ID for mTLS auth).
3.  Vault validates the JWT (or SPIFFE ID), matches it to a Vault Identity Entity via an Alias, and issues a short-lived Vault token based on the configured Role (`agent`) and the Entity's policies (`agent-base`). The Vault token is bound to this specific agent's identity and metadata.
4.  The agent (or Vault Agent) uses this Vault token to read static secrets (e.g., `secret/data/mcp/agents/common/api-keys`) or request dynamic credentials (e.g., `database/creds/support-readonly`).
5.  Secrets/credentials obtained via Vault tokens are short-lived and automatically rotated by Vault when their lease expires.

```python
# Example Python snippets showing Vault interaction (typically done by Vault Agent)
def fetch_vault_token(jwt_token, vault_addr="http://vault:8200"):
    """Exchange JWT for a Vault token."""
    resp = requests.post(
        f"{vault_addr}/v1/auth/jwt/login",
        json={"jwt": jwt_token, "role": "agent"} # Use the 'agent' role
    )
    resp.raise_for_status()
    # The client_token returned here has policies bound based on the agent's identity
    return resp.json()["auth"]["client_token"]

def get_db_credentials(vault_token, vault_addr="http://vault:8200"):
    """Fetch dynamic DB credentials using a Vault token."""
    headers = {"X-Vault-Token": vault_token}
    resp = requests.get(
        f"{vault_addr}/v1/database/creds/support-readonly", # Use the dynamic role path
        headers=headers
    )
    resp.raise_for_status()
    # This returns username/password valid for a short lease
    return resp.json()["data"]

def get_static_secret(vault_token, path, vault_addr="http://vault:8200"):
     """Fetch a static secret using a Vault token."""
     headers = {"X-Vault-Token": vault_token}
     resp = requests.get(
         f"{vault_addr}/v1/secret/data/{path}", # Using KV v2 path
         headers=headers
     )
     resp.raise_for_status()
     # Returns the secret data
     return resp.json()["data"]["data"] # KV v2 wraps data

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

This is the most secure and developer-friendly way to handle secrets, as the agent application doesn't need to know anything about fetching tokens or secrets from Vault directly.

```hcl
# Example Vault Agent configuration (config.hcl)
# auth block defines how the agent authenticates to Vault
auto_auth {
    method "jwt" { # Configure the JWT auth method
        mount_accessor = "auth_jwt_..." # The accessor ID for the JWT auth mount

        config {
            path = "auth/jwt/login"
            role = "agent" # The Vault role to use
            # How the agent obtains the JWT - e.g., reading from a file
            # in a Kubernetes projected service account token volume
            jwt_file = "/var/run/secrets/kubernetes.io/serviceaccount/token"
            # Or if agent gets JWT from Auth0 itself:
            # jwt = "..." # The actual JWT string (less common/secure)
        }
    }

    # Sink block defines where the obtained Vault token is placed
    sink "file" {
        config {
            path = "/home/vault/.vault-token" # Write the token to a file
            mode = 0600
        }
    }
}

# template block defines which secrets to fetch and how to render them
template {
  # Source path in Vault (KV v2 example)
  source      = "/secret/data/mcp/agents/demo-agent/credentials.ctmpl"
  # Destination file path where the rendered secret will be written
  destination = "/etc/app/config/agent_credentials.json"
  perms       = 0400 # File permissions

  # Optional command to run after the file is updated (e.g., signal app)
  # command = "killall -HUP agent-app"
}

# Example Consul-Template syntax for the source template file (.ctmpl)
# /secret/data/mcp/agents/demo-agent/credentials.ctmpl
{{ with secrets "secret/data/mcp/agents/demo-agent/credentials" }}
{
  "api_key": "{{ .Data.data.api_key }}", # Access the secret data
  "environment": "{{ .Data.data.environment }}"
}
{{ end }}

# Example template for dynamic database credentials
# /database/creds/support-readonly.ctmpl
{{ with secret "database/creds/support-readonly" }}
{
  "db": {
    "host": "customer-db.example.com",
    "port": 5432,
    "username": "{{ .Data.username }}",
    "password": "{{ .Data.password }}",
    "database": "customer"
  }
}
{{ end }}
```

This approach ensures:

-   Credentials never touch disk in plaintext outside of the Vault Agent context.
-   Rotation happens automatically before expiry.
-   Zero application changes are required for secret rotation (if the app can read configuration files dynamically or is signaled).

## 4. Agent SDK (Python)

To make agent development easy, provide an SDK that abstracts away the complexity of token management, calling the sidecar, and potentially interacting with other control plane features.

```python
# mcp_agent.py
import os
import time
import json
import logging
import threading
import requests
import re # Needed for workflow template parsing
from typing import Dict, Any, Optional, List, Union
from datetime import datetime # Needed for hello-skill example

class MCPAgent:
    """Machine Control Plane Agent SDK"""

    def __init__(
        self,
        client_id: str = None,
        client_secret: str = None,
        auth0_domain: str = None,
        audience: str = "https://mcp.example.com/",
        proxy_url: str = "http://127.0.0.1:15000", # URL of the Envoy sidecar
        token_refresh_margin: int = 300,  # Refresh token 5 minutes before expiry
        logger: logging.Logger = None
    ):
        """Initialize the MCP Agent SDK.

        Args:
            client_id: Auth0 Client ID (defaults to MCP_CLIENT_ID env var)
            client_secret: Auth0 Client Secret (defaults to MCP_CLIENT_SECRET env var)
            auth0_domain: Auth0 domain (defaults to AUTH0_DOMAIN env var)
            audience: API audience (defaults to https://mcp.example.com/)
            proxy_url: URL of the Envoy sidecar (defaults to http://127.0.0.1:15000).
                       All agent traffic goes through this local proxy.
            token_refresh_margin: Seconds before expiry to refresh token
            logger: Custom logger (defaults to standard logging)
        """
        self.client_id = client_id or os.environ.get("MCP_CLIENT_ID")
        self.client_secret = client_secret or os.environ.get("MCP_CLIENT_SECRET")
        self.auth0_domain = auth0_domain or os.environ.get("AUTH0_DOMAIN")
        self.audience = audience
        self.proxy_url = proxy_url
        self.token_refresh_margin = token_refresh_margin
        self.logger = logger or logging.getLogger("mcp_agent")

        # Token state management
        self._access_token = None
        self._token_expiry = 0
        self._token_lock = threading.RLock() # Protect token access
        self._refresh_thread = None
        self._running = True

        # Validate required config for Auth0 token fetching
        if not all([self.client_id, self.client_secret, self.auth0_domain]):
            self.logger.warning(
                "Missing required Auth0 credentials. Token fetching will be disabled."
                "Ensure tokens are provided via other means (e.g., Vault Agent) "
                "if not using Client Credentials Flow directly."
            )
            self._can_fetch_token = False
        else:
             self._can_fetch_token = True
             # Initial token fetch (only if credentials provided)
             try:
                 self._fetch_token()
                 # Start token refresh thread
                 self._refresh_thread = threading.Thread(
                     target=self._token_refresh_loop,
                     daemon=True # Thread exits when main program exits
                 )
                 self._refresh_thread.start()
             except Exception as e:
                 self.logger.error(f"Initial token fetch failed: {e}")
                 # Decide if this is a fatal error or if agent can proceed without a token
                 # (e.g., if authentication is handled solely by SPIFFE/Vault Agent)
                 raise # For this example, we treat it as fatal if creds are provided

    def _fetch_token(self) -> None:
        """Fetch a new access token from Auth0."""
        if not self._can_fetch_token:
            self.logger.debug("Token fetching disabled, skipping.")
            return

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
                f"New token acquired, expires at: "
                f"{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self._token_expiry))}"
            )
        except requests.exceptions.RequestException as e:
            self.logger.error(f"Failed to fetch token from Auth0: {str(e)}")
            # Depending on robustness needs, implement retry logic here
            raise # Re-raise the exception

    def _token_refresh_loop(self) -> None:
        """Background thread to refresh the token before it expires."""
        while self._running and self._can_fetch_token:
            with self._token_lock:
                time_to_expiry = self._token_expiry - time.time()

            # Refresh if within the margin or if already expired
            if time_to_expiry < self.token_refresh_margin:
                self.logger.info(f"Token expiring soon ({time_to_expiry:.0f}s), refreshing...")
                try:
                    self._fetch_token()
                    # After successful refresh, recalculate sleep time
                    with self._token_lock:
                         time_to_expiry = self._token_expiry - time.time()
                except Exception as e:
                    self.logger.error(f"Token refresh failed: {e}")
                    # Back off and retry later on failure
                    time.sleep(30) # Wait 30 seconds before next attempt after failure
                    continue # Skip to next loop iteration

            # Determine sleep duration: half the remaining time to expiry, or a minimum/maximum
            sleep_duration = max(60, time_to_expiry / 2) # Don't sleep for less than a minute
            sleep_duration = min(sleep_duration, self.token_refresh_margin / 2 or 300) # Don't sleep for excessively long (max 5 mins if margin is large)
            self.logger.debug(f"Next token refresh check in {sleep_duration:.0f} seconds.")
            time.sleep(sleep_duration)

    def get_token(self) -> Optional[str]:
        """Get the current valid access token, refreshing if needed."""
        if not self._can_fetch_token:
            # If token fetching is disabled, assume token is managed externally
            # and might be available elsewhere (e.g., env var, file).
            # Or, if using mTLS/SPIFFE, no explicit Bearer token is needed by the SDK.
            # The sidecar would handle authentication.
            # This SDK would ideally support different auth methods.
            self.logger.debug("Token fetching disabled, returning None.")
            return None # Or retrieve from an environment variable/file managed by Vault Agent

        with self._token_lock:
            # Check if token needs refreshing NOW (e.g., if called right before expiry)
            if time.time() > self._token_expiry - 5: # Small buffer before margin
                 self.logger.warning("Token called close to expiry, attempting synchronous refresh.")
                 try:
                     self._fetch_token() # Attempt synchronous refresh
                 except Exception as e:
                      self.logger.error(f"Synchronous token refresh failed: {e}")
                      # Depending on error handling, could return expired token or raise error
                      # For now, re-raise. The caller might retry.
                      raise

            # Return the (now refreshed) token
            return self._access_token

    def _make_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Helper to make HTTP requests via the sidecar with token."""
        headers = kwargs.pop("headers", {})
        token = self.get_token() # Get current token (refreshes if needed)
        if token:
           headers["Authorization"] = f"Bearer {token}"

        full_url = f"{self.proxy_url}{url}" # Requests always go to the local sidecar proxy

        # Basic retry logic
        retry_count = kwargs.pop("retry_count", 2)
        timeout = kwargs.pop("timeout", 30)

        for attempt in range(retry_count + 1):
            try:
                response = requests.request(
                    method,
                    full_url,
                    headers=headers,
                    timeout=timeout,
                    **kwargs # Pass remaining kwargs (json, params, etc.)
                )

                # Check for specific retryable conditions like 401 (if token might be stale)
                if response.status_code == 401 and self._can_fetch_token and attempt < retry_count:
                    self.logger.warning("Received 401 Unauthorized. Attempting token refresh and retry.")
                    try:
                        self._fetch_token() # Synchronous token refresh
                        token = self._access_token # Get the new token
                        headers["Authorization"] = f"Bearer {token}" # Update headers
                        time.sleep(0.5) # Short pause before retry
                        continue # Retry the request
                    except Exception as e:
                        self.logger.error(f"Token refresh failed during 401 handling: {e}")
                        # If refresh fails, cannot retry successfully, break and raise original 401 or refresh error
                        break # Exit retry loop

                response.raise_for_status() # Raise HTTPError for 4xx/5xx responses
                return response

            except requests.exceptions.RequestException as e:
                if attempt < retry_count:
                    self.logger.warning(f"Request failed ({method} {full_url}), retrying ({attempt+1}/{retry_count}): {e}")
                    # Exponential backoff with jitter
                    time.sleep(2 ** attempt + random.uniform(0, 1)) # Add jitter
                    continue # Continue to the next attempt
                self.logger.error(f"Request failed after {retry_count} retries ({method} {full_url}): {e}")
                raise # Re-raise exception after retries exhausted

    def call_skill(
        self,
        skill_name: str,
        path: str, # Path on the skill's API (e.g., /analyze)
        payload: Optional[Dict[str, Any]] = None,
        timeout: int = 30,
        retry_count: int = 2
    ) -> Dict[str, Any]:
        """Call a skill through the MCP sidecar.
           Constructs the mcp:// URL and handles auth via the sidecar.
        """
        # Construct the mcp:// URL for the sidecar
        # The sidecar uses this format to identify the target service
        skill_url = f"/mcp://{skill_name}{path}"
        self.logger.debug(f"Calling skill: {skill_url}")

        response = self._make_request(
            "POST", # Skills typically use POST with a payload
            skill_url,
            json=payload or {}, # Send payload as JSON body
            timeout=timeout,
            retry_count=retry_count
        )
        return response.json() # Assume JSON response

    def get_data(
        self,
        data_source: str,
        path: str, # Path on the data source's API (e.g., /customers/123)
        params: Optional[Dict[str, str]] = None,
        timeout: int = 30,
        retry_count: int = 2
    ) -> Dict[str, Any]:
        """Read data from a registered data source via the MCP sidecar."""
        data_url = f"/mcp://{data_source}{path}"
        self.logger.debug(f"Getting data: {data_url}")

        response = self._make_request(
            "GET", # Data reads typically use GET
            data_url,
            params=params or {}, # Send parameters as query string
            timeout=timeout,
            retry_count=retry_count
        )
        return response.json() # Assume JSON response

    def write_data(
        self,
        data_sink: str,
        path: str, # Path on the data sink's API (e.g., /tickets/456/status)
        payload: Dict[str, Any], # Data to write (JSON body)
        timeout: int = 30,
        retry_count: int = 2
    ) -> Dict[str, Any]:
        """Write data to a registered data sink via the MCP sidecar."""
        data_url = f"/mcp://{data_sink}{path}"
        self.logger.debug(f"Writing data: {data_url}")

        response = self._make_request(
            "PUT", # Data writes typically use PUT or POST
            data_url,
            json=payload, # Send data as JSON body
            timeout=timeout,
            retry_count=retry_count
        )
        return response.json() # Assume JSON response, may be empty

    # --- Declarative Workflow Execution (Conceptual Sketch) ---
    # This section outlines how a *simple* workflow engine could be built
    # *on top* of the SDK's core call methods. A real-world workflow engine
    # would require significantly more sophisticated state management,
    # error handling (retries, compensation), parallel execution,
    # conditional logic, looping, and templating than shown here.
    # This is a basic synchronous execution sketch.
    def run_workflow_sketch(
        self,
        workflow_definition: Dict[str, Any], # Parsed YAML/JSON workflow
        initial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a workflow defined declaratively (Sketch)."""
        context = initial_context or {}
        outputs = {} # Store outputs mapped by step name

        self.logger.info(f"Starting workflow: {workflow_definition.get('name', 'Unnamed Workflow')}")

        for i, step in enumerate(workflow_definition.get("steps", [])):
            step_name = step.get("name", f"step-{i}")
            skill_name = step.get("skill")
            path = step.get("path")
            method = step.get("method", "POST").lower() # Default to POST

            if not skill_name or not path:
                self.logger.error(f"Step '{step_name}' missing skill or path. Skipping.")
                continue # In real engine: raise error, handle failure

            self.logger.info(f"Executing step {i+1}: '{step_name}' calling {skill_name}{path} ({method.upper()})")

            # Process input template (VERY basic implementation for demo)
            # A real engine would use a robust templating library like Jinja2 or dedicated workflow templating
            step_input = {}
            input_template = step.get("input", {})
            for key, template in input_template.items():
                # Simple support for $inputs.key and $outputs.step_name.key
                if isinstance(template, str):
                    if template.startswith("$inputs."):
                        input_key = template.split(".", 1)[1]
                        step_input[key] = context.get(input_key) # Get from initial context
                    elif template.startswith("$outputs."):
                        # Example: $outputs.analyze-sentiment.score
                        output_path = template.split(".", 1)[1]
                        path_parts = output_path.split('.')
                        value = outputs # Start navigating from accumulated outputs
                        try:
                           for part in path_parts:
                               if value is not None:
                                   value = value.get(part)
                               else:
                                   break # Path doesn't exist
                           step_input[key] = value
                        except AttributeError:
                           self.logger.warning(f"Could not resolve output path '{output_path}' for step '{step_name}'.")
                           step_input[key] = None # Or handle as error
                    else:
                        step_input[key] = template # Treat as literal value
                else:
                    step_input[key] = template # Non-string input

            # Process path parameters if needed (basic regex replace)
            processed_path = path
            if "$inputs." in processed_path:
                 for match in re.findall(r'\$inputs\.([a-zA-Z0-9_.]+)', processed_path):
                     # Resolve from initial context or outputs
                     param_value = context.get(match) # First check inputs
                     if param_value is None and "." in match: # Check outputs if not in inputs and looks like output path
                         path_parts = match.split('.')
                         value = outputs
                         try:
                             for part in path_parts:
                                 if value is not None:
                                     value = value.get(part)
                                 else: break
                             param_value = value
                         except AttributeError:
                             self.logger.warning(f"Could not resolve path parameter '{match}' for step '{step_name}'.")
                             param_value = "" # Default empty or handle error
                     elif param_value is None:
                          self.logger.warning(f"Could not resolve input parameter '{match}' for step '{step_name}'.")
                          param_value = "" # Default empty or handle error

                     processed_path = processed_path.replace(f"$inputs.{match}", str(param_value or "")) # Replace, handle None

            result = None
            try:
                if method == "get":
                    # GET requests use params, not json body
                    result = self.get_data(skill_name, processed_path, params=step_input)
                elif method == "put":
                     result = self.write_data(skill_name, processed_path, payload=step_input)
                else: # Default POST or others
                    result = self.call_skill(skill_name, processed_path, payload=step_input)

                self.logger.info(f"Step '{step_name}' completed successfully.")
                # Store output mapped to the step name
                outputs[step_name] = result # Store raw response or specific mapped output

            except Exception as e:
                self.logger.error(f"Step '{step_name}' failed: {e}")
                # In real engine: implement retry logic, error handling, compensation
                raise # Re-raise the exception for this sketch

            # Basic output mapping (store the whole result under the step name)
            # More sophisticated mapping like output: { new_key: $response.data.value }
            # would require a more advanced templating/mapping engine.
            # For this sketch, we just store the entire step result keyed by step_name.
            # The next steps can then reference this result via $outputs.step_name

        self.logger.info("Workflow finished.")
        return outputs # Return accumulated outputs from all steps

    def close(self) -> None:
        """Clean up resources (e.g., stop background threads)."""
        self._running = False
        if self._refresh_thread and self._refresh_thread.is_alive():
            # Give the refresh thread a moment to finish
            self._refresh_thread.join(timeout=1.0)
            if self._refresh_thread.is_alive():
                 self.logger.warning("Token refresh thread did not terminate gracefully.")

# Context manager support for 'with MCPAgent() as agent:'
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
        # Returning False would propagate exceptions, Returning True would suppress them.
        # Usually, you want to propagate exceptions from the SDK's use.
        return False

# Add dummy random module import for jitter in _make_request
import random
```

### Example Usage:

```python
# support_agent.py
import logging
from mcp_agent import MCPAgent
import os # Import os to check for token management strategy

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("support-agent")

def process_ticket(ticket_id, customer_id):
    """Process a support ticket using the agent infrastructure."""

    # Initialize the agent SDK.
    # Credentials can come from env vars (MCP_CLIENT_ID, MCP_CLIENT_SECRET, AUTH0_DOMAIN)
    # or be passed directly.
    # If using Vault Agent for token management, these env vars might be empty,
    # and the SDK would need to be adapted to get the token differently (e.g., from a file).
    try:
        # Using 'with' ensures the agent's background thread is cleaned up
        with MCPAgent() as agent:
            logger.info("MCPAgent initialized.")

            # Step 1: Look up customer information using a 'skill' (API call)
            # The SDK calls the local sidecar, which handles authz/routing to 'customer-lookup' service.
            customer = agent.call_skill(
                "customer-lookup", # Target service name
                "/customer", # Path on that service
                {"customer_id": customer_id} # Payload sent as JSON body
            )
            logger.info(f"Retrieved customer: {customer.get('name', 'N/A')}")

            # Step 2: Get ticket content from a 'data source'
            # SDK calls sidecar, which handles authz/routing to 'support-system' service.
            ticket = agent.get_data(
                "support-system",
                f"/tickets/{ticket_id}" # Path with ticket ID
                # GET request, so params would go here if needed: params={"expand": "details"}
            )
            logger.info(f"Retrieved ticket: {ticket.get('subject', 'N/A')}")

            # Step 3: Analyze sentiment using another 'skill'
            sentiment = agent.call_skill(
                "sentiment-analysis",
                "/analyze",
                {"text": ticket.get("description", "")}
            )
            logger.info(f"Sentiment score: {sentiment.get('score', 'N/A')}")

            # Step 4: Generate response based on sentiment and customer tier (another skill call)
            # This step demonstrates passing data retrieved from previous steps
            response = agent.call_skill(
                "response-generator",
                "/generate",
                {
                    "ticket": ticket, # Pass the full ticket data
                    "customer": customer, # Pass customer data
                    "sentiment": sentiment, # Pass sentiment result
                    "language": customer.get("preferred_language", "en")
                }
            )
            logger.info(f"Generated response (partial): {response.get('text', '')[:50]}...")

            # Step 5: Write response back to ticket system (a 'data sink')
            agent.write_data(
                "support-system",
                f"/tickets/{ticket_id}/responses", # Path for writing response
                {"response": response.get("text", "")} # Data to write
            )
            logger.info(f"Wrote response to ticket {ticket_id}.")

            # Return key results of the process
            return {
                "ticket_id": ticket_id,
                "customer_id": customer_id,
                "sentiment_score": sentiment.get("score"),
                "response_snippet": response.get("text", "")[:50] + "..." if response.get("text") else None
            }

    except Exception as e:
        logger.error(f"An error occurred during ticket processing for {ticket_id}: {e}", exc_info=True)
        raise # Re-raise the exception

if __name__ == "__main__":
    # Example usage:
    ticket_id = "TKT-1234"
    customer_id = "CUST-5678"

    # In a production environment, MCP_CLIENT_ID, MCP_CLIENT_SECRET, AUTH0_DOMAIN
    # would be provided via environment variables or mounted secrets.
    # Check if Auth0 credentials are set for the SDK to fetch tokens.
    if not os.getenv("MCP_CLIENT_ID"):
         logger.warning("Auth0 Client ID not set. The SDK expects environment variables MCP_CLIENT_ID, MCP_CLIENT_SECRET, and AUTH0_DOMAIN.")
         logger.warning("Assuming token is handled externally (e.g. Vault Agent providing token/headers to sidecar).")
         # You might need to mock or adjust the SDK for scenarios without direct Auth0 calls
         # For this demo, ensure they are set or the SDK will warn/fail initial fetch.
         # os.environ['MCP_CLIENT_ID'] = 'demo-agent'
         # os.environ['MCP_CLIENT_SECRET'] = 'demo-secret'
         # os.environ['AUTH0_DOMAIN'] = 'auth-mock:8080' # Pointing to the mock Auth0 server in docker-compose

    try:
        result = process_ticket(ticket_id, customer_id)
        logger.info(f"Ticket processed successfully: {result}")
    except Exception:
         logger.error("Ticket processing failed.")
```

### Declarative Workflow Definition (Sketch):

This YAML defines a simple sequence of steps. It's a basic illustration of the *concept* of declarative workflows, which would be executed by a specialized workflow engine component built on top of the Agent SDK.

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
      sentiment: $response

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
      ticket: $outputs.get-ticket.ticket # Pass full ticket object
      customer: $outputs.customer-lookup.customer # Pass full customer object
      sentiment: $outputs.analyze-sentiment.sentiment # Pass full sentiment object
      # classification: $outputs.classify-issue.classification # If classify step existed
      # Use || for basic default value if preferred_language is null/missing
      language: $outputs.customer-lookup.customer.preferred_language || "en"
    output:
      response: $response # Store the full response

  - name: save-response
    skill: support-system
    path: /tickets/$inputs.ticket_id/responses
    method: PUT
    input:
      # Get the response text from the generate-response step output
      response: $outputs.generate-response.response.text
      # Get send_draft from initial workflow inputs, provide default false
      is_draft: $inputs.send_draft || false
    output: {} # No output needed from this step
```

This YAML could be loaded and executed by a workflow engine built on top of the Agent SDK. The `run_workflow_sketch` function in the SDK provides a very basic example of how this *might* work, illustrating simple sequential execution and context passing.

```python
# This function would live in a separate workflow engine module, not the SDK itself
# but is included here to show how the SDK could be used.
# It's a simplified sketch and lacks many real-world workflow engine features.

from mcp_agent import MCPAgent
import yaml
import re # Needed for path parameter processing
import logging

logger = logging.getLogger("workflow-engine")

def run_workflow_sketch(workflow_path: str, inputs: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute a workflow defined in a YAML file using the MCPAgent SDK.

    THIS IS A BASIC SKETCH:
    A real-world workflow engine would need sophisticated features like:
    - Robust state management (persisting state between steps, handling crashes)
    - Comprehensive error handling (retries, compensation logic, alerting)
    - Parallel step execution
    - Conditional logic (if/else based on step results)
    - Looping and iteration over data
    - More advanced and flexible input/output mapping and templating
    - Integration with queues for asynchronous steps

    Args:
        workflow_path: Path to the YAML workflow definition file.
        inputs: Dictionary of initial inputs for the workflow.

    Returns:
        Dictionary of outputs captured from the workflow steps.
    """
    # Load workflow definition from YAML file
    try:
        with open(workflow_path, 'r') as f:
            workflow = yaml.safe_load(f)
    except FileNotFoundError:
        logger.error(f"Workflow file not found: {workflow_path}")
        raise
    except yaml.YAMLError as e:
        logger.error(f"Error parsing workflow YAML file {workflow_path}: {e}")
        raise

    # Initialize outputs dictionary to store results from steps
    outputs = {}

    # Create an MCPAgent instance
    # Assuming agent credentials/config are available via environment variables
    try:
        with MCPAgent() as agent:
            logger.info(f"MCPAgent initialized for workflow '{workflow.get('name', 'Unnamed')}'.")

            # Execute steps sequentially as defined in the YAML
            for i, step in enumerate(workflow.get("steps", [])):
                step_name = step.get("name", f"step-{i+1}")
                skill_name = step.get("skill")
                path = step.get("path")
                method = step.get("method", "POST").lower()

                if not skill_name or not path:
                    logger.error(f"Workflow step '{step_name}' is missing required 'skill' or 'path'. Skipping.")
                    continue # In a real engine, this might be a validation error before execution

                logger.info(f"Running workflow step {i+1}: '{step_name}' -> Calling {method.upper()} {skill_name}{path}")

                # --- Input Mapping and Templating (Basic) ---
                # This is a very simplified template processor.
                # It only handles direct substitution of $inputs.key and $outputs.step_name.key
                # A real engine needs a full templating language like Jinja2 or Go templating.
                step_input_payload = {} # For POST/PUT body or GET params
                input_template_map = step.get("input", {})

                for input_key, template_value in input_template_map.items():
                    if isinstance(template_value, str):
                        # Basic substitution: $inputs.some_key or $outputs.prev_step.data.field
                        resolved_value = template_value
                        # Replace $inputs.* references
                        for match in re.findall(r'\$inputs\.([a-zA-Z0-9_.]+)', resolved_value):
                            input_param_path = match.split('.')
                            current_value = inputs # Start with initial inputs
                            try:
                                for part in input_param_path:
                                    if current_value is not None and isinstance(current_value, dict):
                                        current_value = current_value.get(part)
                                    else:
                                         current_value = None # Path not found
                                         break
                                resolved_value = resolved_value.replace(f"$inputs.{match}", str(current_value if current_value is not None else '')) # Replace, handle None
                            except Exception:
                                logger.warning(f"Could not resolve $inputs parameter '{match}' for step '{step_name}'.")
                                resolved_value = resolved_value.replace(f"$inputs.{match}", '') # Replace with empty on error

                        # Replace $outputs.* references
                        for match in re.findall(r'\$outputs\.([a-zA-Z0-9_.]+)', resolved_value):
                             output_param_path = match.split('.')
                             current_value = outputs # Start with previous step outputs
                             try:
                                 for part in output_param_path:
                                     if current_value is not None and isinstance(current_value, dict):
                                         current_value = current_value.get(part)
                                     elif isinstance(current_value, list) and part.isdigit(): # Basic list index support
                                          index = int(part)
                                          if 0 <= index < len(current_value):
                                              current_value = current_value[index]
                                          else:
                                              current_value = None
                                              break
                                     else:
                                         current_value = None # Path not found or type mismatch
                                         break
                                 resolved_value = resolved_value.replace(f"$outputs.{match}", str(current_value if current_value is not None else '')) # Replace, handle None
                             except Exception:
                                  logger.warning(f"Could not resolve $outputs parameter '{match}' for step '{step_name}'.")
                                  resolved_value = resolved_value.replace(f"$outputs.{match}", '') # Replace with empty on error

                        # Handle basic default value || syntax
                        if "||" in resolved_value:
                            parts = resolved_value.split("||", 1)
                            primary = parts[0].strip()
                            default = parts[1].strip().strip('"').strip("'") # Basic string default
                            if not primary or primary == 'None': # Check if resolved primary value is empty/None string
                                resolved_value = default
                            else:
                                resolved_value = primary # Use the primary resolved value


                        # Attempt to parse as JSON if it looks like a dict/list
                        if resolved_value.startswith('{') and resolved_value.endswith('}') or \
                           resolved_value.startswith('[') and resolved_value.endswith(']'):
                           try:
                                resolved_value = json.loads(resolved_value)
                           except json.JSONDecodeError:
                                pass # Not valid JSON, treat as string

                        step_input_payload[input_key] = resolved_value

                    else:
                        # Not a string template, use value directly
                        step_input_payload[input_key] = template_value

                # --- Path Parameter Processing (Basic) ---
                processed_path = path
                if "$inputs." in processed_path:
                     for match in re.findall(r'\$inputs\.([a-zA-Z0-9_.]+)', processed_path):
                         # Resolve from initial inputs
                         input_param_path = match.split('.')
                         current_value = inputs
                         try:
                             for part in input_param_path:
                                 if current_value is not None and isinstance(current_value, dict):
                                     current_value = current_value.get(part)
                                 else:
                                      current_value = None
                                      break
                             processed_path = processed_path.replace(f"$inputs.{match}", str(current_value if current_value is not None else ''))
                         except Exception:
                              logger.warning(f"Could not resolve path parameter '{match}' for step '{step_name}'.")
                              processed_path = processed_path.replace(f"$inputs.{match}", '') # Replace with empty on error


                # --- Call Skill/Service via SDK ---
                step_result = None
                try:
                    if method == "get":
                        # For GET, step_input_payload becomes query params
                        step_result = agent.get_data(skill_name, processed_path, params=step_input_payload)
                    elif method == "put":
                        # For PUT, step_input_payload is the JSON body
                        step_result = agent.write_data(skill_name, processed_path, payload=step_input_payload)
                    else: # POST (default) and other methods
                        # For POST, step_input_payload is the JSON body
                        step_result = agent.call_skill(skill_name, processed_path, payload=step_input_payload)

                    logger.info(f"Step '{step_name}' completed successfully.")
                    # --- Output Mapping (Basic) ---
                    # Store the result based on the 'output' definition in the step.
                    # Currently, assumes "$response" maps the entire result.
                    output_mapping = step.get("output", {})
                    for output_key, output_path in output_mapping.items():
                        if output_path == "$response":
                            outputs[output_key] = step_result
                        else:
                             # Add more complex output mapping logic here if needed
                             logger.warning(f"Complex output mapping '{output_path}' not supported in this sketch for step '{step_name}'.")
                             pass # Ignore complex mapping for sketch

                except Exception as e:
                    logger.error(f"Error executing workflow step '{step_name}': {e}", exc_info=True)
                    # In a real engine, handle failure: retry, move to error state, etc.
                    raise # Re-raise the exception for this sketch

        logger.info(f"Workflow '{workflow.get('name', 'Unnamed')}' finished.")
        # The final accumulated 'outputs' dict represents the workflow result.
        return outputs

    except Exception as e:
        logger.error(f"Error initializing or running MCPAgent for workflow: {e}", exc_info=True)
        raise # Re-raise the exception
```

## 5. Hello World: End to End

To demonstrate the flow, let's build a simple "Hello World" skill service that accepts a name and returns a greeting, illustrating how it receives agent identity headers and can access injected secrets.

### Skill Service (`services/hello/app.py`)

This is a minimal Flask application representing one of the "Skills" or "Services" that agents interact with.

```python
from flask import Flask, request, jsonify
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
        f"Received request [TraceID: {request_id}] from agent: {agent_id} (type={agent_type}, team={agent_team})"
    )
    # Note: The original Authorization header might or might not be forwarded by Envoy,
    # depending on the Envoy config ('forward: true'). Downstream services often
    # don't need the raw JWT if identity is asserted via simpler headers like x-agent-id.


@app.route("/say-hello", methods=["POST"])
def hello():
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
    data = request.get_json(silent=True) or {}
    # Default the name to the agent_id if no name is provided in the payload
    name = data.get("name", agent_id)

    logger.info(f"Generating greeting for {name}")

    # Return a JSON response
    return jsonify({
        "message": f"👋 Hello, {name}!",
        "agent_id": agent_id, # Include agent ID in response for traceability
        "timestamp": datetime.now().isoformat(),
        "secret_configured": bool(secret_value != "no-secret-found") # Show if secret was accessible
    })

@app.route("/health", methods=["GET"])
def health():
    """Standard health check endpoint."""
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    # Run the Flask application
    # In a containerized environment like Docker/Kubernetes, host='0.0.0.0' is standard
    # The service will be exposed via the sidecar, not directly on this port typically.
    app.run(host="0.0.0.0", port=8080)
```

### Infra Setup (Docker Compose)

Here's a Docker Compose setup that ties all the components together for a local demonstration:

```yaml
version: '3.8'

services:
  # Identity Provider Mock (WireMock acts as a mock Auth0)
  # We'll configure it to issue JWTs when the agent requests a token.
  auth-mock:
    image: wiremock/wiremock:2.35.0
    volumes:
      - ./wiremock:/home/wiremock # Mount WireMock mappings and __files
    ports:
      - "8090:8080" # Map host port 8090 to WireMock's default 8080
    command: --verbose --global-response-templating # Enable templating for dynamic JWTs
    healthcheck: # Basic health check
      test: ["CMD", "curl", "-f", "http://localhost:8080/__admin/health"]
      interval: 5s
      timeout: 2s
      retries: 5

  # Vault for Secrets Management
  vault:
    image: hashicorp/vault:1.13.0
    cap_add:
      - IPC_LOCK # Required by Vault
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: root-token # Use development server with a fixed root token
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
      VAULT_ADDR: http://127.0.0.1:8200 # Vault listens on 8200 internally
    ports:
      - "8200:8200" # Expose Vault's API port
    volumes:
      # Mount configurations, policies, and setup scripts
      - ./vault/config:/vault/config
      - ./vault/policies:/vault/policies
      - ./vault/scripts:/vault/scripts
    command: server -dev # Run in development mode
    healthcheck: # Wait for Vault to be ready
      test: ["CMD", "vault", "status"]
      interval: 5s
      timeout: 2s
      retries: 10 # Increased retries

  # Vault Initialization Script
  # Runs a script to enable auth methods, write policies, and add demo secrets/identities.
  vault-init:
    image: hashicorp/vault:1.13.0
    environment:
      VAULT_ADDR: http://vault:8200 # Connect to the Vault service via Docker network
      VAULT_TOKEN: root-token # Use the development root token
    volumes:
      - ./vault/scripts:/scripts # Mount the setup script
    command: sh -c "sleep 5 && /scripts/setup.sh" # Give Vault a moment before running setup
    depends_on:
      vault:
        condition: service_healthy # Ensure Vault is healthy before initializing

  # OPA for Policy Enforcement
  opa:
    image: openpolicyagent/opa:0.55.0
    volumes:
      - ./opa/policies:/policies # Mount Rego policies
    # Run OPA as a server, listen on 8181, enable decision logging, load policies from /policies
    command: run --server --addr :8181 --set decision_logs.console=true /policies/mcp/authz.rego # Specify the policy file
    ports:
      - "8181:8181" # Expose OPA's API port

  # Envoy as Agent Sidecar
  # This Envoy instance runs *next to* the agent (logically) and intercepts its outbound calls.
  envoy:
    image: envoyproxy/envoy:v1.26-latest
    volumes:
      - ./envoy/envoy.yaml:/etc/envoy/envoy.yaml # Mount Envoy configuration
    # Expose the port the agent talks to (15000) and the admin port (9901)
    ports:
      - "15000:15000"
      - "9901:9901"
    # Ensure control plane services are available before starting Envoy
    depends_on:
      auth-mock:
        condition: service_healthy
      opa:
        condition: service_started # OPA doesn't have a built-in health check for the API port in this mode
      vault-init: # Depend on vault-init to ensure Vault is configured
        condition: service_completed_successfully
    # Map service names used in mcp:// URIs to Docker service names
    # This is a simplified way to configure upstream clusters in a demo
    # In Kubernetes, this would typically involve Service Discovery (DNS) and a Service Mesh control plane
    environment:
      CLUSTER_hello-skill: hello-skill:8080 # Maps 'hello-skill' to the hello-skill service
      CLUSTER_sentiment-analysis: sentiment-analysis:8080 # Maps 'sentiment-analysis'
      CLUSTER_customer-lookup: customer-lookup:8080 # Maps 'customer-lookup' (placeholder)
      CLUSTER_support-system: support-system:8080 # Maps 'support-system' (placeholder)
      CLUSTER_auth0_jwks: auth-mock:8080 # Maps auth0_jwks cluster to the mock Auth0
      CLUSTER_opa: opa:8181 # Maps opa cluster to the OPA service

  # Hello Skill Service (example microservice)
  hello-skill:
    build:
      context: ./services/hello # Build from the hello service directory
      dockerfile: Dockerfile
    # Provide a mock secret value via env var, as if injected by Vault Agent
    environment:
      MCP_SECRET: ${MCP_SECRET:-a-default-dev-secret-value} # Use host env var or default
    # The agent doesn't call this directly; only the sidecar does. No need to expose port.
    # ports: # Not needed for sidecar architecture
    #   - "8080:8080"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 2s
      retries: 5


  # Sentiment Analysis Skill (placeholder)
  sentiment-analysis:
    build:
      context: ./services/sentiment # Build from the sentiment service directory
      dockerfile: Dockerfile # Assuming a basic Dockerfile exists
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 2s
      retries: 5
    # ports: [] # No need to expose

  # Customer Lookup Skill (placeholder)
  customer-lookup:
    build:
      context: ./services/customer-lookup # Placeholder directory
      dockerfile: Dockerfile # Assuming a basic Dockerfile exists
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 2s
      retries: 5
    # ports: [] # No need to expose

  # Support System Service (placeholder)
  support-system:
    build:
      context: ./services/support-system # Placeholder directory
      dockerfile: Dockerfile # Assuming a basic Dockerfile exists
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 5s
      timeout: 2s
      retries: 5
    # ports: [] # No need to expose


  # Demo Agent Application
  # This is the agent that uses the SDK and interacts with the sidecar.
  demo-agent:
    build:
      context: ./agent # Build from the agent directory
      dockerfile: Dockerfile
    # Provide Auth0 credentials (pointing to the mock) and the sidecar URL
    environment:
      AUTH0_DOMAIN: auth-mock:8080 # Point SDK to the mock Auth0
      MCP_CLIENT_ID: demo-agent # Use the client ID configured in Vault/Auth0 mock
      MCP_CLIENT_SECRET: demo-secret # Use the client secret configured in Vault/Auth0 mock
      # MCP_PROXY_URL: http://envoy:15000 # SDK defaults to 127.0.0.1:15000,
                                        # but within docker-compose, 'envoy' hostname works.
                                        # Let's rely on default and access 127.0.0.1.
    # Ensure the Envoy sidecar is running and the target skills/services are ready
    depends_on:
      envoy:
        condition: service_started # Depends on Envoy proxy
      hello-skill:
        condition: service_healthy # Depends on a skill being healthy
      sentiment-analysis:
        condition: service_healthy # Depends on a skill being healthy
      customer-lookup:
        condition: service_healthy
      support-system:
        condition: service_healthy

```

*(Note: You would need to create dummy Dockerfiles and potentially simple Flask/FastAPI apps in `./services/sentiment`, `./services/customer-lookup`, and `./services/support-system` directories with a basic `/health` endpoint for the Docker Compose health checks to pass and a simple `/analyze`, `/customer`, `/tickets` endpoint for the agent calls. The `wiremock` directory would need `mappings` and `__files` subdirectories with JSON files to mock the Auth0 `/oauth/token` and `/.well-known/jwks.json` endpoints. The Vault setup script below covers Vault initialization.)*

### WireMock Setup (`./wiremock`)

Create these files:

`./wiremock/mappings/oauth-token.json`:

```json
{
  "request": {
    "method": "POST",
    "url": "/oauth/token",
    "bodyPatterns": [
      { "equalToJson": { "grant_type": "client_credentials", "client_id": "demo-agent", "client_secret": "demo-secret", "audience": "https://mcp.example.com/" }, "ignoreExtraElements": true }
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
  "access_token": "{{jwt token=(jsonPath request.body '$.client_id') sub=(jsonPath request.body '$.client_id') aud=(jsonPath request.body '$.audience') exp='+1h' realm_access=(jsonPath request.body '$.audience') https://mcp.example.com/agent_type='support' https://mcp.example.com/team='customer-success' https://mcp.example.com/environment='production' permissions=[\"skills:invoke\", \"data:read\"]}}",
  "token_type": "Bearer",
  "expires_in": 3600
}
```
*(Note: This WireMock JWT helper might require specific WireMock versions or extensions. A simpler mock would return a static, pre-generated JWT).*

`./wiremock/mappings/jwks.json`:

```json
{
  "request": {
    "method": "GET",
    "url": "/.well-known/jwks.json"
  },
  "response": {
    "status": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "bodyFileName": "jwks.json"
  }
}
```

`./wiremock/__files/jwks.json`: You need to generate a public/private RSA key pair. Use the private key to sign the JWT in `access_token.json` (WireMock's templating might handle this, or you pre-generate) and place the *public* key in standard JWKS format in `jwks.json`. Tools like `mkjwk` or libraries in various languages can help generate this. This is complex for a mock; for a simple demo, you might skip JWT signature verification in Envoy's JWT filter (less secure!). *Self-signed certificate setup for Auth0 mock might be simpler than mocking JWKS*. **Alternative simplified mock:** Configure Envoy's JWT filter with `insecure_skip_signature_verification: true` for the `auth0_jwks` provider *for demo purposes only*. Then the JWKS files are not needed.

### Vault Initialization Script (`./vault/scripts/setup.sh`)

```bash
#!/bin/bash
# /vault/scripts/setup.sh

echo "Waiting for Vault to be ready..."
until vault status > /dev/null 2>&1; do
  sleep 1
done
echo "Vault is ready."

# Enable JWT auth backend if not already enabled
if ! vault auth list -format=json | grep -q "jwt/"; then
  echo "Enabling JWT auth backend..."
  vault auth enable jwt
fi

# Get the accessor for the JWT auth backend
JWT_ACCESSOR=$(vault auth list -format=json | jq -r '.["jwt/"].accessor')
echo "JWT auth accessor: $JWT_ACCESSOR"

# Configure JWT auth to trust the mock Auth0
echo "Configuring JWT auth backend..."
vault write auth/jwt/config \
  jwks_url="http://auth-mock:8080/.well-known/jwks.json" \
  bound_issuer="https://auth-mock/" \
  # In a real setup, you'd specify trusted issuers/JWKS. For a mock, maybe point to mock.
  # Or, use a static key configured if the mock can't serve JWKS easily.

# Create policy for agents
echo "Writing 'agent-policy'..."
vault policy write agent-policy - <<EOF
path "secret/data/mcp/agents/common/*" {
  capabilities = ["read"]
}

path "secret/data/mcp/agents/{{identity.entity.name}}/*" {
  capabilities = ["read"]
}
EOF

# Create role for JWT auth
echo "Writing JWT role 'agent'..."
vault write auth/jwt/role/agent \
  role_type="jwt" \
  bound_audiences="https://mcp.example.com/" \
  user_claim="sub" \
  bound_claims_type="string" \
  token_policies="agent-policy" \
  token_ttl=3600 \
  token_max_ttl=7200

# Enable KV secrets engine (if not already enabled)
if ! vault secrets list -format=json | grep -q "secret/"; then
  echo "Enabling KV v2 secrets engine..."
  vault secrets enable -version=2 -path=secret kv
fi

# Create demo secrets
echo "Writing demo secrets..."
vault kv put secret/mcp/agents/common/api-keys \
  stripe="sk_test_demo" \
  sendgrid="sg_test_demo"

vault kv put secret/mcp/agents/demo-agent/credentials \
  api_key="demo-agent-api-key" \
  environment="development"

# Create Vault Identity Entity and Alias for the demo agent
# This maps the 'sub' claim from the JWT (demo-agent@clients) to a Vault entity.
echo "Creating Vault Identity Entity and Alias for demo-agent..."
ENTITY_ID=$(vault write -field=id identity/entity name="demo-agent" \
  metadata='agent_type="support",team="customer-success",environment="production"')
echo "Created entity ID: $ENTITY_ID"

# The alias name must match the 'sub' claim in the JWT issued by Auth0 mock
# For Auth0 M2M, this is client_id@clients. For our mock, let's assume just 'demo-agent'
# based on the WireMock template 'sub=(jsonPath request.body '$.client_id')'
ALIAS_NAME="demo-agent"

vault write identity/entity-alias \
  name="$ALIAS_NAME" \
  canonical_id="$ENTITY_ID" \
  mount_accessor="$JWT_ACCESSOR"
echo "Created entity alias '$ALIAS_NAME' linked to entity '$ENTITY_ID'."


echo "Vault setup complete."
```

### Demo Run

```bash
# Navigate to your project directory containing docker-compose.yaml and the subdirectories
cd your-project-directory

# Set the environment variable for the demo secret if needed
export MCP_SECRET="my-super-secret-for-hello"

# Initialize the system using Docker Compose
# --build: Build images if not cached
# -d: Run in detached mode
docker-compose up --build -d

# Give services a moment to start up and become healthy
echo "Giving services time to start..."
sleep 15 # Adjust sleep duration based on your system performance

# View logs from the demo agent (Ctrl+C to exit follow mode)
echo "--- Following demo-agent logs ---"
docker-compose logs -f demo-agent

# --- Expected output fragments in the logs ---
# (Logs will include output from all services, filter for 'demo-agent')

# demo-agent    | INFO:mcp_agent:New token acquired, expires at: ...
# demo-agent    | INFO:root:MCPAgent initialized.
# demo-agent    | DEBUG:mcp_agent:Calling skill: /mcp://customer-lookup/customer # Step 1
# customer-lookup | INFO:customer-lookup:Received request [TraceID: ...] from agent: demo-agent (type=support, team=customer-success) # Seen by the skill service
# customer-lookup | INFO:customer-lookup:Looked up customer CUST-5678 # (If customer-lookup service logs this)
# demo-agent    | INFO:root:Retrieved customer: John Doe # (If customer service returns name)
# demo-agent    | DEBUG:mcp_agent:Getting data: /mcp://support-system/tickets/TKT-1234 # Step 2
# support-system| INFO:support-system:Received request [TraceID: ...] from agent: demo-agent ... # Seen by the support service
# demo-agent    | INFO:root:Retrieved ticket: Issue with feature X # (If support service returns subject)
# demo-agent    | DEBUG:mcp_agent:Calling skill: /mcp://sentiment-analysis/analyze # Step 3
# sentiment-analysis| INFO:sentiment-analysis:Received request [TraceID: ...] from agent: demo-agent ... # Seen by sentiment service
# demo-agent    | INFO:root:Sentiment score: 0.85 # (If sentiment service returns score)
# demo-agent    | DEBUG:mcp_agent:Calling skill: /mcp://response-generator/generate # Step 4 (Placeholder, might fail if service doesn't exist)
# demo-agent    | DEBUG:mcp_agent:Writing data: /mcp://support-system/tickets/TKT-1234/responses # Step 5
# support-system| INFO:support-system:Received request [TraceID: ...] from agent: demo-agent ... # Seen by the support service
# demo-agent    | INFO:root:Wrote response to ticket TKT-1234.
# demo-agent    | INFO:root:Ticket processed successfully: {'ticket_id': 'TKT-1234', 'customer_id': 'CUST-5678', 'sentiment_score': 0.85, 'response_snippet': 'Generated response text...'} # Final output


# --- Observe Control Plane logs for the request flow ---
# OPA logs will show the authorization decision for each request:
# opa           | { "decision_id": "...", "timestamp": "...", "input": { ... }, "result": true/false }
# Vault logs will show the JWT login and potential secret access attempts:
# vault         | 2023-10-27T10:00:05.123Z [INFO]  core: login successful: auth_method=jwt ...
# vault         | 2023-10-27T10:00:06.456Z [INFO]  core: post-unseal setup complete ...
# vault         | 2023-10-27T10:00:07.789Z [INFO]  core: policy check: allow=true ... path=secret/data/...

# Clean up
# docker-compose down
```

## 6. Advanced Control Plane Features

Building the core Identity, Policy, and Secrets components provides a solid foundation. Here are some advanced features to consider for a production-ready agent control plane.

### 6.1 Dynamic Agent Registration and Provisioning

Instead of manually defining each agent in Auth0, Vault, and potentially OPA configuration, implement a self-service registration system. This system would expose an API developers can use to programmatically onboard new agents.

```hcl
# Example using HashiCorp Waypoint or a custom API Gateway + Lambda/service
resource "aws_lambda_function" "agent_registration" {
  function_name = "agent-registration"
  handler       = "index.handler" # Node.js example
  runtime       = "nodejs16.x"
  role          = aws_iam_role.agent_registration.arn # IAM role for Lambda permissions

  # Pass necessary credentials/endpoints to the Lambda
  environment {
    variables = {
      AUTH0_DOMAIN     = var.auth0_domain
      AUTH0_MANAGEMENT_CLIENT_ID  = var.auth0_management_client_id # Client with Management API access
      AUTH0_MANAGEMENT_CLIENT_SECRET = var.auth0_management_client_secret
      VAULT_ADDR       = var.vault_addr
      VAULT_TOKEN      = var.vault_token # Or use another Vault auth method
      # OPA_URL          = var.opa_url # If policies are managed via OPA API
      # AGENT_REGISTRY_DB_URL = var.agent_registry_db_url # Database for agent metadata
    }
  }
}

# Expose the registration Lambda via an API Gateway
resource "aws_apigateway_rest_api" "mcp_api" {
  name        = "mcp-control-api"
  description = "Machine Control Plane API for registration and management"
}

resource "aws_apigateway_resource" "agents" {
  rest_api_id = aws_apigateway_rest_api.mcp_api.id
  parent_id   = aws_apigateway_rest_api.mcp_api.root_resource_id
  path_part   = "agents"
}

resource "aws_apigateway_method" "post_agent" {
  rest_api_id   = aws_apigateway_rest_api.mcp_api.id
  resource_id   = aws_apigateway_resource.agents.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS" # Secure the endpoint (e.g., for developers)
  authorizer_id = aws_apigateway_authorizer.cognito.id
}
```

The registration endpoint would:

1.  Authenticate and authorize the developer making the request.
2.  Validate the requested agent configuration (name, type, team, environment, requested permissions/scopes).
3.  Create an Auth0 M2M application for the new agent using the Auth0 Management API.
4.  Register the agent's metadata in a central Agent Registry (database).
5.  Create necessary Vault Identity entities and aliases, and potentially write agent-specific policies or policy overrides in OPA (or update data used by OPA).
6.  Generate and securely return the agent's initial credentials (Client ID, Client Secret) to the developer.

### 6.2 Layered Policy System

As your agent fleet grows, managing policies can become complex. A layered policy model in OPA allows for better organization and reduces redundancy:

1.  **Global policies:** Rules that apply to *all* agents (e.g., default deny, token validation, basic off-hours restrictions).
2.  **Team policies:** Rules specific to agents belonging to a particular team (e.g., restricting access to certain services or data sources based on the team claim in the JWT).
3.  **Agent type policies:** Rules specific to categories of agents (e.g., 'support' agents vs. 'analysis' agents have different default access).
4.  **Agent-specific policies:** Overrides or specific grants/denials for individual agents (used sparingly).

This is achieved by structuring your Rego policies into different files (packages) and using the `import` keyword in the main policy entry point to load and evaluate rules from different layers.

```rego
package mcp.authz # The main entry point policy

import future.keywords
import input.jwt as token

# Import policies from different layers.
# These packages would define 'allow' and 'deny' rules specific to their layer.
import data.mcp.policy.global as global_policy
import data.mcp.policy.teams as team_policies # Assuming 'teams' package contains team-specific rules
import data.mcp.policy.agent_types as agent_type_policies # Assuming 'agent_types' package contains type-specific rules
import data.mcp.policy.agents as agent_policies # Assuming 'agents' package contains agent-specific rules

# --- Default Decision ---
default allow := false # Deny by default

# --- Explicit Deny Evaluation ---
# Check if any policy layer explicitly denies the request.
# An explicit deny should typically override any allow.
default deny := false
deny {
  global_policy.deny # Check global deny rules
}
deny {
  team := token.payload["https://mcp.example.com/team"]
  team_policies.deny[team] # Check deny rules for the agent's team
}
deny {
  agent_type := token.payload["https://mcp.example.com/agent_type"]
  agent_type_policies.deny[agent_type] # Check deny rules for the agent's type
}
deny {
  agent_id := token.payload.sub
  agent_policies.deny[agent_id] # Check deny rules for the specific agent ID
}

# --- Core Allow Decision ---
# A request is allowed ONLY IF there is NO explicit deny AND at least one allow rule permits it.
allow if {
  not deny # No deny rule fired

  # Token must be valid and not expired (basic global checks)
  global_policy.token_valid
  global_policy.token_not_expired # Assume these helpers are in global_policy

  # The request must be allowed by *at least one* of the policy layers.
  # This implements an 'OR' logic between layers (if one allows, it's allowed, unless denied).
  # You could implement different logic (e.g., 'AND' between layers) if required.
  is_allowed # Check if any allow rule across layers permits the action
}

# Rule that checks if any of the policy layers explicitly allows the action.
is_allowed {
  global_policy.allow # Check global allow rules
}
is_allowed {
  team := token.payload["https://mcp.example.com/team"]
  team_policies.allow[team] # Check allow rules for the agent's team
}
is_allowed {
  agent_type := token.payload["https://mcp.example.com/agent_type"]
  agent_type_policies.allow[agent_type] # Check allow rules for the agent's type
}
is_allowed {
  agent_id := token.payload.sub
  agent_policies.allow[agent_id] # Check allow rules for the specific agent ID
}

# Example of a team-specific allow rule in data/mcp/policy/teams/customer_success.rego
# package mcp.policy.teams
# import future.keywords
# import data.mcp.authz as authz_main # Import the main policy package for input structure
#
# # Allow customer-success team agents to access 'customer-data' service
# allow["customer-success"] if {
#    authz_main.input.request.path[2] == "customer-data" # Check the service name
#    authz_main.input.request.method == "GET" # Only allow GET
#    authz_main.token.payload.permissions contains "data:read" # Agent must also have the general data:read permission
# }
#
# # Deny customer-success team agents from accessing 'billing-system' service
# deny["customer-success"] if {
#    authz_main.input.request.path[2] == "billing-system"
# }
```

OPA can load data (e.g., mappings of agent types to permissions) separately from policy rules, allowing you to manage configuration alongside logic.

### 6.3 Rate Limiting and Circuit Breaking

Autonomous agents can potentially generate high request volumes or encounter downstream service failures. Integrating rate limiting and circuit breaking into the sidecar prevents abuse and improves system resilience.

Envoy has built-in filters for both:

```yaml
# Envoy Rate Limit Filter configuration
http_filters:
  # ... other filters (jwt_authn, lua, ext_authz) ...
  - name: envoy.filters.http.rate_limit
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.rate_limit.v3.RateLimit"
      domain: mcp_agent_rate_limits # Domain name for the rate limit service configuration
      failure_mode_deny: true # Deny requests if the rate limit service is unavailable

# Define the Rate Limit Service cluster
rate_limit_service:
  grpc_service:
    envoy_grpc:
      cluster_name: rate_limit_service # Cluster pointing to your rate limit service (e.g., Redis-backed)
    timeout: 0.25s

# Define rate limit descriptors to match requests based on agent ID, service, etc.
# These descriptors are sent to the rate limit service.
rate_limits:
  - # Rate limit per agent ID globally
    actions:
      - request_headers:
          header_name: x-agent-id # Use the header added by the Lua filter
          descriptor_key: agent_id # Key name in the rate limit service
  - # Rate limit per agent ID per skill/service
    actions:
      - request_headers:
          header_name: x-agent-id
          descriptor_key: agent_id
      - destination_cluster: {} # Combine with the target cluster name

# Configure the rate_limit_service cluster (pointing to a Redis-backed service like Envoy Rate Limit Service)
clusters:
  - name: rate_limit_service
    type: STRICT_DNS
    lb_policy: ROUND_ROBIN
    connect_timeout: 1s
    load_assignment:
      cluster_name: rate_limit_service
      endpoints:
        - lb_endpoints:
            - endpoint:
                address:
                  socket_address: { address: rate-limit-service.mcp.svc.cluster.local, port_value: 8081 } # Address of your rate limit service

  # ... other clusters ...
```

You would need to deploy a rate limit service (e.g., a simple service backed by Redis, or the OSS Envoy Rate Limit service) and configure it with limits for different `(agent_id, skill_name)` combinations or global agent limits.

Envoy also supports **Circuit Breaking** on its clusters, preventing cascading failures by stopping requests to unhealthy upstream instances or clusters experiencing high error rates. This is configured directly in the cluster definition.

### 6.4 Observability Pipeline

A unified observability pipeline is critical for understanding agent behavior, debugging issues, and monitoring the health and security of the control plane. Envoy sidecars are excellent points to collect telemetry (metrics, logs, traces).

```yaml
# Example docker-compose.observability.yml to run alongside the main services
version: '3.8'

services:
  # Metrics: Prometheus scrapes Envoy sidecars and skills
  prometheus:
    image: prom/prometheus:v2.44.0
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml # Mount Prometheus config
    ports:
      - "9090:9090" # Expose Prometheus UI
    command: --config.file=/etc/prometheus/prometheus.yml --web.enable-lifecycle
    # Depends on components exposing /stats/prometheus endpoint
    depends_on:
      - envoy # Scrape metrics from Envoy sidecars
      # - hello-skill # Scrape application metrics if exposed

  # Dashboarding: Grafana visualizes metrics and logs
  grafana:
    image: grafana/grafana:9.5.3
    ports:
      - "3000:3000" # Expose Grafana UI
    volumes:
      - grafana_data:/var/lib/grafana # Persist Grafana data
      - ./grafana/provisioning/datasources:/etc/grafana/provisioning/datasources # Configure data sources
      - ./grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards # Configure dashboards
    environment:
      GF_SECURITY_ADMIN_USER: admin # Default admin user
      GF_SECURITY_ADMIN_PASSWORD: admin # Default admin password
    depends_on:
      - prometheus
      - loki # Integrate Loki for logs

  # Logging: Loki stores collected logs
  loki:
    image: grafana/loki:2.8.0
    ports:
      - "3100:3100" # Expose Loki ingester/queryer
    command: -config.file=/etc/loki/local-config.yaml # Loki configuration

  # Logging Agent: Promtail collects logs from containers and sends to Loki
  promtail:
    image: grafana/promtail:2.8.0
    volumes:
      # Mount necessary host paths to access container logs
      - /var/log:/var/log # Standard log path
      - ./promtail:/etc/promtail # Promtail configuration
      - /var/lib/docker/containers:/var/lib/docker/containers:ro # Docker container logs
    command: -config.file=/etc/promtail/config.yaml
    depends_on:
      - loki

  # Tracing: Jaeger receives traces from Envoy and applications
  jaeger:
    image: jaegertracing/all-in-one:1.45 # All-in-one collector, query, agent
    ports:
      - "16686:16686" # Jaeger UI
      - "6831:6831/udp" # UDP Thrift for agents/clients
      - "14268:14268" # HTTP Thrift for collectors
      - "9411:9411" # Zipkin compatible endpoint (Envoy can send here)
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ":9411" # Enable Zipkin collector

volumes:
  grafana_data: # Docker volume for Grafana persistence
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

-   **Envoy:** Access logs provide a record of every request processed by the sidecar, including source/destination, request method/path, response code, request duration, and crucial metadata like the `x-agent-id` header added by the Lua filter, and potentially OPA decision outcomes if configured. Filter logs capture errors or warnings from filters.
-   **OPA:** Decision logs are critical for auditing. They record every policy evaluation, including the `input` document (containing agent identity, request details, resource context) and the `result` (allow/deny) with associated reasons. Policy errors are also logged.
-   **Vault:** Audit logs provide an immutable record of all authenticated interactions with Vault (login attempts, secret read/write, policy changes), including the identity of the client (the agent's Vault identity). System logs capture operational issues.
-   **Agents/Skills:** Application logs from your agent and skill services are essential. Implementing structured logging (e.g., JSON logs) and including correlation IDs (like the `x-request-id` header from Envoy) makes searching and analyzing logs across components much easier.

Logging agents like Promtail (used with Loki), Filebeat (with Elasticsearch/Logstash), or Fluentd can collect logs from container stdio or files and send them to a centralized logging backend like Loki, Elasticsearch, or a cloud provider's logging service. Grafana integrates with Loki via LogQL for powerful log querying.

#### 6.4.3 Distributed Tracing

Distributed tracing allows you to follow a single request as it traverses multiple services and infrastructure components. Envoy can initiate or join traces using headers (like B3, W3C Trace Context).

Configure Envoy to send traces to a collector (like Jaeger, Zipkin). The Agent SDK and your skill services should be instrumented to propagate trace headers and create spans for internal operations (like calling the SDK, database queries, processing logic). This provides end-to-end visibility, invaluable for diagnosing latency or errors in complex agent workflows spanning multiple steps and services.

### 6.5 Auditing and Compliance

With identity, policy, and secrets managed centrally and observability data collected, creating a comprehensive audit trail becomes significantly more feasible and reliable compared to distributed, per-agent logging.

-   **Envoy Access Logs:** Provide a high-level record of agent activity (who called what service, when, with what result).
-   **OPA Decision Logs:** Offer detailed proof of *why* a specific request was allowed or denied, linking the decision directly to the agent's identity and the policy input context.
-   **Vault Audit Logs:** Verify when and by whom secrets were accessed.
-   **Application Logs:** Provide context on what the agent or skill *did* internally after policy checks passed (e.g., "processed ticket TKT-1234", "updated customer record CUST-5678").

By collecting and correlating logs from these sources (e.g., using request IDs/trace IDs), you build a powerful audit trail. Feed these correlated logs into a Security Information and Event Management (SIEM) system or a data lake for long-term storage, analysis, alerting on suspicious activity, and generating compliance reports. This enables you to answer critical questions for security and compliance:

-   Which agents accessed sensitive skill X or data source Y?
-   Were there any attempts by unauthorized agents to access restricted resources?
-   Can we demonstrate that access to resource Z is restricted based on team/environment policies?
-   When did agent A fetch credentials for database B, and what did it do afterwards?

## 7. Deployment Considerations

Implementing this stack requires careful consideration of deployment topologies and scalability.

### 7.1 Kubernetes Native Approach

Kubernetes is a natural fit for this architecture:

-   **Envoy:** Deploy as a **sidecar container** alongside each agent and skill pod. An `EnvoyFilter` resource (in Istio/Anthos Service Mesh) or similar mechanism can dynamically configure these sidecars based on labels or annotations, abstracting away per-pod Envoy config. Alternatively, a DaemonSet can run an Envoy on each node, acting as a node-local proxy (`hostNetwork: true` or similar might be needed for `127.0.0.1` binding).
-   **OPA:** Can run as a **sidecar** to the application (less common for general authz, more for microservice-specific policy) or as a **centralized deployment** (Deployment/StatefulSet) scaled independently. For latency-sensitive decisions, a sidecar or node-local OPA is preferable. For bundle management, OPA instances fetch policies from a central repository.
-   **Vault:** Typically runs as a **StatefulSet** with appropriate persistent storage and automated unseal mechanisms (e.g., Auto-Unseal with Cloud KMS or HashiCorp Boundary/Consul). The **Vault Agent Injector** is a Kubernetes Mutating Webhook Controller that automatically injects the Vault Agent sidecar and configures secret injection into pods based on pod annotations.
-   **Auth0:** A managed cloud service; requires no self-hosting infrastructure beyond configuring necessary connections and rules.
-   **Agent Services/Skills:** Deploy as standard Kubernetes Deployments or StatefulSets. They interact with the Envoy sidecar via `localhost:<port>`.

### 7.2 Scaling and Availability

-   **Envoy:** Scales horizontally with your agent and skill pods when deployed as a sidecar. For daemonsets, scale nodes. Ensure control plane components providing config (like a management server in a full service mesh like Istio, or your config deployment process) are highly available.
-   **OPA:** Scale replicas based on authorization request load. Policy bundle updates should be efficient. Consider sharding OPA instances or using distribution mechanisms for very high load.
-   **Vault:** Requires a robust **highly available setup** (e.g., Raft storage or Consul backend) with multiple replicas. Ensure Vault Agent caching is configured appropriately to minimize requests to the Vault cluster backend.
-   **Control Plane Services:** If you build custom registration or management APIs, ensure they are stateless and scalable behind a load balancer.

### 7.3 Secrets Rotation Automation

Vault Agent's secret injection via templates automatically handles secret rotation without application changes. When a secret lease is close to expiring (e.g., a dynamic database credential or a short-lived API key), Vault Agent automatically requests a new secret from Vault, updates the local file/template, and can optionally signal the application (e.g., `SIGUP`) to reload configuration. This eliminates the need for applications to have built-in secret rotation logic.

## 8. Future Directions and Challenges

Building the "HTTP for Agents" is just the beginning. Several areas require further exploration and standardization:

### 8.1 Standardizing Agent Capabilities & Discovery

How do agents discover what skills or tools are available and how to interact with them? A standardized agent capability schema (similar to OpenAPI for APIs, perhaps based on schema.org actions or a more AI-specific standard) and a discovery mechanism are needed. This control plane could manage a registry of agents and their capabilities, enabling agents to find and interact with each other securely through the sidecar.

### 8.2 Balancing Autonomy and Control

Autonomous agents are designed to make decisions and adapt. How do we provide sufficient policy guardrails to ensure safety, compliance, and resource control without stifling creativity and effectiveness? The layered policy approach helps, but defining appropriate, potentially dynamic policies for highly autonomous agents is a non-trivial policy engineering challenge. Can OPA policies reference runtime agent state or adapt based on agent learning or behavior?

### 8.3 LLMs and Policy

Large Language Models are increasingly core to agent behavior. How do we apply policy not just to the external API calls an agent makes, but potentially to the *inputs* provided to an LLM (e.g., preventing sensitive data from being sent to an external model) and the *outputs* generated by an LLM (e.g., redacting sensitive information, ensuring responses adhere to safety guidelines)? This might require integrating policy checks directly into the LLM inference pipeline, the agent framework using the LLM, or extending the OPA input context with LLM interaction details.

### 8.4 Graph-Based Authorization

As agent interactions become more complex and involve delegation or access based on relationships (agent A, acting on behalf of user B, needs to access data C owned by team D), understanding these relationships becomes critical. OPA's ability to query structured data could be extended with graph-based authorization models (like those used in identity platforms or systems like Zanzibar) to manage complex permissions in highly interconnected agent networks.

### 8.5 Developer Experience

While the SDK simplifies consumption of the infrastructure, simplifying the creation, configuration, testing, and deployment of new agents that integrate seamlessly with this stack is crucial. Tools for bootstrapping agents, defining policies, managing credentials, and observing agent behavior could significantly improve developer velocity. Integrating this pattern into existing developer platforms and CI/CD pipelines is key.

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
```
