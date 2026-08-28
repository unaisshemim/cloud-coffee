# Application Profile Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate settings into Account and add a persistent screenshot-matched application Profile workspace.

**Architecture:** Store account-wide application information in one user-owned JSONB record validated by a shared Zod schema. Expose protected get/update procedures, then render focused Profile sections through a shared workspace shell while Account composes existing identity, preferences, integration, and lifecycle controls.

**Tech Stack:** TypeScript, React 19, TanStack Router/Form/Query, oRPC, Zod, Drizzle/PostgreSQL, Vitest, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-application-profile-settings-design.md`

## Global Constraints

- Preserve unrelated dirty worktree changes.
- Do not hand-edit `apps/web/src/routeTree.gen.ts`; regenerate through TanStack tooling.
- Use protected oRPC procedures for profile data.
- Keep application-profile data account-wide and resume documents independent.
- Preferences and Integrations remain available only as legacy redirects to Account.

---

### Task 1: Application Profile Data Contract

**Files:**
- Create: `packages/schema/src/application-profile.ts`
- Modify: `packages/schema/package.json`
- Test: `packages/schema/src/application-profile.test.ts`

**Interfaces:**
- Produces: `applicationProfileSchema`, `defaultApplicationProfile`, `ApplicationProfile`.

- [ ] Write schema tests proving defaults parse and malformed nested values fail.
- [ ] Run focused schema test and confirm RED because module is absent.
- [ ] Implement complete nested profile schema and defaults.
- [ ] Run focused schema test and confirm GREEN.

### Task 2: Database and Protected API

**Files:**
- Create: `packages/db/src/schema/application-profile.ts`
- Modify: `packages/db/src/schema/index.ts`
- Create: `packages/api/src/features/application-profile/router.ts`
- Create: `packages/api/src/features/application-profile/service.ts`
- Modify: `packages/api/src/routers/index.ts`
- Test: `packages/api/src/features/application-profile/service.test.ts`
- Create: `migrations/<generated>/migration.sql`

**Interfaces:**
- Produces: `orpc.applicationProfile.get` and `orpc.applicationProfile.update`.

- [ ] Write service tests for default return, upsert, and authenticated user scoping.
- [ ] Run focused API test and confirm RED because service is absent.
- [ ] Add user-owned JSONB table, service, protected router, and router export.
- [ ] Generate migration through repository Drizzle command.
- [ ] Run focused API test and confirm GREEN.

### Task 3: Consolidated Account Page

**Files:**
- Modify: `apps/web/src/features/settings/pages/account.tsx`
- Modify: `apps/web/src/features/settings/pages/profile.tsx`
- Modify: `apps/web/src/routes/dashboard/settings/account.tsx`
- Test: `apps/web/src/features/settings/pages/account.test.tsx`

**Interfaces:**
- Consumes: existing auth client, theme/locale controls, and `IntegrationsSettingsPage`.
- Produces: Account sections for identity, preferences, AI providers, export, and deletion.

- [ ] Write rendering tests for identity, appearance/language, AI providers, and lifecycle sections.
- [ ] Run focused web test and confirm RED against current Account page.
- [ ] Extract reusable identity form and compose consolidated Account page.
- [ ] Run focused web test and confirm GREEN.

### Task 4: Profile Workspace Shell and Editors

**Files:**
- Create: `apps/web/src/features/settings/profile/types.ts`
- Create: `apps/web/src/features/settings/profile/navigation.tsx`
- Create: `apps/web/src/features/settings/profile/fields.tsx`
- Create: `apps/web/src/features/settings/profile/sections.tsx`
- Create: `apps/web/src/features/settings/profile/index.tsx`
- Modify: `apps/web/src/routes/dashboard/settings/profile.tsx`
- Test: `apps/web/src/features/settings/profile/index.test.tsx`

**Interfaces:**
- Consumes: `ApplicationProfile`, application-profile oRPC router, resume list query.
- Produces: screenshot-matched section navigation, controlled editors, Save Changes action.

- [ ] Write workspace test for all navigation labels and active-section switching.
- [ ] Run focused web test and confirm RED because workspace is absent.
- [ ] Implement workspace shell, reusable compact controls, and all section editors.
- [ ] Wire load/update queries and resume document links.
- [ ] Run focused web test and confirm GREEN.

### Task 5: Remove Standalone Pages and Navigation

**Files:**
- Modify: `apps/web/src/routes/dashboard/-components/sidebar.tsx`
- Modify: `apps/web/src/features/command-palette/pages/navigation.tsx`
- Modify: `apps/web/src/features/command-palette/index.tsx`
- Modify: `apps/web/src/routes/dashboard/settings/preferences.tsx`
- Modify: `apps/web/src/routes/dashboard/settings/integrations/route.tsx`
- Modify: `apps/web/src/routes/dashboard/settings/job-search.tsx`
- Modify: AI setup links under `apps/web/src/dialogs/resume/import.tsx` and `apps/web/src/features/ats-checker/ai-review/ai-review-card.tsx`
- Delete: `apps/web/src/features/settings/pages/preferences.tsx`
- Delete: `apps/web/src/features/command-palette/pages/preferences/index.tsx`
- Delete: `apps/web/src/features/command-palette/pages/preferences/index.test.tsx`

**Interfaces:**
- Produces: Settings navigation with Profile, Authentication, API Keys, Account only.

- [ ] Write or update navigation tests for removed standalone entries and Account redirects.
- [ ] Run focused tests and confirm RED against current navigation.
- [ ] Remove entries, redirect legacy routes, and point AI setup actions to Account.
- [ ] Regenerate route tree through web typecheck/build tooling.
- [ ] Run focused tests and confirm GREEN.

### Task 6: Verification and Graph Update

**Files:**
- Modify: `graphify-out/*` through Graphify update.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: verified implementation and current repository graph.

- [ ] Run focused schema, API, and web tests.
- [ ] Run package typechecks for schema, API, DB, and web.
- [ ] Run boundary check and `git diff --check`.
- [ ] Start or reuse dev server and inspect Account/Profile at desktop viewport.
- [ ] Capture screenshot and verify no overlap, clipping, or blank content.
- [ ] Run `graphify update .` once.

