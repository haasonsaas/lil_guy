---
author: Jonathan Haas
pubDate: 2025-05-03
title: "Building the HTTP for Agents: A Complete Guide"
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

# Building the HTTP for Agents: A Complete Guide

Most teams aren't ready for what's coming.

Autonomous agents aren't just prototypes anymore. They're parsing docs, calling APIs, triaging support tickets—and doing it all while running 24/7 in prod. But while the AI layer is getting smarter, the plumbing around it is falling behind.

Ask around and you'll hear the same story: each team hand-rolls identity flows, secrets management, and policy enforcement. Every new agent spins up another snowflake.

It doesn't scale.

We've been here before. Web services hit the same wall a decade ago. The answer was a shared layer: HTTP, OAuth, JWTs, Envoy, Vault, OPA.

It's time to give agents the same treatment.

We can build a control plane that feels like HTTP for agents—with identity, policy, and secrets as first-class citizens. Here's how.

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

1. **Identity is an afterthought**: Most AI agents today run with static API keys or service account credentials with little-to-no fine-grained access control. Rotating credentials is a manual process that often gets neglected.

2. **Isolation is poor**: Agents often share environments, credentials, and execution contexts, making it nearly impossible to attribute actions to specific agents or contain blast radius during incidents.

3. **Permissions are binary**: Agents either have access to everything within a system or nothing at all. There's rarely any contextual authorization based on the task being performed or the data being accessed.

4. **Auditability is limited**: When something goes wrong, it's hard to trace exactly what happened, which agent took which action, and under what context.

5. **Onboarding is complex**: Setting up a new agent requires coordinating across multiple teams, manually configuring credentials, and documenting tribal knowledge.

Without solving these problems systematically, we're setting ourselves up for security incidents, compliance nightmares, and scalability bottlenecks. The sooner we address this, the less technical debt we'll accumulate.

## 2. The Core Components

Let's start with the control plane: **Identity**, **Policy**, and **Secrets**.

### 2.1 Identity with Auth0

Every agent needs to authenticate securely—ideally using short-lived tokens that are easy to verify and hard to misuse.

You'll need:

- An **Auth0 Resource Server** for your control plane
- A **Machine-to-Machine App** for each agent

```hcl
resource "auth0_resource_server" "mcp_api" {
  identifier = "https://mcp.example.com/"
  name = "AI Agent Control Plane"
  signing_alg = "RS256"
  token_lifetime = 3600
  skip_consent_for_verifiable_first_party_clients = true
  token_dialect = "access_token_authz"
  
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

resource "auth0_client" "agent_app" {
  name = "support-triage-agent"
  app_type = "non_interactive"
  grant_types = ["client_credentials"]
  token_endpoint_auth_method = "client_secret_post"
  
  jwt_configuration {
    lifetime_in_seconds = 3600
    alg = "RS256"
  }
  
  client_metadata = {
    agent_type = "support"
    team = "customer-success"
    environment = "production"
  }
}

resource "auth0_client_grant" "agent_permissions" {
  client_id = auth0_client.agent_app.id
  audience = auth0_resource_server.mcp_api.identifier
  scope = ["skills:invoke", "data:read"]
}
```

#### Flow:

1. Agent posts to `/oauth/token` with client credentials  
2. Receives a short-lived JWT scoped to `https://mcp.example.com/`

#### JWT Claims Structure:

The JWT contains critical metadata for your authorization system:

```json
{
  "iss": "https://your-tenant.auth0.com/",
  "sub": "client-id@clients",
  "aud": "https://mcp.example.com/",
  "iat": 1683026400,
  "exp": 1683030000,
  "azp": "client-id",
  "gty": "client-credentials",
  "permissions": [
    "skills:invoke",
    "data:read"
  ],
  "https://mcp.example.com/agent_type": "support",
  "https://mcp.example.com/team": "customer-success",
  "https://mcp.example.com/environment": "production"
}
```

These claims provide rich context for policy decisions downstream, enabling fine-grained access control based on:

- Who the agent is (identity)
- What it's allowed to do (permissions)
- What context it's operating in (custom claims)

#### Alternative: SPIFFE for Zero Trust

For organizations already invested in a service mesh like Istio, SPIFFE (Secure Production Identity Framework for Everyone) offers a more kubernetes-native approach:

```yaml
apiVersion: security.spiffe.io/v1beta1
kind: SpiffeID
metadata:
  name: support-triage-agent
  namespace: agents
spec:
  dnsNames:
  - support-triage-agent.agents.svc.cluster.local
  selector:
    app: support-triage-agent
    environment: production
  federatesWith:
  - trustDomain: example.com
    bundleEndpointURL: https://spiffe-bundle.example.com
```

This creates a SPIFFE ID like `spiffe://example.com/ns/agents/sa/support-triage-agent`, which can be used with mTLS for authentication and Envoy's RBAC filter for authorization.

### 2.2 Policy with OPA + Envoy

Use [OPA](https://www.openpolicyagent.org/) to write policy bundles in Rego. Unlike hardcoded rules, Rego gives you a declarative language for expressing complex authorization logic.

#### Base Policy Structure

```rego
package mcp.authz

import future.keywords
import input.jwt as token

# Default deny
default allow := false

# Common validation
token_valid := token.valid == true
token_not_expired := time.now_ns() < (token.payload.exp * 1000000000)

# Allow access if token is valid and has required permissions
allow if {
  token_valid
  token_not_expired
  has_permission_for_action
}

# Check if agent has permission for specific action
has_permission_for_action if {
  # Extract action from request
  action := input.request.path[1]
  
  # Match action to required permission
  action_permission_map := {
    "invoke_skill": "skills:invoke",
    "access_tool": "tools:access",
    "read_data": "data:read",
    "write_data": "data:write"
  }
  
  required_permission := action_permission_map[action]
  
  # Check if agent has this permission
  some permission in token.payload.permissions
  permission == required_permission
}

# Additional rule for service-specific permissions
allow if {
  token_valid
  token_not_expired
  
  # Extract service from request
  service := input.request.path[2]
  
  # Check if agent has service-specific permission
  has_service_permission(service)
}

# Helper function for service-specific permissions
has_service_permission(service) if {
  # Define service-specific permission requirements
  service_permissions := {
    "customer-data": ["data:read", "customer:access"],
    "billing-system": ["billing:read"],
    "support-tools": ["support:access"]
  }
  
  # Check if agent has all required permissions for this service
  required_permissions := service_permissions[service]
  
  # Ensure agent has all required permissions
  required_permissions_set := {p | some p in required_permissions}
  agent_permissions_set := {p | some p in token.payload.permissions}
  
  required_permissions_set & agent_permissions_set == required_permissions_set
}

# Environment-specific rules
allow if {
  token_valid
  token_not_expired
  
  # Only allow prod agents to access prod resources
  input.resource.metadata.environment == "production"
  token.payload["https://mcp.example.com/environment"] == "production"
}

# Team-based rules
allow if {
  token_valid
  token_not_expired
  
  # Teams can only access their own resources
  team := token.payload["https://mcp.example.com/team"]
  input.resource.metadata.team == team
}

# Deny high-risk operations during off-hours
deny_reason := "Operation not permitted during off-hours" if {
  # Define business hours (9 AM to 5 PM UTC)
  hour := time.clock(time.now_ns())[0]
  hour < 9 or hour > 17
  
  # Define high-risk operations
  high_risk_operations := ["delete", "update", "create"]
  
  # Check if current operation is high-risk
  some op in high_risk_operations
  input.request.method == op
}
```

#### Request Context Structure

For the policy to work, Envoy needs to construct an appropriate input document. Here's what the policy expects:

```json
{
  "jwt": {
    "valid": true,
    "payload": {
      "sub": "client-id@clients",
      "permissions": ["skills:invoke", "data:read"],
      "https://mcp.example.com/agent_type": "support",
      "https://mcp.example.com/team": "customer-success",
      "https://mcp.example.com/environment": "production",
      "exp": 1683030000
    }
  },
  "request": {
    "method": "POST",
    "path": ["invoke_skill", "sentiment-analysis"],
    "headers": {
      "x-source-system": "support-portal",
      "content-type": "application/json"
    }
  },
  "resource": {
    "type": "skill",
    "id": "sentiment-analysis",
    "metadata": {
      "team": "customer-success",
      "environment": "production",
      "data_classification": "low"
    }
  }
}
```

#### Wire it up in Envoy:

```yaml
http_filters:
  - name: envoy.filters.http.jwt_authn
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication"
      providers:
        auth0:
          issuer: "https://your-tenant.auth0.com/"
          audiences: ["https://mcp.example.com/"]
          remote_jwks:
            http_uri:
              uri: "https://your-tenant.auth0.com/.well-known/jwks.json"
              cluster: auth0_jwks
              timeout: 5s
            cache_duration:
              seconds: 300
      rules:
        - match:
            prefix: "/mcp://"
          requires:
            provider_name: "auth0"
  
  - name: envoy.filters.http.lua
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
      inline_code: |
        function envoy_on_request(request_handle)
          -- Extract JWT from request
          local metadata = request_handle:streamInfo():dynamicMetadata()
          local jwt_payload = metadata:get("envoy.filters.http.jwt_authn")["jwt_payload"]
          
          -- Parse URL path to extract service and operation
          local path = request_handle:headers():get(":path")
          local parts = {}
          for part in string.gmatch(path, "([^/]+)") do
            table.insert(parts, part)
          end
          
          -- Build OPA input document
          local opa_input = {
            jwt = {
              valid = true,
              payload = jwt_payload
            },
            request = {
              method = request_handle:headers():get(":method"),
              path = parts,
              headers = {
                ["x-source-system"] = request_handle:headers():get("x-source-system"),
                ["content-type"] = request_handle:headers():get("content-type")
              }
            },
            resource = {
              type = parts[2],
              id = parts[3],
              metadata = {
                -- In production, you'd fetch this from a resource registry
                team = "customer-success",
                environment = "production",
                data_classification = "low"
              }
            }
          }
          
          -- Set for ext_authz filter
          request_handle:headers():add("x-opa-input", cjson.encode(opa_input))
        end
  
  - name: envoy.filters.http.ext_authz
    typed_config:
      "@type": "type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz"
      http_service:
        server_uri:
          uri: http://opa:8181/v1/data/mcp/authz
          cluster: opa
          timeout: 0.5s
        authorization_request:
          allowed_headers:
            patterns:
              - exact: "x-opa-input"
        authorization_response:
          allowed_upstream_headers:
            patterns:
              - exact: "x-agent-id"
              - prefix: "x-mcp-"
```

#### Deployment and Bundle Management

OPA policies should be treated like code – versioned, tested, and deployed through CI/CD:

```yaml
# opa-bundler.yaml
bundles:
  authz:
    service: bundles
    resource: bundles/authz
    persist: true
    polling:
      min_delay_seconds: 60
      max_delay_seconds: 120

services:
  bundles:
    url: https://opa-bundles.example.com
    credentials:
      bearer:
        token_file: /var/run/secrets/bundle-auth-token

plugins:
  envoy_ext_authz_grpc:
    addr: :9191
    path: mcp/authz/allow
    dry-run: false
    enable-reflection: false
```

For policy testing, create a suite of test cases:

```rego
package mcp.authz_test

import data.mcp.authz

test_allow_valid_token_with_permission {
  allow_result := authz.allow with input as {
    "jwt": {
      "valid": true,
      "payload": {
        "permissions": ["skills:invoke"],
        "exp": future_timestamp
      }
    },
    "request": {
      "path": ["invoke_skill", "sentiment-analysis"]
    }
  }
  
  allow_result == true
}

test_deny_expired_token {
  allow_result := authz.allow with input as {
    "jwt": {
      "valid": true,
      "payload": {
        "permissions": ["skills:invoke"],
        "exp": past_timestamp
      }
    },
    "request": {
      "path": ["invoke_skill", "sentiment-analysis"]
    }
  }
  
  allow_result == false
}

# Helper for test timestamps
future_timestamp := time.now_ns() / 1000000000 + 3600
past_timestamp := time.now_ns() / 1000000000 - 3600
```

### 2.3 Secrets with Vault

HashiCorp Vault provides a secure, centralized secrets management system with powerful features like dynamic secrets, leasing, and fine-grained access control.

#### Setup JWT Auth Backend

```hcl
resource "vault_jwt_auth_backend" "auth0" {
  path = "jwt"
  default_role = "agent"
  jwks_url = "https://your-tenant.auth0.com/.well-known/jwks.json"
  jwt_validation_pubkeys = []
  bound_issuer = "https://your-tenant.auth0.com/"
}

resource "vault_jwt_auth_backend_role" "agent" {
  backend = vault_jwt_auth_backend.auth0.path
  role_name = "agent"
  role_type = "jwt"
  
  bound_audiences = ["https://mcp.example.com/"]
  bound_claims = {
    "https://mcp.example.com/environment" = "production"
  }
  bound_claims_type = "string"
  
  user_claim = "sub"
  token_ttl = 600
  token_max_ttl = 1200
  token_policies = ["agent-base"]
}

resource "vault_policy" "agent_base" {
  name = "agent-base"
  
  policy = <<EOF
# Base access for all agents
path "secret/data/mcp/agents/common/*" {
  capabilities = ["read"]
}

# Team-specific access
path "secret/data/mcp/agents/teams/{{identity.entity.metadata.team}}/*" {
  capabilities = ["read"]
}

# Agent-specific access
path "secret/data/mcp/agents/{{identity.entity.name}}/*" {
  capabilities = ["read"]
}

# Dynamic credentials
path "database/creds/{{identity.entity.metadata.agent_type}}-readonly" {
  capabilities = ["read"]
}

# Allow agents to create short-lived tokens for downstream services
path "auth/token/create/service" {
  capabilities = ["update"]
  allowed_parameters = {
    "policies" = ["service-policy"]
    "ttl" = ["5m", "10m"]
  }
}
EOF
}

# Create entity and aliases for each agent
resource "vault_identity_entity" "agent" {
  name = "support-triage-agent"
  metadata = {
    team = "customer-success"
    agent_type = "support"
    environment = "production"
  }
}

resource "vault_identity_entity_alias" "agent_jwt" {
  name = auth0_client.agent_app.client_id
  canonical_id = vault_identity_entity.agent.id
  mount_accessor = vault_jwt_auth_backend.auth0.accessor
}
```

#### Dynamic Database Credentials

For agents that need database access, set up dynamic credentials:

```hcl
resource "vault_database_secret_backend" "postgres" {
  path = "database"
  
  postgresql {
    name = "customer-db"
    plugin_name = "postgresql-database-plugin"
    connection_url = "postgresql://{{username}}:{{password}}@db:5432/customer?sslmode=disable"
    allowed_roles = ["support-readonly", "analysis-readonly"]
    username = "vault"
    password = var.db_admin_password
  }
}

resource "vault_database_secret_backend_role" "support_readonly" {
  backend = vault_database_secret_backend.postgres.path
  name = "support-readonly"
  db_name = "customer-db"
  
  creation_statements = [
    "CREATE ROLE \"{{name}}\" WITH LOGIN PASSWORD '{{password}}' VALID UNTIL '{{expiration}}';",
    "GRANT SELECT ON ALL TABLES IN SCHEMA public TO \"{{name}}\";",
    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO \"{{name}}\";",
    "GRANT USAGE ON SCHEMA public TO \"{{name}}\";"
  ]
  
  default_ttl = 300
  max_ttl = 600
}
```

#### Agent Access Flow:

1. Agent exchanges JWT for Vault token
2. Token is bound to specific entity with metadata
3. Agent can access secrets based on its identity and metadata
4. Secrets are short-lived and automatically rotated

```python
def fetch_vault_token(jwt_token):
    resp = requests.post(
        "http://vault:8200/v1/auth/jwt/login",
        json={"jwt": jwt_token, "role": "agent"}
    )
    return resp.json()["auth"]["client_token"]

def get_db_credentials(vault_token):
    headers = {"X-Vault-Token": vault_token}
    resp = requests.get(
        "http://vault:8200/v1/database/creds/support-readonly",
        headers=headers
    )
    return resp.json()["data"]
```

#### Secret Injection Sidecar

Use Vault Agent to automatically inject secrets:

```hcl
template {
  source      = "/etc/vault/templates/db-config.ctmpl"
  destination = "/etc/app/db-config.json"
  perms       = 0400
}
```

Where the template might look like:

```handlebars
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
- Credentials never touch disk in plaintext
- Rotation happens automatically before expiry
- Zero application changes required for secret rotation

## 3. Data Plane Sidecar: Envoy

Envoy serves as the network intermediary for all agent traffic, handling authentication, authorization, observability, and traffic shaping.

### Full Envoy Configuration

```yaml
static_resources:
  listeners:
  - name: agent_listener
    address:
      socket_address:
        address: 0.0.0.0
        port_value: 15000
    filter_chains:
    - filters:
      - name: envoy.filters.network.http_connection_manager
        typed_config:
          "@type": "type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager"
          stat_prefix: agent_proxy
          route_config:
            name: agent_routes
            virtual_hosts:
            - name: all
              domains: ["*"]
              routes:
              - match:
                  prefix: "/mcp://"
                route:
                  regex_rewrite:
                    pattern:
                      regex: "^/mcp://([^/]+)(/.*)$"
                    substitution: "\2"
                  cluster: "${CLUSTER}"
                  timeout: 30s
          
          http_filters:
            - name: envoy.filters.http.jwt_authn
              typed_config:
                "@type": "type.googleapis.com/envoy.extensions.filters.http.jwt_authn.v3.JwtAuthentication"
                providers:
                  auth0:
                    issuer: "https://your-tenant.auth0.com/"
                    audiences: ["https://mcp.example.com/"]
                    forward: true
                    from_headers:
                      - name: "Authorization"
                        value_prefix: "Bearer "
                    remote_jwks:
                      http_uri:
                        uri: "https://your-tenant.auth0.com/.well-known/jwks.json"
                        cluster: auth0_jwks
                        timeout: 5s
                      cache_duration:
                        seconds: 300
                rules:
                  - match:
                      prefix: "/mcp://"
                    requires:
                      provider_name: "auth0"
            
            - name: envoy.filters.http.lua
              typed_config:
                "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
                inline_code: |
                  function envoy_on_request(request_handle)
                    -- Extract and transform JWT claims to OPA input
                    local metadata = request_handle:streamInfo():dynamicMetadata()
                    local jwt_payload = metadata:get("envoy.filters.http.jwt_authn")["jwt_payload"]
                    
                    -- Extract service from path
                    local path = request_handle:headers():get(":path")
                    local service = string.match(path, "/mcp://([^/]+)")
                    
                    -- Add agent ID header for downstream services
                    request_handle:headers():add("x-agent-id", jwt_payload["sub"])
                    request_handle:headers():add("x-agent-type", jwt_payload["https://mcp.example.com/agent_type"])
                    request_handle:headers():add("x-agent-team", jwt_payload["https://mcp.example.com/team"])
                    
                    -- Prepare OPA input
                    local opa_input = {
                      jwt = {
                        valid = true,
                        payload = jwt_payload
                      },
                      request = {
                        method = request_handle:headers():get(":method"),
                        path = split_path(path),
                        headers = extract_headers(request_handle)
                      },
                      resource = {
                        type = "service",
                        id = service,
                        metadata = service_metadata(service)
                      }
                    }
                    
                    -- Set for ext_authz filter
                    request_handle:headers():add("x-opa-input", cjson.encode(opa_input))
                  end
                  
                  function envoy_on_response(response_handle)
                    -- Add trace ID for debugging
                    response_handle:headers():add("x-mcp-trace-id", response_handle:streamInfo():requestId())
                    
                    -- Add metrics to response
                    local metrics = {
                      upstream_latency_ms = math.floor(response_handle:streamInfo():upstreamInfo():upstreamTiming().lastUpstreamRxByteReceived().count() / 1000),
                      total_latency_ms = math.floor(response_handle:streamInfo():requestComplete().count() / 1000)
                    }
                    
                    response_handle:headers():add("x-mcp-metrics", cjson.encode(metrics))
                  end
                  
                  -- Helper functions
                  function split_path(path)
                    local parts = {}
                    for part in string.gmatch(path, "([^/]+)") do
                      table.insert(parts, part)
                    end
                    return parts
                  end
                  
                  function extract_headers(handle)
                    local headers = {}
                    for key, value in pairs(handle:headers()) do
                      headers[key] = value
                    end
                    return headers
                  end
                  
                  function service_metadata(service)
                    -- In production, fetch from a registry
                    local metadata_map = {
                      ["hello-skill"] = { team = "platform", environment = "production" },
                      ["sentiment-analysis"] = { team = "ml", environment = "production" },
                      ["customer-lookup"] = { team = "customer-success", environment = "production" }
                    }
                    
                    return metadata_map[service] or { team = "unknown", environment = "unknown" }
                  end
            
            - name: envoy.filters.http.ext_authz
              typed_config:
                "@type": "type.googleapis.com/envoy.extensions.filters.http.ext_authz.v3.ExtAuthz"
                failure_mode_allow: false
                http_service:
                  server_uri:
                    uri: http://opa:8181/v1/data/mcp/authz
                    cluster: opa
                    timeout: 0.5s
                  authorization_request:
                    allowed_headers:
                      patterns:
                        - exact: "x-opa-input"
                  authorization_response:
                    allowed_upstream_headers:
                      patterns:
                        - exact: "x-agent-id"
                        - prefix: "x-mcp-"
            
            - name: envoy.filters.http.lua
              typed_config:
                "@type": "type.googleapis.com/envoy.extensions.filters.http.lua.v3.Lua"
                inline_code: |
                  function envoy_on_request(request_handle)
                    -- Secret injection from Vault
                    -- In a real implementation, this would use Vault Agent or
                    -- a custom filter to inject secrets directly
                    
                    -- For demo purposes, we'll just modify the headers
                    request_handle:headers():add("x-secret-injected", "true")
                    request_handle:headers():add("x-request-id", request_handle:streamInfo():requestId())
                  end
            
            - name: envoy.filters.http.router
              typed_config:
                "@type": "type.googleapis.com/envoy.extensions.filters.http.router.v3.Router"
  
  clusters:
    - name: auth0_jwks
      connect_timeout: 5s
      type: LOGICAL_DNS
      dns_lookup_family: V4_ONLY
      load_assignment:
        cluster_name: auth0_jwks
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: your-tenant.auth0.com
                      port_value: 443
      transport_socket:
        name: envoy.transport_sockets.tls
        typed_config:
          "@type": "type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext"
    
    - name: opa
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: opa
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: opa
                      port_value: 8181
    
    - name: hello-skill
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: hello-skill
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: hello-skill
                      port_value: 8080
    
    - name: sentiment-analysis
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: sentiment-analysis
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: sentiment-analysis
                      port_value: 8080
    
    - name: customer-lookup
      connect_timeout: 5s
      type: STRICT_DNS
      lb_policy: ROUND_ROBIN
      load_assignment:
        cluster_name: customer-lookup
        endpoints:
          - lb_endpoints:
              - endpoint:
                  address:
                    socket_address:
                      address: customer-lookup
                      port_value: 8080

admin:
  access_log_path: /dev/stdout
  address:
    socket_address:
      address: 0.0.0.0
      port_value: 9901

### Observability Configuration

The Envoy sidecar also handles metrics, tracing, and logging:

```yaml
tracing:
  http:
    name: envoy.tracers.zipkin
    typed_config:
      "@type": "type.googleapis.com/envoy.config.trace.v3.ZipkinConfig"
      collector_cluster: zipkin
      collector_endpoint: "/api/v2/spans"
      shared_span_context: false

stats_sinks:
  - name: envoy.stat_sinks.prometheus
    typed_config:
      "@type": "type.googleapis.com/envoy.config.metrics.v3.PrometheusSink"
      histogram_bucket_settings:
        - match:
            prefix: "http.downstream_rq_time"
          buckets: [0.5, 1, 2.5, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
```

Your agent just talks to `localhost:15000`. Envoy handles:

- Token validation
- Authorization checks
- Secret injection
- Observability
- Traffic control
- Service discovery

## 4. Agent SDK (Python)

Let's build a proper SDK that abstracts away the infrastructure complexity:

```python
# mcp_agent.py
import os
import time
import json
import logging
import threading
import requests
from typing import Dict, Any, Optional, List, Union

class MCPAgent:
    """Machine Control Plane Agent SDK"""
    
    def __init__(
        self,
        client_id: str = None,
        client_secret: str = None,
        auth0_domain: str = None,
        audience: str = "https://mcp.example.com/",
        proxy_url: str = "http://127.0.0.1:15000",
        token_refresh_margin: int = 300,  # Refresh token 5 minutes before expiry
        logger: logging.Logger = None
    ):
        """Initialize the MCP Agent SDK.
        
        Args:
            client_id: Auth0 Client ID (defaults to MCP_CLIENT_ID env var)
            client_secret: Auth0 Client Secret (defaults to MCP_CLIENT_SECRET env var)
            auth0_domain: Auth0 domain (defaults to AUTH0_DOMAIN env var)
            audience: API audience (defaults to https://mcp.example.com/)
            proxy_url: URL of the Envoy sidecar (defaults to http://127.0.0.1:15000)
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
        
        # Token state
        self._access_token = None
        self._token_expiry = 0
        self._token_lock = threading.RLock()
        self._refresh_thread = None
        self._running = True
        
        # Validate required config
        if not all([self.client_id, self.client_secret, self.auth0_domain]):
            raise ValueError(
                "Missing required credentials. Please provide client_id, "
                "client_secret, and auth0_domain either as parameters or "
                "through environment variables."
            )
        
        # Initial token fetch
        self._fetch_token()
        
        # Start token refresh thread
        self._refresh_thread = threading.Thread(
            target=self._token_refresh_loop,
            daemon=True
        )
        self._refresh_thread.start()
    
    def _fetch_token(self) -> None:
        """Fetch a new access token from Auth0."""
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
            response.raise_for_status()
            token_data = response.json()
            
            with self._token_lock:
                self._access_token = token_data["access_token"]
                self._token_expiry = time.time() + token_data["expires_in"]
            
            self.logger.info(
                f"New token acquired, expires at: "
                f"{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(self._token_expiry))}"
            )
        except Exception as e:
            self.logger.error(f"Failed to fetch token: {str(e)}")
            raise
    
    def _token_refresh_loop(self) -> None:
        """Background thread to refresh the token before it expires."""
        while self._running:
            with self._token_lock:
                time_to_expiry = self._token_expiry - time.time()
            
            if time_to_expiry < self.token_refresh_margin:
                try:
                    self._fetch_token()
                except Exception:
                    # Back off a bit on failure
                    time.sleep(30)
            
            # Sleep for a while before checking again
            time.sleep(min(60, time_to_expiry / 2))
    
    def get_token(self) -> str:
        """Get the current valid access token."""
        with self._token_lock:
            if time.time() > self._token_expiry - self.token_refresh_margin:
                # Token is expired or about to expire, fetch a new one
                self._fetch_token()
            return self._access_token
    
    def call_skill(
        self,
        skill_name: str,
        path: str,
        payload: Optional[Dict[str, Any]] = None,
        timeout: int = 30,
        retry_count: int = 2
    ) -> Dict[str, Any]:
        """Call a skill through the MCP.
        
        Args:
            skill_name: Name of the registered skill
            path: API path on the skill
            payload: JSON payload to send
            timeout: Request timeout in seconds
            retry_count: Number of retry attempts
        
        Returns:
            JSON response from the skill
        """
        url = f"{self.proxy_url}/mcp://{skill_name}{path}"
        headers = {"Authorization": f"Bearer {self.get_token()}"}
        
        for attempt in range(retry_count + 1):
            try:
                response = requests.post(
                    url,
                    json=payload or {},
                    headers=headers,
                    timeout=timeout
                )
                
                # Check for authorization errors
                if response.status_code == 401 and attempt < retry_count:
                    self.logger.warning("Authorization failed, refreshing token...")
                    self._fetch_token()
                    headers = {"Authorization": f"Bearer {self.get_token()}"}
                    continue
                
                response.raise_for_status()
                return response.json()
            
            except requests.exceptions.RequestException as e:
                if attempt < retry_count:
                    self.logger.warning(f"Request failed, retrying ({attempt+1}/{retry_count}): {str(e)}")
                    # Exponential backoff
                    time.sleep(2 ** attempt)
                    continue
                self.logger.error(f"Request failed after {retry_count} retries: {str(e)}")
                raise
    
    def get_data(
        self,
        data_source: str,
        path: str,
        params: Optional[Dict[str, str]] = None,
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Read data from a registered data source.
        
        Args:
            data_source: Name of the registered data source
            path: API path on the data source
            params: Query parameters
            timeout: Request timeout in seconds
        
        Returns:
            JSON response from the data source
        """
        url = f"{self.proxy_url}/mcp://{data_source}{path}"
        headers = {"Authorization": f"Bearer {self.get_token()}"}
        
        response = requests.get(
            url,
            params=params or {},
            headers=headers,
            timeout=timeout
        )
        response.raise_for_status()
        return response.json()
    
    def write_data(
        self,
        data_sink: str,
        path: str,
        payload: Dict[str, Any],
        timeout: int = 30
    ) -> Dict[str, Any]:
        """Write data to a registered data sink.
        
        Args:
            data_sink: Name of the registered data sink
            path: API path on the data sink
            payload: Data to write
            timeout: Request timeout in seconds
        
        Returns:
            JSON response from the data sink
        """
        url = f"{self.proxy_url}/mcp://{data_sink}{path}"
        headers = {"Authorization": f"Bearer {self.get_token()}"}
        
        response = requests.put(
            url,
            json=payload,
            headers=headers,
            timeout=timeout
        )
        response.raise_for_status()
        return response.json()
    
    def call_chain(
        self,
        steps: List[Dict[str, Any]],
        initial_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Execute a chain of skill calls with context passing.
        
        Args:
            steps: List of step configurations with the format:
                  [{"skill": "name", "path": "/op", "context_map": {...}}, ...]
            initial_context: Initial context data
        
        Returns:
            Final context after all steps
        """
        context = initial_context or {}
        
        for i, step in enumerate(steps):
            skill_name = step["skill"]
            path = step["path"]
            context_map = step.get("context_map", {})
            
            # Map context to payload based on context_map
            payload = {}
            for payload_key, context_path in context_map.items():
                # Support dot notation for nested context access
                value = context
                for part in context_path.split('.'):
                    value = value.get(part, {})
                payload[payload_key] = value
            
            self.logger.info(f"Executing step {i+1}/{len(steps)}: {skill_name}{path}")
            result = self.call_skill(skill_name, path, payload)
            
            # Merge result into context
            context.update(result)
        
        return context
    
    def close(self) -> None:
        """Clean up resources."""
        self._running = False
        if self._refresh_thread:
            self._refresh_thread.join(timeout=1.0)

# Context manager support
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
```

### Example Usage:

```python
# support_agent.py
import logging
from mcp_agent import MCPAgent

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("support-agent")

def process_ticket(ticket_id, customer_id):
    """Process a support ticket using the agent infrastructure."""
    
    with MCPAgent() as agent:
        # Step 1: Look up customer information
        customer = agent.call_skill(
            "customer-lookup",
            "/customer",
            {"customer_id": customer_id}
        )
        logger.info(f"Retrieved customer: {customer['name']}")
        
        # Step 2: Get ticket content
        ticket = agent.get_data(
            "support-system",
            f"/tickets/{ticket_id}"
        )
        logger.info(f"Retrieved ticket: {ticket['subject']}")
        
        # Step 3: Analyze sentiment
        sentiment = agent.call_skill(
            "sentiment-analysis",
            "/analyze",
            {"text": ticket["description"]}
        )
        logger.info(f"Sentiment: {sentiment['score']}")
        
        # Step 4: Generate response based on sentiment and customer tier
        response = agent.call_skill(
            "response-generator",
            "/generate",
            {
                "ticket": ticket,
                "customer": customer,
                "sentiment": sentiment,
                "language": customer.get("preferred_language", "en")
            }
        )
        
        # Step 5: Write response back to ticket system
        agent.write_data(
            "support-system",
            f"/tickets/{ticket_id}/responses",
            {"response": response["text"]}
        )
        
        return {
            "ticket_id": ticket_id,
            "customer_id": customer_id,
            "sentiment": sentiment["score"],
            "response_id": response["id"]
        }

if __name__ == "__main__":
    result = process_ticket("TKT-1234", "CUST-5678")
    logger.info(f"Ticket processed: {result}")
```

### Declarative Workflow Definition:

For more complex agent workflows, you can define the entire flow declaratively:

```yaml
# support_workflow.yaml
name: support-ticket-triage
description: Automated support ticket triage and response
version: 1.0.0

steps:
  - name: customer-lookup
    skill: customer-lookup
    path: /customer
    input:
      customer_id: $inputs.customer_id
    output:
      customer: $response

  - name: get-ticket
    skill: support-system
    path: /tickets/$inputs.ticket_id
    output:
      ticket: $response

  - name: analyze-sentiment
    skill: sentiment-analysis
    path: /analyze
    input:
      text: $outputs.ticket.description
    output:
      sentiment: $response

  - name: classify-issue
    skill: issue-classifier
    path: /classify
    input:
      text: $outputs.ticket.description
      customer_tier: $outputs.customer.tier
    output:
      classification: $response

  - name: generate-response
    skill: response-generator
    path: /generate
    input:
      ticket: $outputs.ticket
      customer: $outputs.customer
      sentiment: $outputs.sentiment
      classification: $outputs.classification
      language: $outputs.customer.preferred_language || "en"
    output:
      response: $response

  - name: save-response
    skill: support-system
    path: /tickets/$inputs.ticket_id/responses
    method: PUT
    input:
      response: $outputs.response.text
      is_draft: $inputs.send_draft || false
```

This YAML could be loaded and executed by a workflow engine built on top of the Agent SDK:

```python
from mcp_agent import MCPAgent
import yaml

def run_workflow(workflow_path, inputs):
    # Load workflow definition
    with open(workflow_path) as f:
        workflow = yaml.safe_load(f)
    
    outputs = {}
    
    with MCPAgent() as agent:
        for step in workflow["steps"]:
            # Process input template
            step_input = {}
            for key, template in step.get("input", {}).items():
                # Simple template processing (in reality, use a proper template engine)
                if isinstance(template, str) and template.startswith("$inputs."):
                    path = template.split(".", 1)[1]
                    step_input[key] = inputs.get(path)
                elif isinstance(template, str) and template.startswith("$outputs."):
                    path_parts = template.split(".", 1)[1].split(".")
                    value = outputs
                    for part in path_parts:
                        if value is not None:
                            value = value.get(part)
                    step_input[key] = value
                else:
                    step_input[key] = template
            
            # Call the skill
            method = step.get("method", "POST").lower()
            path = step["path"]
            
            # Process path parameters
            for param in re.findall(r'\$inputs\.([a-zA-Z0-9_]+)', path):
                path = path.replace(f"$inputs.{param}", str(inputs.get(param, "")))
            
            if method == "get":
                result = agent.get_data(step["skill"], path, params=step_input)
            elif method == "put":
                result = agent.write_data(step["skill"], path, payload=step_input)
            else:  # POST is default
                result = agent.call_skill(step["skill"], path, payload=step_input)
            
            # Store output
            for key, output_path in step.get("output", {}).items():
                if output_path == "$response":
                    outputs[key] = result
                else:
                    # Handle more complex output mapping
                    pass
    
    return outputs
```

## 5. Hello World: End to End

### Skill Service

```python
from flask import Flask, request, jsonify
import os
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("hello-skill")

app = Flask(__name__)

@app.before_request
def log_request():
    """Log incoming requests with agent metadata."""
    agent_id = request.headers.get('x-agent-id', 'unknown')
    agent_type = request.headers.get('x-agent-type', 'unknown')
    agent_team = request.headers.get('x-agent-team', 'unknown')
    
    logger.info(
        f"Request from agent: {agent_id} (type={agent_type}, team={agent_team})"
    )

@app.route("/say-hello", methods=["POST"])
def hello():
    """Simple greeting endpoint to demonstrate the flow."""
    agent_id = request.headers.get('x-agent-id', 'unknown')
    
    # Access injected secrets
    secret = os.getenv("MCP_SECRET", "no-secret-found")
    
    # Get optional name from request
    data = request.get_json(silent=True) or {}
    name = data.get("name", agent_id)
    
    logger.info(f"Generating greeting for {name}")
    
    return jsonify({
        "message": f"👋 Hello, {name}!",
        "agent_id": agent_id,
        "timestamp": datetime.datetime.now().isoformat(),
        "secret_configured": bool(secret != "no-secret-found")
    })

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
```

### Infra Setup

Here's a Docker Compose setup that ties all the components together:

```yaml
version: '3.8'

services:
  # Identity Provider Mock (Auth0 Mock)
  auth-mock:
    image: wiremock/wiremock:2.35.0
    volumes:
      - ./wiremock:/home/wiremock
    ports:
      - "8090:8080"
    command: --verbose

  # Vault for Secrets Management
  vault:
    image: hashicorp/vault:1.13.0
    cap_add:
      - IPC_LOCK
    environment:
      VAULT_DEV_ROOT_TOKEN_ID: root-token
      VAULT_DEV_LISTEN_ADDRESS: 0.0.0.0:8200
      VAULT_ADDR: http://0.0.0.0:8200
    ports:
      - "8200:8200"
    volumes:
      - ./vault/config:/vault/config
      - ./vault/policies:/vault/policies
      - ./vault/scripts:/vault/scripts
    command: server -dev
    healthcheck:
      test: ["CMD", "vault", "status"]
      interval: 5s
      timeout: 2s
      retries: 5

  # Vault Initialization
  vault-init:
    image: hashicorp/vault:1.13.0
    environment:
      VAULT_ADDR: http://vault:8200
      VAULT_TOKEN: root-token
    volumes:
      - ./vault/scripts:/scripts
    command: sh -c "/scripts/setup.sh"
    depends_on:
      vault:
        condition: service_healthy

  # OPA for Policy Enforcement
  opa:
    image: openpolicyagent/opa:0.55.0
    volumes:
      - ./opa/policies:/policies
    command: run --server --addr :8181 --set decision_logs.console=true /policies
    ports:
      - "8181:8181"

  # Envoy as Agent Sidecar
  envoy:
    image: envoyproxy/envoy:v1.26-latest
    volumes:
      - ./envoy/envoy.yaml:/etc/envoy/envoy.yaml
    ports:
      - "15000:15000"
      - "9901:9901"
    depends_on:
      - auth-mock
      - opa
      - vault

  # Hello Skill Service
  hello-skill:
    build: ./services/hello
    environment:
      MCP_SECRET: ${MCP_SECRET:-dev-secret-value}
    ports:
      - "8080:8080"

  # Sentiment Analysis Skill
  sentiment-analysis:
    build: ./services/sentiment
    ports:
      - "8081:8080"

  # Demo Agent
  demo-agent:
    build: ./agent
    environment:
      AUTH0_DOMAIN: auth-mock:8080
      MCP_CLIENT_ID: demo-agent
      MCP_CLIENT_SECRET: demo-secret
    depends_on:
      - envoy
      - hello-skill
      - sentiment-analysis
```

### Initial Setup Scripts

Vault setup script to initialize JWT auth and secrets:

```bash
#!/bin/bash
# /vault/scripts/setup.sh

# Wait for Vault to be ready
until vault status > /dev/null 2>&1; do
  echo "Waiting for Vault to start..."
  sleep 1
done

# Enable JWT auth backend
vault auth enable jwt

# Configure JWT auth
vault write auth/jwt/config \
  jwks_url="http://auth-mock:8080/.well-known/jwks.json" \
  bound_issuer="https://auth-mock/"

# Create policy for agents
vault policy write agent-policy - <<EOF
path "secret/data/mcp/agents/common/*" {
  capabilities = ["read"]
}

path "secret/data/mcp/agents/{{identity.entity.name}}/*" {
  capabilities = ["read"]
}
EOF

# Create role for JWT auth
vault write auth/jwt/role/agent \
  role_type="jwt" \
  bound_audiences="https://mcp.example.com/" \
  user_claim="sub" \
  bound_claims_type="string" \
  token_policies="agent-policy" \
  token_ttl=1h

# Enable KV secrets engine
vault secrets enable -path=secret kv-v2

# Create demo secrets
vault kv put secret/mcp/agents/common/api-keys \
  stripe="sk_test_demo" \
  sendgrid="sg_test_demo"

vault kv put secret/mcp/agents/demo-agent/credentials \
  api_key="demo-agent-api-key" \
  environment="development"

echo "Vault setup complete"
```

### Demo Run

```bash
# Initialize the system
docker-compose up -d

# View logs
docker-compose logs -f demo-agent

# Expected output:
# demo-agent    | INFO:mcp_agent:New token acquired, expires at: 2025-05-03 12:30:00
# demo-agent    | INFO:root:Calling hello-skill...
# demo-agent    | INFO:root:Response: {'message': '👋 Hello, Agent demo-agent!', 'agent_id': 'demo-agent', 'timestamp': '2025-05-03T12:00:00.123456', 'secret_configured': true}
```

## 6. Advanced Control Plane Features

Let's go beyond the basics to cover advanced features that make your agent control plane enterprise-ready.

### 6.1 Dynamic Agent Registration

Instead of hardcoding agents, implement a self-service registration system:

```hcl
resource "aws_lambda_function" "agent_registration" {
  function_name = "agent-registration"
  handler       = "index.handler"
  runtime       = "nodejs16.x"
  role          = aws_iam_role.agent_registration.arn
  
  environment {
    variables = {
      AUTH0_DOMAIN     = var.auth0_domain
      AUTH0_CLIENT_ID  = var.auth0_management_client_id
      AUTH0_CLIENT_SECRET = var.auth0_management_client_secret
      VAULT_ADDR       = var.vault_addr
      VAULT_TOKEN      = var.vault_token
    }
  }
}

resource "aws_apigateway_rest_api" "mcp_api" {
  name        = "mcp-control-api"
  description = "Machine Control Plane API"
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
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_apigateway_authorizer.cognito.id
}
```

The registration endpoint would:

1. Validate the request against a schema
2. Create an Auth0 M2M application
3. Register the agent in the agent registry
4. Create Vault entities and policies
5. Generate initial policies in OPA
6. Return credentials to the developer

### 6.2 Layered Policy System

Implement a tiered policy model:

1. **Global policies** - Apply to all agents
2. **Team policies** - Apply to all agents from a specific team
3. **Agent type policies** - Apply to specific categories of agents
4. **Agent-specific policies** - Apply to individual agents

```rego
package mcp.authz

import future.keywords
import input.jwt as token

# Load policy layers
import data.global
import data.teams
import data.agent_types
import data.agents

# Default deny
default allow := false

# Common validation logic
token_valid := token.valid == true
token_not_expired := time.now_ns() < (token.payload.exp * 1000000000)

# Check if any deny rules apply
default deny := false
deny {
  global.deny
}
deny {
  teams[token.payload["https://mcp.example.com/team"]].deny
}
deny {
  agent_types[token.payload["https://mcp.example.com/agent_type"]].deny
}
deny {
  agents[token.payload.sub].deny
}

# Allow if agent passes all checks
allow if {
  # Explicit deny always overrides allow
  not deny
  
  # Token must be valid
  token_valid
  token_not_expired
  
  # Pass at least one allow rule
  is_allowed
}

# Check allow rules from all policy layers
is_allowed {
  global.allow
}
is_allowed {
  team := token.payload["https://mcp.example.com/team"]
  teams[team].allow
}
is_allowed {
  agent_type := token.payload["https://mcp.example.com/agent_type"]
  agent_types[agent_type].allow
}
is_allowed {
  agent_id := token.payload.sub
  agents[agent_id].allow
}
```

### 6.3 Rate Limiting and Circuit Breaking

Add rate limits to prevent runaway agents:

```yaml
# Envoy rate limit config
rate_limit_service:
  grpc_service:
    envoy_grpc:
      cluster_name: rate_limit_service
    timeout: 0.25s

rate_limits:
  - stage: 0
    actions:
      - source_cluster: {}
      - destination_cluster: {}
      - request_headers:
          header_name: x-agent-id
          descriptor_key: agent_id
```

And implement per-agent quotas:

```hcl
resource "redis_hash" "agent_quotas" {
  key = "agent_quotas"
  field {
    name = "demo-agent"
    value = "{\"requests_per_second\": 10, \"requests_per_day\": 10000}"
  }
  field {
    name = "high-priority-agent"
    value = "{\"requests_per_second\": 50, \"requests_per_day\": 50000}"
  }
}
```

### 6.4 Observability Pipeline

Implement a unified observability pipeline:
```yaml
# docker-compose.observability.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:v2.44.0
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    command: --config.file=/etc/prometheus/prometheus.yml --web.enable-lifecycle
    depends_on:
      - envoy # Scrape metrics from Envoy sidecars

  grafana:
    image: grafana/grafana:9.5.3
    ports:
      - "3000:3000"
    volumes:
      - ./grafana:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: admin
    depends_on:
      - prometheus
      - loki # For logs

  loki:
    image: grafana/loki:2.8.0
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml

  promtail:
    image: grafana/promtail:2.8.0
    volumes:
      - /var/log:/var/log # Mount host logs
      - ./promtail:/etc/promtail # Promtail config
      - /var/lib/docker/containers:/var/lib/docker/containers:ro # Docker logs
    command: -config.file=/etc/promtail/config.yaml
    depends_on:
      - loki

  jaeger:
    image: jaegertracing/all-in-one:1.45
    ports:
      - "5778:5778" # Config path
      - "6831:6831/udp" # Thrift compact UDP
      - "6832:6832/udp" # Thrift binary UDP
      - "5775:5775/udp" # Tchannel Thrift UDP
      - "16686:16686" # Web UI
      - "14268:14268" # HTTP Thrift
      - "14250:14250" # gRPC
    environment:
      COLLECTOR_ZIPKIN_HOST_PORT: ":9411" # Zipkin compatible endpoint
    ports:
      - "9411:9411" # Zipkin endpoint
      - "16686:16686" # UI

volumes:
  grafana:
  prometheus:
```

### 6.4.1 Metrics

Envoy exposes a `/stats/prometheus` endpoint that provides detailed metrics about requests, latency, errors, and more. Prometheus can scrape this endpoint from each sidecar. You can then build dashboards in Grafana to monitor:

-   Request volume per agent
-   Error rates (4xx/5xx) per agent/skill
-   Latency percentiles
-   Authorization denial rates (from OPA filter metrics)
-   Secret lookup/rotation rates (from Vault Agent metrics)

Your agents and skills should also expose standard metrics (e.g., Go `expvar`, Python `prometheus_client`) for application-specific insights.

### 6.4.2 Logging

Centralize logs from all components:

-   **Envoy:** Access logs (can include JWT claims and OPA decision outcomes), filter logs.
-   **OPA:** Decision logs (critical for auditing!), policy errors.
-   **Vault:** Audit logs, system logs.
-   **Agents/Skills:** Application logs (structured logging is key).

Use Promtail (or Filebeat, Fluentd) to tail logs from containers and send them to a logging backend like Loki (for cost-effective text logs) or Elasticsearch (for structured logs). Grafana integrates seamlessly with Loki via LogQL for powerful log exploration alongside metrics.

### 6.4.3 Distributed Tracing

Envoy supports various distributed tracing providers (Jaeger, Zipkin, Lightstep, etc.). Configure Envoy to initiate or join traces based on incoming request headers.

The Agent SDK (or a tracing library in the agent's language) should propagate trace headers (`x-request-id`, `x-b3-traceid`, etc.) to ensure requests are traced end-to-end through the sidecar, policy engine, Vault calls (if they go through the proxy), and the downstream skill service. This is invaluable for debugging complex multi-step agent workflows.

## 6.5 Auditing and Compliance

With identity, policy, and secrets managed centrally, creating a comprehensive audit trail becomes significantly easier.

-   **Envoy Access Logs:** Record every request, including agent identity (`x-agent-id`), source IP, destination, headers, and response code.
-   **OPA Decision Logs:** Record every policy evaluation, including the input document (agent identity, request context, resource metadata) and the final decision (allow/deny) with reasons.
-   **Vault Audit Logs:** Record every attempt to authenticate or access a secret, including the identity of the Vault client (the agent via JWT auth), the path accessed, and the result.
-   **Agent Application Logs:** Agents should log their core actions and decisions, correlating them with the request ID provided by the sidecar.

Feed these logs into a Security Information and Event Management (SIEM) system or data lake for analysis, alerting, and compliance reporting. This layered audit trail allows you to answer questions like: "Which agent attempted to access resource X at time Y?", "Why was agent Z denied permission to skill A?", or "Which secrets were accessed by agent B to perform task C?".

## 7. Deployment Considerations

Implementing this stack requires careful consideration of deployment topologies and scalability.

### 7.1 Kubernetes Native Approach

Kubernetes is a natural fit for this architecture:

-   **Envoy:** Deploy as a sidecar container alongside each agent pod. An `EnvoyFilter` resource can dynamically configure these sidecars based on labels or annotations, abstracting away per-agent config. Alternatively, a DaemonSet can run an Envoy on each node, acting as a node-local proxy.
-   **OPA:** Can run as a sidecar (Open Policy Agent Gatekeeper is specific to Kubernetes admission control but OPA itself can run as a sidecar for application policy) or as a central deployment scaled independently. For latency-sensitive decisions, a sidecar is preferable. For bundle management, OPA instances fetch policies from a central repository.
-   **Vault:** Typically runs as a stateful set with appropriate storage and unseal mechanisms (e.g., Auto-Unseal with Cloud KMS or HashiCorp Boundary/Consul). Vault Agent Injector is a Kubernetes controller that automatically injects Vault Agent and configured secrets into pods based on annotations.
-   **Auth0:** A managed cloud service; requires no self-hosting infrastructure beyond configuring necessary connections and rules.
-   **Agent Services/Skills:** Deploy as standard Kubernetes Deployments or StatefulSets. They interact with the Envoy sidecar via `localhost`.

### 7.2 Scaling and Availability

-   **Envoy:** Scales horizontally with your agent pods when deployed as a sidecar. For daemonsets, scale nodes. Ensure control plane components providing config (like a management server in a full service mesh) are highly available.
-   **OPA:** Scale replicas based on authorization request load. Policy bundle updates should be efficient.
-   **Vault:** Requires a robust highly available setup (e.g., Raft storage or Consul backend). Ensure Vault Agent caching is configured appropriately to minimize requests to the Vault cluster.
-   **Control Plane Services:** If you build custom registration or management APIs, ensure they are stateless and scalable behind a load balancer.

### 7.3 Secrets Rotation Automation

Vault Agent's secret injection via templates automatically handles secret rotation without application changes. When a secret lease is close to expiring, Vault Agent automatically requests a new secret, updates the file/template, and can optionally signal the application (e.g., `SIGUP`) to reload configuration.

## 8. Future Directions and Challenges

Building the "HTTP for Agents" is just the beginning. Several areas require further exploration and standardization:

### 8.1 Standardizing Agent Capabilities

How do agents discover and describe their capabilities (skills, tools)? A standardized agent capability schema (similar to OpenAPI for APIs) and a discovery mechanism are needed. This control plane could manage a registry of agents and their capabilities, enabling agents to find and interact with each other securely.

### 8.2 Balancing Autonomy and Control

Autonomous agents are designed to make decisions. How do we provide sufficient policy guardrails without stifling creativity and effectiveness? The layered policy approach helps, but defining appropriate policies for highly autonomous agents is a non-trivial policy engineering challenge. Can OPA policies evolve dynamically based on agent behavior or learning?

### 8.3 LLMs and Policy

Large Language Models are increasingly core to agent behavior. How do we apply policy to the *inputs* and *outputs* of LLM calls? How do we ensure LLMs, acting as agents, adhere to policies regarding data access, permitted actions, and sensitive information handling? This might require integrating policy checks directly into the LLM inference pipeline or agent frameworks.

### 8.4 Graph-Based Authorization

As agent interactions become more complex, understanding relationships (agent A can ask agent B to access data C) becomes critical. OPA's ability to query structured data could be extended with graph-based authorization models (like those used in identity platforms) to manage permissions in highly interconnected agent networks.

### 8.5 Developer Experience

While the SDK simplifies consumption, simplifying the creation and deployment of new agents that integrate with this stack is crucial. Tools for bootstrapping agents, defining policies, and managing credentials could significantly improve developer velocity.

## Conclusion

As AI agents move from experimental sidelines to critical business functions, the need for a robust, standardized control plane is no longer optional—it's a necessity. Hand-rolled solutions for identity, policy, and secrets introduce security risks, hinder scalability, and slow down development.

By adopting battle-tested patterns from the world of microservices and API gateways—leveraging tools like Auth0/SPIFFE for identity, OPA for policy, Vault for secrets, and Envoy as a ubiquitous sidecar—we can build the foundational infrastructure agents desperately need.

This "HTTP for Agents" provides:

*   **Strong Identity:** Every agent action is attributable.
*   **Fine-grained Authorization:** Control access based on agent, context, and resource.
*   **Secure Secrets Management:** Eliminate hardcoded or long-lived credentials.
*   **Unified Observability:** Gain visibility into agent behavior and interactions.
*   **Accelerated Development:** Abstract away infrastructure complexity for agent builders.
*   **Enhanced Compliance:** Meet regulatory and internal auditing requirements.

Building this layer unlocks the true potential of autonomous agents, allowing teams to focus on the intelligence and task execution, not the undifferentiated heavy lifting of security and infrastructure. It's time to give agents the solid foundation they deserve.

Start experimenting with these components today. Share your experiences. Let's build the future of agent infrastructure together.
