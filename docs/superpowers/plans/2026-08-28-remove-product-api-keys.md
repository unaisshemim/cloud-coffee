# Remove Product API Keys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove cloudcoffee-issued API keys and `x-api-key` authentication while retaining sessions, OAuth bearer authentication, and external AI-provider credentials.

**Architecture:** Delete Better Auth API-key plugins and all request-resolution branches that consume product API keys. Remove the backing table through a forward migration, delete web dialog integration, and update machine-client contracts to OAuth only.

**Tech Stack:** TypeScript, Better Auth, Hono, oRPC, Drizzle/PostgreSQL, TanStack Start, Vitest, Biome, pnpm.

**Spec:** `docs/superpowers/specs/2026-08-28-remove-product-api-keys-design.md`

## Global Constraints

- Keep saved AI-provider credentials and build-time service keys.
- Keep browser sessions, OAuth bearer tokens, passkeys, passwords, and two-factor authentication.
- Preserve historical migrations and snapshots; add one forward migration.
- Do not hand-edit `apps/web/src/routeTree.gen.ts`.
- Preserve unrelated dirty-worktree changes.

---

### Task 1: Remove Product API-Key Authentication

**Files:**
- Modify: `packages/api/src/context.ts`
- Modify: `packages/api/src/context.test.ts`
- Modify: `apps/server/src/mcp/auth.ts`
- Modify: `apps/server/src/mcp/server.ts`
- Modify: `apps/server/src/openapi/generator.ts`
- Test: existing API context, MCP, and OpenAPI tests

**Interfaces:**
- Consumes: Better Auth session headers and OAuth `Authorization: Bearer <token>` headers.
- Produces: API context without `x-api-key` lookup; MCP authentication using OAuth only; OpenAPI without API-key security metadata.

- [x] Remove API-key user resolution from API context and update tests to assert session-only API context behavior.
- [x] Remove `x-api-key` fallback from MCP authentication while retaining bearer verification and throttled warnings.
- [x] Change MCP server capability copy to advertise OAuth only.
- [x] Remove OpenAPI API-key security scheme and global API-key requirement.
- [x] Run focused API and server tests, then affected package typechecks.

### Task 2: Remove Better Auth Plugin And Persistence

**Files:**
- Modify: `packages/auth/src/config.ts`
- Modify: `packages/auth/package.json`
- Modify: `apps/server/package.json`
- Modify: `apps/web/package.json`
- Modify: `knip.json`
- Modify: `packages/db/src/schema/auth.ts`
- Create: `migrations/<generated-name>/migration.sql`
- Create: `migrations/<generated-name>/snapshot.json`
- Modify: `migrations/migration.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Produces: Better Auth configuration without `apiKey()`, Drizzle schema without `apikey`, and a forward `DROP TABLE "apikey"` migration.

- [x] Remove server and browser Better Auth API-key plugin imports/configuration.
- [x] Remove workspace dependency declarations and regenerate lockfile using pnpm.
- [x] Remove `apikey` from current Drizzle schema.
- [x] Generate a migration through the repository migration command and inspect SQL for a table drop only.
- [x] Run auth and database typechecks/tests.

### Task 3: Remove Web API-Key Artifacts

**Files:**
- Delete: `apps/web/src/dialogs/api-key/create.tsx`
- Delete: `apps/web/src/dialogs/api-key/registry.tsx`
- Delete: `apps/web/src/dialogs/api-key/schema.ts`
- Modify: `apps/web/src/dialogs/renderers.tsx`
- Modify: `apps/web/src/dialogs/schemas.ts`
- Modify: `apps/web/src/dialogs/store.test.ts`
- Modify: `apps/web/src/libs/auth/client.ts`
- Delete: `apps/web/src/routes/dashboard/settings/api-keys.tsx`

**Interfaces:**
- Produces: dialog registry and auth client with no product API-key types or renderer; no API Keys route.

- [x] Remove API-key dialog registrations and auth client plugin.
- [x] Delete API-key dialog implementation and obsolete route.
- [x] Update dialog-store tests to use surviving dialog types only.
- [x] Regenerate TanStack route tree through normal Vite/typecheck tooling.
- [x] Run focused dialog tests, web typecheck, Biome, and production web build.

### Task 4: Update Public Contract And Verify Removal

**Files:**
- Modify/delete: product API-key documentation identified by source search
- Modify: `docs/contributing/architecture.mdx`
- Modify: `docs/superpowers/specs/2026-08-28-application-profile-settings-design.md`

**Interfaces:**
- Produces: OAuth-only API/MCP guidance with no claims that cloudcoffee issues API keys.

- [x] Replace product API-key setup instructions with OAuth guidance or remove obsolete API-key-only pages.
- [x] Search source/docs for stale product API-key symbols, excluding AI-provider credentials and build-tool keys.
- [x] Run focused tests, affected package typechecks, boundaries, Biome, and production build.
- [x] Run `git diff --check` and inspect final diff for unrelated edits.
- [x] Run `graphify update .` after all verification passes.

## Self-Review

- Spec coverage: authentication, MCP, OpenAPI, schema/migration, web, dependencies, and docs each map to one task.
- Exclusions: AI-provider credentials and build-time keys are explicitly preserved.
- Route generation: plan uses framework tooling and forbids manual generated-file edits.
- Migration safety: historical files remain untouched; generated forward migration handles deployed databases.
