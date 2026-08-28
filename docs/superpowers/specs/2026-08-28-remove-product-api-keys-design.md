# Remove Product API Keys

## Goal

Remove cloudcoffee-issued API keys as an authentication mechanism and delete their remaining implementation surface. Keep browser sessions and OAuth bearer tokens as supported authentication methods.

## Scope

- Remove Better Auth's API-key server plugin and browser client plugin.
- Remove `x-api-key` handling from API context and MCP authentication.
- Remove the API-key OpenAPI security scheme and update MCP capability text to advertise OAuth only.
- Remove API-key creation dialogs, schema registration, renderer registration, tests, and dependencies.
- Remove the `apikey` table from the current Drizzle schema and add a forward migration that drops it.
- Remove obsolete product API-key documentation and update surviving API/MCP guidance to use OAuth.
- Remove the legacy API Keys settings route rather than retaining a redirect for a deleted capability.

## Explicit Exclusions

- Saved AI-provider credentials remain. They authenticate cloudcoffee to external model providers and are required by AI features.
- Build-time environment keys such as `GOOGLE_CLOUD_API_KEY` remain.
- Historical migrations and snapshots remain immutable. A new migration removes the table from existing installations.
- OAuth provider, JWT, session, passkey, password, and two-factor authentication remain.

## Data And Authentication Flow

Authenticated browser requests continue to resolve users from Better Auth sessions. Machine clients use OAuth bearer tokens. Requests containing only `x-api-key` become unauthorized. Existing API-key records are deleted when the drop-table migration runs.

## Compatibility

This intentionally breaks clients using `x-api-key`. Documentation will direct clients to OAuth. OpenAPI will no longer advertise an API-key scheme. The removed settings URL will return the normal router not-found response after route regeneration.

## Verification

- Focused auth, API-context, MCP-auth, dialog-store, and OpenAPI tests.
- Typecheck affected auth, API, server, database, and web packages.
- Run package boundary checks and production web build.
- Search source and current docs for stale product API-key references while excluding AI-provider and build-tool credentials.
- Apply migration against development PostgreSQL when available; otherwise validate generated SQL and migration metadata.
