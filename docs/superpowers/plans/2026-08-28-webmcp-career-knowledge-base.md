# WebMCP Career Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Profile the approved career knowledge base, expose stateless preview/apply and targeted-draft creation through WebMCP, and remove remote MCP completely.

**Architecture:** Versioned profile JSON remains in PostgreSQL with integer optimistic concurrency. Pure schema/merge/assembly modules validate every boundary; protected oRPC procedures own persistence and AI generation; Profile-page WebMCP tools are thin browser adapters over those procedures. Remote MCP server/package surfaces are deleted.

**Tech Stack:** TypeScript 7, React 19, TanStack Start/Router/Query, Hono, oRPC, Zod 4, Drizzle ORM/PostgreSQL, AI SDK, Vitest, browser WebMCP `document.modelContext`.

**Spec:** `docs/superpowers/specs/2026-08-28-webmcp-career-knowledge-base-design.md`

## Global Constraints

- WebMCP is the only model-context integration; remove remote MCP runtime and package surfaces.
- Profile writes require authentication, strict validation, explicit confirmation for agent merges, and optimistic revision matching.
- Do not store raw conversations, source files, provenance, confidence, or pending proposals.
- Targeted generation always creates a new private draft and never overwrites an existing resume.
- Exclude salary, screening, equal-opportunity, authorization, and saved answers from AI resume context.
- Preserve unrelated working-tree changes.
- Use Biome conventions: tabs, double quotes, 120-column width, organized imports.

---

### Task 1: Remove remote MCP runtime and package

**Files:**
- Delete: `packages/mcp/**`
- Delete: `apps/server/src/mcp/**`
- Modify: `apps/server/src/http/app.ts`
- Modify: `apps/server/src/http/app.test.ts`
- Modify: `apps/server/src/openapi/metadata.ts`
- Modify: `apps/server/src/openapi/metadata.test.ts`
- Modify: `apps/server/src/static/seo.ts`
- Modify: `apps/server/src/static/seo.test.ts`
- Modify: `apps/server/src/static/web.test.ts`
- Modify: `apps/server/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: current Hono route composition and OAuth metadata handlers.
- Produces: server with no remote MCP imports, handlers, routes, package dependency, server card, or advertised documentation.

- [ ] **Step 1: Write failing server-surface tests**

Update `apps/server/src/http/app.test.ts` to assert `POST /mcp`, `POST /mcp/tools`, and `GET /.well-known/mcp/server-card.json` do not produce MCP responses. Change `handleWellKnownFallback` to return 404 so the server-card path is observably absent.

```ts
it.each(["/mcp", "/mcp/tools", "/.well-known/mcp/server-card.json"])("does not expose %s", async (path) => {
	const response = await app.request(path, { method: path.startsWith("/mcp") ? "POST" : "GET" });
	expect(response.status).toBe(404);
});
```

- [ ] **Step 2: Run test to verify existing MCP routes fail expectation**

Run: `../../node_modules/.bin/vitest run src/http/app.test.ts` from `apps/server`.
Expected: FAIL because `/mcp` is routed and server-card returns 200.

- [ ] **Step 3: Remove server routes, handlers, imports, and metadata**

Delete `apps/server/src/mcp`. Remove `handleMcp`, `handleMcpServerCard`, `/mcp`, `/mcp/*`, and server-card route wiring. Keep OAuth/OpenID metadata used by Better Auth. Make unknown well-known routes return 404:

```ts
export function handleWellKnownFallback() {
	return new Response("Not Found", { status: 404 });
}
```

- [ ] **Step 4: Remove package and advertised references**

Delete `packages/mcp`. Remove `@reactive-resume/mcp` and `@modelcontextprotocol/sdk` from `apps/server/package.json`. Remove MCP lines from `robots.txt`, `llms.txt`, metadata tests, and reserved static-path tests. Refresh `pnpm-lock.yaml` with `pnpm install --lockfile-only` if dependency removal does not update it automatically.

- [ ] **Step 5: Verify server and dependency cleanup**

Run:

```bash
../../node_modules/.bin/vitest run src/http/app.test.ts src/openapi/metadata.test.ts src/static/seo.test.ts src/static/web.test.ts
rg -n "@reactive-resume/mcp|@modelcontextprotocol/sdk|handleMcp|/mcp|mcp/server-card" apps/server packages package.json pnpm-lock.yaml
```

Expected: tests PASS; search returns no remote-MCP runtime/package references. WebMCP paths under `apps/web/src/features/webmcp` are allowed.

- [ ] **Step 6: Commit remote MCP removal**

```bash
git add apps/server packages/mcp pnpm-lock.yaml
git commit -m "refactor: remove remote MCP server"
```

---

### Task 2: Upgrade Application Profile to version 2

**Files:**
- Modify: `packages/schema/src/application-profile.ts`
- Modify: `packages/schema/src/application-profile.test.ts`

**Interfaces:**
- Consumes: persisted `ApplicationProfileV1` JSON documents.
- Produces: `ApplicationProfile`, `ApplicationProfileCandidate`, `applicationProfileSchema`, `applicationProfileCandidateSchema`, `defaultApplicationProfile`, and `parseApplicationProfile(value): ApplicationProfile`.

- [ ] **Step 1: Add failing schema and migration tests**

Cover defaults, new collections, optional IDs in candidates, and lossless v1 conversion:

```ts
it("migrates a v1 profile without losing career data", () => {
	const migrated = parseApplicationProfile(v1Profile);
	expect(migrated.version).toBe(2);
	expect(migrated.experience).toEqual(v1Profile.experience.map((item) => ({ ...item, highlights: [] })));
	expect(migrated.achievements).toEqual([]);
});

it("accepts extracted candidates without collection IDs", () => {
	expect(applicationProfileCandidateSchema.safeParse({ skills: ["TypeScript"], hackathons: [{ event: "HackX" }] }).success).toBe(true);
});
```

- [ ] **Step 2: Run schema tests to verify failure**

Run: `node_modules/.bin/vitest run packages/schema/src/application-profile.test.ts`.
Expected: FAIL because v2 types and parser do not exist.

- [ ] **Step 3: Define focused v2 entry schemas**

Add exported schemas/types for achievements, hackathons, publications, custom facts, and candidate input. Use bounded strings and arrays. Required persisted entries use non-empty IDs; candidate entries make IDs optional. Add `highlights: string[]` to experience/project persisted and candidate shapes.

```ts
export const achievementSchema = z.object({
	id: z.string().min(1),
	title: z.string().max(160),
	description: z.string().max(4_000),
	metrics: z.array(z.string().max(240)).max(20),
	skills: z.array(z.string().max(120)).max(100),
	relatedExperienceId: z.string().nullable(),
	relatedProjectId: z.string().nullable(),
});
```

- [ ] **Step 4: Implement v1-to-v2 parser**

Keep a private `applicationProfileV1Schema`, define v2 as canonical `applicationProfileSchema`, set `defaultApplicationProfile.version` to `2`, and implement:

```ts
export function parseApplicationProfile(value: unknown): ApplicationProfile {
	const v2 = applicationProfileSchema.safeParse(value);
	if (v2.success) return v2.data;
	const v1 = applicationProfileV1Schema.parse(value);
	return applicationProfileSchema.parse({
		...v1,
		version: 2,
		experience: v1.experience.map((item) => ({ ...item, highlights: [] })),
		projects: v1.projects.map((item) => ({ ...item, highlights: [] })),
		careerSummary: "",
		achievements: [],
		hackathons: [],
		publications: [],
		customFacts: [],
	});
}
```

- [ ] **Step 5: Run schema tests**

Run: `node_modules/.bin/vitest run packages/schema/src/application-profile.test.ts`.
Expected: PASS.

- [ ] **Step 6: Commit profile v2 schema**

```bash
git add packages/schema/src/application-profile.ts packages/schema/src/application-profile.test.ts
git commit -m "feat: expand career profile schema"
```

---

### Task 3: Add profile revisions and document API

**Files:**
- Modify: `packages/db/src/schema/application-profile.ts`
- Create: one root `migrations/` migration directory generated by `pnpm db:generate` for the revision column
- Modify: `packages/api/src/features/application-profile/service.ts`
- Modify: `packages/api/src/features/application-profile/service.test.ts`
- Modify: `packages/api/src/features/application-profile/router.ts`
- Modify: `apps/web/src/features/settings/profile/index.tsx`
- Modify: `apps/web/src/features/settings/profile/index.test.tsx`

**Interfaces:**
- Consumes: `parseApplicationProfile()` from Task 2.
- Produces: `ApplicationProfileDocument = { profile: ApplicationProfile; revision: number }`, `getDocument({userId})`, and revision-checked `update({userId, profile, revision})`.

- [ ] **Step 1: Add failing service tests for revisions**

Test empty document revision 0, v1 read normalization, successful compare-and-swap, and conflict:

```ts
await expect(applicationProfileService.getDocument({ userId: "user-1" })).resolves.toEqual({
	profile: defaultApplicationProfile,
	revision: 0,
});

await expect(applicationProfileService.update({ userId: "user-1", profile, revision: 4 })).rejects.toMatchObject({
	code: "CONFLICT",
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `node_modules/.bin/vitest run packages/api/src/features/application-profile/service.test.ts`.
Expected: FAIL because document/revision APIs do not exist.

- [ ] **Step 3: Add revision column and generate migration**

Add `revision: pg.integer("revision").notNull().default(1)` to `applicationProfile`. Load `drizzle-kit#drizzle-migrations` and `drizzle-kit#drizzle-generate`, then run:

```bash
dotenvx run -f .env.local -- pnpm db:generate
```

Verify generated SQL adds non-null integer `revision` with default `1` and does not alter profile JSONB.

- [ ] **Step 4: Implement document reads and compare-and-swap writes**

Use `parseApplicationProfile(row.data)`. Existing rows return stored revision; missing rows return revision 0. Update existing rows with `WHERE user_id = ? AND revision = ?`, incrementing revision atomically. First write inserts revision 1 and converts unique-key races into `ORPCError("CONFLICT")`. Return canonical document.

- [ ] **Step 5: Update router and manual Profile editor**

Change GET output to `{ profile, revision }`. Change PUT input to `{ profile, revision }`. Keep local revision state in `ApplicationProfileSettingsPage`; after save, replace profile and revision with server response. On conflict, show refresh/try-again error and do not reset local edits.

- [ ] **Step 6: Run focused tests and typechecks**

```bash
node_modules/.bin/vitest run packages/api/src/features/application-profile/service.test.ts
cd apps/web && ../../node_modules/.bin/vitest run src/features/settings/profile/index.test.tsx
cd ../.. && pnpm --filter @reactive-resume/schema typecheck && pnpm --filter @reactive-resume/api typecheck && pnpm --filter web typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit revisioned profile API**

```bash
git add packages/db/src/schema/application-profile.ts migrations packages/api/src/features/application-profile apps/web/src/features/settings/profile
git commit -m "feat: add revisioned career profile API"
```

---

### Task 4: Implement deterministic profile merge preview and apply

**Files:**
- Create: `packages/api/src/features/application-profile/merge.ts`
- Create: `packages/api/src/features/application-profile/merge.test.ts`
- Modify: `packages/api/src/features/application-profile/service.ts`
- Modify: `packages/api/src/features/application-profile/service.test.ts`
- Modify: `packages/api/src/features/application-profile/router.ts`

**Interfaces:**
- Consumes: `ApplicationProfileDocument`, `ApplicationProfileCandidate`, and revisioned update from Task 3.
- Produces: `ProfileMergeOperation`, `ProfileMergePreview`, `previewProfileMerge(document, candidate)`, `applyMerge({userId, revision, operations, confirm})`.

- [ ] **Step 1: Add failing pure merge tests**

Cover trimming, case-insensitive skill/language deduplication, conservative entity identity, generated IDs, additive ambiguous entries, empty-string preservation, deterministic operations, and disallowed paths.

```ts
const preview = previewProfileMerge(document, {
	skills: [" TypeScript ", "typescript"],
	experience: [{ title: "Engineer", company: "Acme", highlights: ["Cut latency 30%"] }],
});
expect(preview.profile.skills).toEqual(["TypeScript"]);
expect(preview.operations.every((operation) => isAllowedProfilePath(operation.path))).toBe(true);
expect(document.profile).toEqual(originalProfile);
```

- [ ] **Step 2: Run merge tests to verify failure**

Run: `node_modules/.bin/vitest run packages/api/src/features/application-profile/merge.test.ts`.
Expected: FAIL because merge module does not exist.

- [ ] **Step 3: Implement pure normalization and merge**

Normalize without mutation. Generate IDs with `generateId()`. Match entries by explicit ID first; otherwise use conservative keys such as normalized `company + title + startDate` for experience and `name + startDate` for projects. Never remove existing collection entries from candidate omission. Ignore empty incoming scalars when current value is non-empty.

- [ ] **Step 4: Produce and validate profile-specific JSON Patch**

Use `fast-json-patch.compare(current, merged)` or existing JSON Patch helpers, then validate operations with an explicit top-level allowlist:

```ts
const ALLOWED_PROFILE_ROOTS = new Set([
	"careerSummary", "jobPreferences", "personal", "skills", "languages", "experience", "education",
	"projects", "volunteer", "certifications", "awards", "achievements", "hackathons", "publications",
	"customFacts", "workAuthorization", "screening", "equalOpportunity",
]);
```

Reject prototype paths and any operation touching `/version`.

- [ ] **Step 5: Add preview/apply procedures**

Add protected routes:

```ts
previewMerge: input { candidate: applicationProfileCandidateSchema }
applyMerge: input { revision: z.number().int().nonnegative(), operations: profileMergeOperationsSchema, confirm: z.literal(true) }
```

Preview loads current document and returns `{ revision, operations, summary, profile }` without writing. Apply re-reads, verifies revision, applies allowed operations, validates the complete profile, and persists through compare-and-swap.

- [ ] **Step 6: Verify pure and service behavior**

Run:

```bash
node_modules/.bin/vitest run packages/api/src/features/application-profile/merge.test.ts packages/api/src/features/application-profile/service.test.ts
pnpm --filter @reactive-resume/api typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit deterministic merge**

```bash
git add packages/api/src/features/application-profile
git commit -m "feat: preview and apply career profile merges"
```

---

### Task 5: Generate targeted resume drafts from approved profile

**Files:**
- Create: `packages/api/src/features/application-profile/resume-context.ts`
- Create: `packages/api/src/features/application-profile/resume-context.test.ts`
- Create: `packages/api/src/features/application-profile/targeted-resume.ts`
- Create: `packages/api/src/features/application-profile/targeted-resume.test.ts`
- Modify: `packages/api/src/features/application-profile/router.ts`

**Interfaces:**
- Consumes: revisioned v2 profile, `defaultResumeData`, `resumeService`, configured AI provider, and optional owned base resume.
- Produces: `targetedResumeInputSchema`, `buildResumeSafeProfileContext(profile)`, `assembleTargetedResume(input)`, and `createTargetedResume({userId, locale, input})` returning `{resumeId, name, builderUrl}`.

- [ ] **Step 1: Add failing privacy/context tests**

```ts
const context = buildResumeSafeProfileContext(profileWithSensitiveValues);
expect(JSON.stringify(context)).not.toContain("veteranStatus");
expect(JSON.stringify(context)).not.toContain("minimumSalary");
expect(context.achievements).toEqual(profileWithSensitiveValues.achievements);
```

- [ ] **Step 2: Implement resume-safe context projection**

Include personal contact/links, career summary, skills, languages, experience, education, projects, volunteer, certifications, awards, achievements, hackathons, publications, and custom career facts. Exclude complete `jobPreferences`, `workAuthorization`, `screening`, and `equalOpportunity` objects.

- [ ] **Step 3: Add failing selection and assembly tests**

Model output schema must reference source IDs and exact skill strings. Test unknown IDs, invented metrics, private defaults, base metadata copying, template override, and valid `ResumeData`.

```ts
expect(() => assembleTargetedResume({ profile, plan: { experienceIds: ["missing"] } })).toThrow(
	/unknown profile entry/i,
);
expect(parseResumeData(result.data)).toEqual(result.data);
expect(result.data.metadata).toEqual(baseResume.data.metadata);
```

- [ ] **Step 4: Define structured AI plan and deterministic assembler**

AI plan contains summary/headline presentation text, selected entry IDs, selected skills/languages, and rewritten highlights keyed by source entry ID. Validate all references before assembly. Convert plain text to sanitized paragraph/list HTML using existing resume helpers or a focused escaping helper. Build from `defaultResumeData`; copy optional base `metadata` only; apply optional template after the copy.

- [ ] **Step 5: Implement generation service**

Resolve default tested AI provider using existing `aiProvidersService` and `getModel`. Call `generateJson` with job description, optional role/company, and resume-safe profile context. Reject an empty career profile before calling AI. Validate plan, assemble `ResumeData`, then call `resumeService.create` only after every earlier step succeeds. Create name `Tailored — {company} · {role}` when provided, otherwise a bounded user name or `Targeted Resume`.

- [ ] **Step 6: Add protected, rate-limited route**

Input:

```ts
z.object({
	jobDescription: z.string().trim().min(1).max(20_000),
	role: z.string().trim().max(160).optional(),
	company: z.string().trim().max(160).optional(),
	baseResumeId: z.string().optional(),
	name: z.string().trim().min(1).max(60).optional(),
	template: templateSchema.optional(),
})
```

Apply `aiRequestRateLimit`. Return `{ resumeId, name, builderUrl: "/builder/" + resumeId }`.

- [ ] **Step 7: Verify generation**

Run:

```bash
node_modules/.bin/vitest run packages/api/src/features/application-profile/resume-context.test.ts packages/api/src/features/application-profile/targeted-resume.test.ts
pnpm --filter @reactive-resume/api typecheck
```

Expected: PASS.

- [ ] **Step 8: Commit targeted generation**

```bash
git add packages/api/src/features/application-profile
git commit -m "feat: create targeted resumes from career profile"
```

---

### Task 6: Register Profile WebMCP tools

**Files:**
- Create: `apps/web/src/features/webmcp/profile-tools.ts`
- Create: `apps/web/src/features/webmcp/profile-tools.test.ts`
- Modify: `apps/web/src/features/settings/profile/index.tsx`
- Modify: `apps/web/src/features/settings/profile/index.test.tsx`

**Interfaces:**
- Consumes: oRPC profile get/preview/apply/create procedures and `useWebMcpTools`.
- Produces: `createProfileTools({client, navigate}): WebMcpTool[]` registering `get_career_profile`, `preview_profile_merge`, `apply_profile_merge`, and `create_targeted_resume` only on Profile page.

- [ ] **Step 1: Add failing tool contract tests**

Mock oRPC client methods and assert exact tool names, annotations, validation, no write during preview, confirmation enforcement, API forwarding, and builder navigation result.

```ts
expect(createProfileTools({ client, navigate }).map((tool) => tool.name)).toEqual([
	"get_career_profile",
	"preview_profile_merge",
	"apply_profile_merge",
	"create_targeted_resume",
]);
expect(client.applicationProfile.applyMerge).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run tool tests to verify failure**

Run: `../../node_modules/.bin/vitest run src/features/webmcp/profile-tools.test.ts` from `apps/web`.
Expected: FAIL because profile tools do not exist.

- [ ] **Step 3: Implement thin WebMCP adapters**

Use Zod validators shared from `@reactive-resume/schema/application-profile` where possible and JSON Schema objects compatible with current `WebMcpTool.inputSchema`. Convert all success values with `webMcpJson`; catch errors with `errorMessage`/`webMcpError`. Mark get/preview read-only. Apply requires schema literal `confirm: true`. Targeted creation is non-idempotent.

- [ ] **Step 4: Register tools in Profile page lifecycle**

Memoize tools from the stable oRPC client and router navigation. Call `useWebMcpTools(profileTools, !isLoading)`. Existing hook aborts registrations on unmount, ensuring tools disappear outside Profile.

- [ ] **Step 5: Verify browser registration and profile UI**

Run from `apps/web`:

```bash
../../node_modules/.bin/vitest run src/features/webmcp/profile-tools.test.ts src/features/settings/profile/index.test.tsx src/features/webmcp/use-webmcp-tools.test.tsx
../../node_modules/.bin/tsgo --noEmit -p tsconfig.json
```

Expected: PASS.

- [ ] **Step 6: Commit Profile WebMCP tools**

```bash
git add apps/web/src/features/webmcp/profile-tools.ts apps/web/src/features/webmcp/profile-tools.test.ts apps/web/src/features/settings/profile
git commit -m "feat: expose career profile through WebMCP"
```

---

### Task 7: Repository-wide cleanup and verification

**Files:**
- Modify only files required by formatting, generated route/OpenAPI artifacts, package boundaries, or test corrections discovered during verification.
- Modify: `graphify-out/graph.json` and other Graphify generated outputs through `graphify update .`.

**Interfaces:**
- Consumes: completed Tasks 1-6.
- Produces: verified WebMCP-only build with current knowledge graph.

- [ ] **Step 1: Search for stale remote MCP surfaces**

```bash
rg -n "@reactive-resume/mcp|@modelcontextprotocol/sdk|apps/server/src/mcp|/mcp|mcp/server-card" \
	apps packages package.json pnpm-lock.yaml turbo.json docs --glob '!docs/superpowers/**'
```

Expected: no remote MCP implementation or advertised endpoints. Mentions describing WebMCP are valid.

- [ ] **Step 2: Run focused profile and WebMCP suites**

```bash
node_modules/.bin/vitest run packages/schema/src/application-profile.test.ts \
	packages/api/src/features/application-profile/service.test.ts \
	packages/api/src/features/application-profile/merge.test.ts \
	packages/api/src/features/application-profile/resume-context.test.ts \
	packages/api/src/features/application-profile/targeted-resume.test.ts
cd apps/web && ../../node_modules/.bin/vitest run src/features/settings/profile/index.test.tsx \
	src/features/webmcp/profile-tools.test.ts src/features/webmcp/use-webmcp-tools.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run package checks**

```bash
pnpm --filter @reactive-resume/schema typecheck
pnpm --filter @reactive-resume/api typecheck
pnpm --filter server typecheck
pnpm --filter web typecheck
pnpm exec turbo boundaries
```

Expected: PASS.

- [ ] **Step 4: Run non-mutating format checks on touched files, then full build**

Run this non-mutating check, followed by `pnpm build`. Fix only feature-related failures; preserve unrelated landing-page edits.

```bash
pnpm exec biome check packages/schema/src/application-profile.ts packages/api/src/features/application-profile \
	packages/db/src/schema/application-profile.ts apps/web/src/features/webmcp/profile-tools.ts \
	apps/web/src/features/settings/profile apps/server/src
pnpm build
```

- [ ] **Step 5: Update Graphify and inspect final diff**

```bash
graphify update .
git diff --check
git status --short
```

Expected: graph current; no whitespace errors; only intended feature files, generated migration/lockfile, Graphify output, and pre-existing user edits remain.

- [ ] **Step 6: Commit final verification fixes**

```bash
git add graphify-out
git commit -m "test: verify WebMCP career knowledge flow"
```
