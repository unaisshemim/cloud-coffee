# WebMCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WebMCP browser-page tools to Reactive Resume so browser-integrated AI agents can use the same core capabilities exposed by the existing MCP server, plus page-context tools that act on the current UI.

**Architecture:** Keep the existing MCP implementation in `packages/mcp` and `apps/server/src/mcp` as the server-side integration, but treat its tool list as the WebMCP parity baseline. Add a browser-only WebMCP layer in `apps/web` that registers route-scoped tools through `document.modelContext.registerTool()` when supported, unregisters them on route unmount, and reuses existing oRPC clients, TanStack Router navigation, dashboard filters, dialogs, and builder store actions. Treat WebMCP as progressive enhancement: unsupported browsers get normal UI behavior.

**Tech Stack:** TanStack Start, React 19, Vite, TypeScript, Zod, oRPC, TanStack Query, Zustand, Vitest, `webmcp-types` or local ambient WebMCP types if package adoption is blocked.

**Spec:** No separate design doc exists yet. This plan is based on the user request, the current Reactive Resume repo shape, and the WebMCP draft/API docs:
- https://github.com/webmachinelearning/webmcp
- https://webmachinelearning.github.io/webmcp/

## Global Constraints

- WebMCP is browser-side only. Do not move resume-edit logic out of the current web UI flow.
- Existing MCP remains available at the server MCP endpoint; WebMCP complements it and must support the same user-facing CRUD/creation capabilities where a browser-side authenticated oRPC implementation exists.
- Tools must register only for authenticated routes and active page context.
- Tool names must be stable ASCII names using letters, numbers, `_`, `-`, or `.` and stay under 128 characters.
- All tool inputs must use JSON Schema-compatible schemas.
- Any write tool must respect current app permissions, locked resume state, existing confirmation flows where needed, and server validation.
- WebMCP must be optional: app must build and run when `document.modelContext` is undefined.
- Tool outputs that include user resume/application data must be marked untrusted where supported.
- New environment variables are not expected. If added later, update `turbo.json` `globalEnv`.

---

## Current State

Reactive Resume already has existing MCP support:

- `packages/mcp/src/tools.ts` registers server MCP tools.
- `packages/mcp/src/tool-meta.ts` owns canonical MCP metadata and schemas.
- `apps/server/src/mcp/handler.ts` handles authenticated MCP HTTP transport.
- `apps/server/src/mcp/server.ts` creates the MCP server using oRPC.

Web UI state and actions live mostly here:

- `apps/web/src/libs/orpc/client.ts` provides authenticated browser oRPC calls.
- `apps/web/src/features/resume/builder/draft.ts` owns current builder resume state, autosave, undo/redo, lock checks, and remote update handling.
- `apps/web/src/routes/dashboard/resumes/index.tsx` owns resume dashboard search/filter/sort/view route state.
- `apps/web/src/routes/dashboard/applications/index.tsx` owns application dashboard view/filter state.
- `apps/web/src/routes/builder/$resumeId/route.tsx` initializes builder state.
- `apps/web/src/routes/agent/*` owns agent thread UI and resume pane.

## Target Tool Set

WebMCP must provide parity with the existing MCP tool surface wherever the web app already has an authenticated oRPC path. Use the same conceptual names and schemas where possible, prefixed for WebMCP page tools only when needed to avoid ambiguity.

Parity tools:

- `list_resumes`
- `list_resume_tags`
- `read_resume`
- `download_resume_pdf`
- `create_resume`
- `import_resume`
- `duplicate_resume`
- `apply_resume_patch`
- `update_resume`
- `delete_resume`
- `lock_resume`
- `unlock_resume`
- `get_resume_statistics`
- `list_applications`
- `read_application`
- `list_application_tags`
- `get_application_stats`
- `create_application`
- `update_application`
- `add_application_note`
- `update_application_timeline_entry`
- `delete_application_timeline_entry`
- `delete_application`
- `bulk_update_applications`
- `bulk_delete_applications`
- `import_applications`
- `attach_application_document`
- `remove_application_document`
- `autofill_application_from_job`
- `score_application_match`
- `tailor_resume_for_application`
- `draft_application_message`

Page-context tools stay additive:

- `rr.page.describe`: read-only. Return current route, page kind, visible IDs from route/search params, and whether WebMCP tools are enabled.
- `rr.resumes.list_visible`: read-only. Return currently loaded dashboard resume rows after active search/filter/sort.
- `rr.resumes.open`: navigates to `/builder/$resumeId`.
- `rr.resumes.start_create`: opens existing create-resume dialog.
- `rr.builder.read_current_resume`: read-only. Return current builder resume metadata and full `ResumeData`.
- `rr.builder.apply_patch`: write. Validate JSON Patch input, call existing `updateResumeData` path, preserve autosave/undo/redo.
- `rr.builder.undo` and `rr.builder.redo`: write. Reuse existing builder store actions.
- `rr.agent.start_thread`: write. Navigate to `/agent/new` with optional `resumeId`.

Implementation phases should still be incremental, but Phase 1 is not feature-minimal. It must establish shared metadata and wire enough parity tools to prove create/read/update/delete for resumes and applications. Phase 2 fills AI-heavy and file-heavy parity tools.

## File Structure

- Create `apps/web/src/features/webmcp/types.ts`
  - Ambient-safe interfaces for `document.modelContext`, tool definitions, annotations, register options, and execution options.
- Create `apps/web/src/features/webmcp/schemas.ts`
  - JSON Schema constants and small Zod validators for WebMCP tool inputs.
- Create `apps/web/src/features/webmcp/register.ts`
  - Feature detection, register/unregister lifecycle, duplicate-name handling, and testable helpers.
- Create `apps/web/src/features/webmcp/results.ts`
  - Helpers for text/JSON tool results and normalized error output.
- Create `apps/web/src/features/webmcp/parity-tool-names.ts`
  - Browser-side export derived from `MCP_TOOL_NAME` names or a copied constant with a parity test against `packages/mcp`.
- Create `apps/web/src/features/webmcp/parity-schemas.ts`
  - JSON Schema and Zod executable validators for every existing MCP parity tool.
- Create `apps/web/src/features/webmcp/parity-tools.ts`
  - Browser WebMCP tool factories that call authenticated oRPC and return WebMCP-shaped results.
- Create `apps/web/src/features/webmcp/use-webmcp-tools.ts`
  - React hook that registers a list of tools with an `AbortController` and unregisters on cleanup.
- Create `apps/web/src/features/webmcp/page-tools.ts`
  - Shared route/page description tool factory.
- Create `apps/web/src/features/webmcp/resume-dashboard-tools.ts`
  - Resume dashboard tool factories using current list/search state and navigation callbacks.
- Create `apps/web/src/features/webmcp/builder-tools.ts`
  - Builder tool factories using `useResumeStore`, JSON Patch validation, and existing autosave behavior.
- Create `apps/web/src/features/webmcp/agent-tools.ts`
  - Agent route helper tools for starting a thread from current resume context.
- Create tests beside each new module with `.test.ts` or `.test.tsx`.
- Modify `apps/web/src/routes/dashboard/resumes/index.tsx`
  - Register dashboard resume tools after filtered rows are computed.
- Modify `apps/web/src/routes/builder/$resumeId/route.tsx`
  - Register builder tools once current resume is initialized.
- Modify `apps/web/src/routes/agent/new.tsx` and `apps/web/src/routes/agent/$threadId.tsx`
  - Register page/agent tools for current agent context.
- Modify `apps/web/package.json`
  - Add `webmcp-types` only if local ambient declarations are insufficient.
- Modify `packages/mcp/src/index.ts` or add package export subpath only if `apps/web` cannot legally consume `MCP_TOOL_NAME` / schema metadata through existing package exports.

## Task 1: Add WebMCP Type Boundary And Registration Core

**Files:**
- Create: `apps/web/src/features/webmcp/types.ts`
- Create: `apps/web/src/features/webmcp/register.ts`
- Create: `apps/web/src/features/webmcp/register.test.ts`

**Interfaces:**
- Produces: `WebMcpTool`, `WebMcpToolResult`, `registerWebMcpTools(tools, options)`
- Consumes: browser `document.modelContext.registerTool`

- [ ] Add browser-safe WebMCP types.

```ts
export type WebMcpToolResultContent = { type: "text"; text: string };

export type WebMcpToolResult = {
	content: WebMcpToolResultContent[];
	isError?: boolean;
};

export type WebMcpToolAnnotations = {
	readOnlyHint?: boolean;
	untrustedContentHint?: boolean;
};

export type WebMcpTool = {
	name: string;
	title?: string;
	description: string;
	inputSchema: Record<string, unknown>;
	annotations?: WebMcpToolAnnotations;
	execute: (input: unknown, options: { signal: AbortSignal }) => Promise<WebMcpToolResult>;
};
```

- [ ] Add feature detection and registration helper.

```ts
export function hasWebMcpSupport(doc: Document = document) {
	return "modelContext" in doc && typeof doc.modelContext?.registerTool === "function";
}
```

- [ ] Implement `registerWebMcpTools`.
  - If unsupported, return `{ supported: false, unregister: () => {} }`.
  - Create one `AbortController`.
  - Call `document.modelContext.registerTool(tool, { signal })` for each tool.
  - On cleanup, abort controller.
  - Validate duplicate tool names locally and throw a developer error.

- [ ] Test unsupported browser path.

```ts
expect(registerWebMcpTools([], { document: fakeDocumentWithoutModelContext }).supported).toBe(false);
```

- [ ] Test duplicate tool names fail before browser registration.

```ts
expect(() => registerWebMcpTools([tool("rr.page.describe"), tool("rr.page.describe")], options)).toThrow(
	/duplicate/i,
);
```

- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/register.test.ts
```

## Task 2: Add Tool Result And Schema Helpers

**Files:**
- Create: `apps/web/src/features/webmcp/results.ts`
- Create: `apps/web/src/features/webmcp/schemas.ts`
- Create: `apps/web/src/features/webmcp/results.test.ts`
- Create: `apps/web/src/features/webmcp/schemas.test.ts`

**Interfaces:**
- Produces: `webMcpText`, `webMcpJson`, `webMcpError`, `emptyObjectSchema`, `resumeIdInputSchema`, `patchInputSchema`, parity schema constants for existing MCP tools
- Consumes: Zod, existing MCP schema intent from `packages/mcp/src/tool-meta.ts`, and JSON Schema-compatible plain objects

- [ ] Add result helpers.

```ts
export const webMcpText = (text: string) => ({ content: [{ type: "text" as const, text }] });
export const webMcpJson = (value: unknown) => webMcpText(JSON.stringify(value, null, 2));
export const webMcpError = (message: string) => ({ ...webMcpText(message), isError: true });
```

- [ ] Add input schemas.

```ts
export const emptyObjectSchema = { type: "object", properties: {}, additionalProperties: false };
export const resumeIdInputSchema = {
	type: "object",
	properties: { id: { type: "string", minLength: 1 } },
	required: ["id"],
	additionalProperties: false,
};
```

- [ ] Add Zod validators for executable handlers.
  - `resumeIdInput = z.object({ id: z.string().min(1) }).strict()`
  - `patchInput = z.object({ operations: resumePatchOperationsSchema }).strict()`

- [ ] Add parity schemas for all existing MCP tool inputs.
  - Resume tools mirror `packages/mcp/src/tool-meta.ts` inputs.
  - Application tools mirror `packages/mcp/src/tool-meta.ts` inputs.
  - File tools keep browser-safe constraints: PDF-only, max 10 MB, explicit media type.
  - AI tools keep existing application/resume IDs and job-description input limits.

- [ ] Test helpers produce MCP-shaped content.
- [ ] Test every parity tool name has one schema entry.
- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/results.test.ts src/features/webmcp/schemas.test.ts
```

## Task 3: Add Existing MCP Parity Tool Catalog

**Files:**
- Create: `apps/web/src/features/webmcp/parity-tool-names.ts`
- Create: `apps/web/src/features/webmcp/parity-schemas.ts`
- Create: `apps/web/src/features/webmcp/parity-tools.ts`
- Create: `apps/web/src/features/webmcp/parity-tools.test.ts`
- Modify: `packages/mcp/package.json` only if a new browser-safe export subpath is required.

**Interfaces:**
- Consumes: `MCP_TOOL_NAME`, `TOOL_META` shape, `client`/`orpc` from `apps/web/src/libs/orpc/client.ts`
- Produces: `createWebMcpParityTools(context): WebMcpTool[]`

- [ ] Define parity catalog with every existing MCP tool name.

```ts
export const WEBMCP_PARITY_TOOL_NAMES = [
	"list_resumes",
	"list_resume_tags",
	"read_resume",
	"download_resume_pdf",
	"create_resume",
	"import_resume",
	"duplicate_resume",
	"apply_resume_patch",
	"update_resume",
	"delete_resume",
	"lock_resume",
	"unlock_resume",
	"get_resume_statistics",
	"list_applications",
	"read_application",
	"list_application_tags",
	"get_application_stats",
	"create_application",
	"update_application",
	"add_application_note",
	"update_application_timeline_entry",
	"delete_application_timeline_entry",
	"delete_application",
	"bulk_update_applications",
	"bulk_delete_applications",
	"import_applications",
	"attach_application_document",
	"remove_application_document",
	"autofill_application_from_job",
	"score_application_match",
	"tailor_resume_for_application",
	"draft_application_message",
] as const;
```

- [ ] Implement browser tool handlers through oRPC.
  - Resume CRUD tools call `client.resume.*`.
  - Application CRUD tools call `client.applications.*`.
  - PDF download uses browser PDF generation or server download URL, whichever existing web export flow already uses for authenticated users.
  - `apply_resume_patch` uses existing JSON Patch behavior and invalidates/resyncs query cache.
  - AI tools call existing application AI procedures where available.

- [ ] Keep unsupported server-only parity explicit.
  - If one existing MCP tool has no browser-safe oRPC path, register it only on routes where it can work or return `isError: true` with exact reason.
  - Do not silently omit parity tools from authenticated app routes.

- [ ] Test catalog parity.

```ts
expect([...WEBMCP_PARITY_TOOL_NAMES].sort()).toEqual([...Object.values(MCP_TOOL_NAME)].sort());
```

- [ ] Test create/update/delete resume handler calls correct oRPC methods.
- [ ] Test create/update/delete application handler calls correct oRPC methods.
- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/parity-tools.test.ts
```

## Task 4: Add React Registration Hook

**Files:**
- Create: `apps/web/src/features/webmcp/use-webmcp-tools.ts`
- Create: `apps/web/src/features/webmcp/use-webmcp-tools.test.tsx`

**Interfaces:**
- Consumes: `WebMcpTool[]`
- Produces: `useWebMcpTools(tools: WebMcpTool[], enabled?: boolean): void`

- [ ] Implement hook with `useEffect`.
  - Register only on client.
  - Register only when `enabled !== false`.
  - Cleanup aborts registration.
  - Require callers to memoize tool arrays; tests should document this.

- [ ] Test cleanup aborts tool registrations by using a fake `document.modelContext.registerTool`.
- [ ] Test `enabled: false` does not register.
- [ ] Run hook tests.

```bash
pnpm --filter web test -- src/features/webmcp/use-webmcp-tools.test.tsx
```

## Task 5: Register Shared Page Description Tool

**Files:**
- Create: `apps/web/src/features/webmcp/page-tools.ts`
- Create: `apps/web/src/features/webmcp/page-tools.test.ts`
- Modify: `apps/web/src/routes/dashboard/resumes/index.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/route.tsx`
- Modify: `apps/web/src/routes/agent/new.tsx`
- Modify: `apps/web/src/routes/agent/$threadId.tsx`

**Interfaces:**
- Produces: `createPageDescriptionTool(input): WebMcpTool`
- Consumes: route context object from each page

- [ ] Implement `rr.page.describe`.
  - Input schema: empty object.
  - Annotation: `{ readOnlyHint: true, untrustedContentHint: false }`.
  - Output: `{ page, route, params, search, capabilities }`.

- [ ] Add route-specific registration using `useMemo`.

```ts
const webMcpTools = useMemo(
	() => [createPageDescriptionTool({ page: "resume-dashboard", route: "/dashboard/resumes", search: { tags, sort, view } })],
	[tags, sort, view],
);
useWebMcpTools(webMcpTools);
```

- [ ] Test factory output and empty input behavior.
- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/page-tools.test.ts
```

## Task 6: Register Resume Dashboard Tools

**Files:**
- Create: `apps/web/src/features/webmcp/resume-dashboard-tools.ts`
- Create: `apps/web/src/features/webmcp/resume-dashboard-tools.test.ts`
- Modify: `apps/web/src/routes/dashboard/resumes/index.tsx`

**Interfaces:**
- Consumes: filtered resumes, `navigate`, `openDialog`
- Produces: tools `rr.resumes.list_visible`, `rr.resumes.open`, `rr.resumes.start_create`, plus global existing MCP parity tools from `createWebMcpParityTools`

- [ ] Implement `rr.resumes.list_visible`.
  - Return only current visible rows: `id`, `name`, `slug`, `tags`, `isPublic`, `isLocked`, `updatedAt`.
  - Mark output `untrustedContentHint: true`.

- [ ] Implement `rr.resumes.open`.
  - Input: `{ id: string }`.
  - Verify ID exists in current loaded resume list before navigating.
  - Call `navigate({ to: "/builder/$resumeId", params: { resumeId: id } })`.

- [ ] Implement `rr.resumes.start_create`.
  - Input: empty object.
  - Call `openDialog("resume.create", undefined)`.

- [ ] Register parity resume tools on dashboard.
  - Include `list_resumes`, `list_resume_tags`, `read_resume`, `create_resume`, `import_resume`, `duplicate_resume`, `update_resume`, `delete_resume`, `lock_resume`, `unlock_resume`, `get_resume_statistics`, and `download_resume_pdf`.
  - Prefer direct oRPC execution for create/import/update/delete; dialogs are only for `rr.resumes.start_create`.

- [ ] Test navigation rejects unknown IDs.
- [ ] Test create tool calls dialog store callback.
- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/resume-dashboard-tools.test.ts
```

## Task 7: Register Builder Read And Edit Tools

**Files:**
- Create: `apps/web/src/features/webmcp/builder-tools.ts`
- Create: `apps/web/src/features/webmcp/builder-tools.test.ts`
- Modify: `apps/web/src/routes/builder/$resumeId/route.tsx`

**Interfaces:**
- Consumes: `useResumeStore`, `resumePatchOperationsSchema`
- Produces: tools `rr.builder.read_current_resume`, `rr.builder.apply_patch`, `rr.builder.undo`, `rr.builder.redo`, plus current-resume optimized parity tools

- [ ] Implement `rr.builder.read_current_resume`.
  - Read current store state at execution time, not registration time.
  - Return metadata plus `data`.
  - Mark read-only and untrusted output.

- [ ] Implement `rr.builder.apply_patch`.
  - Input: `{ operations: PatchOperation[] }`.
  - Validate with existing `resumePatchOperationsSchema`.
  - If no resume loaded, return error.
  - If resume locked, return error matching existing locked behavior.
  - Apply operations through `updateResumeData` so autosave, history, and preview update.

- [ ] Use existing JSON Patch helper from `@reactive-resume/resume/patch` if available.
  - If no browser-safe helper exists, add a focused export in `packages/resume` rather than duplicating patch logic in web.

- [ ] Implement undo/redo tools.
  - Call `useResumeStore.getState().undo()` or `.redo()`.
  - Return whether action was possible from `canUndo` / `canRedo`.

- [ ] Register existing MCP resume parity tools in builder context.
  - `read_resume` may default to current `resumeId` when input omits `id` only if schema is explicitly browser-only; otherwise require `id` for parity.
  - `apply_resume_patch` must update current builder store immediately when patch target is active resume.
  - Metadata tools (`update_resume`, `lock_resume`, `unlock_resume`) must merge server response into builder metadata.

- [ ] Test locked resume rejects patch.
- [ ] Test patch changes draft data and marks saving.
- [ ] Test undo/redo route through existing store actions.
- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/builder-tools.test.ts
```

## Task 8: Register Application And Agent Tools

**Files:**
- Create: `apps/web/src/features/webmcp/agent-tools.ts`
- Create: `apps/web/src/features/webmcp/agent-tools.test.ts`
- Create: `apps/web/src/features/webmcp/application-tools.ts`
- Create: `apps/web/src/features/webmcp/application-tools.test.ts`
- Modify: `apps/web/src/routes/dashboard/applications/index.tsx`
- Modify: `apps/web/src/routes/agent/new.tsx`
- Modify: `apps/web/src/routes/agent/$threadId.tsx`

**Interfaces:**
- Consumes: TanStack `navigate`, optional current resume ID
- Produces: `rr.agent.start_thread`, application page-context tools, and application existing MCP parity tools

- [ ] Implement `rr.agent.start_thread`.
  - Input: `{ resumeId?: string }`.
  - Navigate to `/agent/new`.
  - Include `resumeId` search param when provided or when current page has active resume context.

- [ ] On active thread pages, include page description with `threadId`, `resumeId`, `isReadOnly`, and whether a run is active.
- [ ] Register application parity tools on applications dashboard.
  - Include list/read/tag/stats/create/update/note/timeline/delete/bulk/import/document/AI drafting and scoring tools.
  - Direct creation and update tools call oRPC, not only open UI sheets.
  - Page-context helpers such as `rr.applications.list_visible` may return current filtered rows.
- [ ] Test navigation payloads.
- [ ] Test application create/update/delete handlers call expected oRPC methods.
- [ ] Run focused tests.

```bash
pnpm --filter web test -- src/features/webmcp/agent-tools.test.ts src/features/webmcp/application-tools.test.ts
```

## Task 9: Add Security And Permission Guardrails

**Files:**
- Modify: `apps/web/src/features/webmcp/register.ts`
- Modify: `apps/web/src/features/webmcp/builder-tools.ts`
- Modify: `apps/web/src/features/webmcp/*.test.ts`

**Interfaces:**
- Consumes: route/session gating already present in authenticated routes
- Produces: consistent guard behavior for unsupported browser, unauthenticated pages, locked resumes, and aborted execution

- [ ] Ensure no tools register on unauthenticated public/home/auth routes.
- [ ] Ensure every execute handler checks `options.signal.aborted` before writes.
- [ ] Return `isError: true` for invalid inputs instead of throwing user-facing stack traces.
- [ ] Keep tool descriptions direct and non-instructional. Do not include user-controlled content in tool descriptions.
- [ ] Mark data-returning tools with `untrustedContentHint: true`.
- [ ] Require confirmation policy for destructive parity tools.
  - Initial implementation may return a structured error for `delete_resume`, `delete_application`, and `bulk_delete_applications` unless browser WebMCP caller confirmation semantics are available.
  - Non-destructive creation tools (`create_resume`, `create_application`) must be implemented, not blocked.
- [ ] Add tests for invalid input and abort signal paths.

## Task 10: Validation And Manual QA

**Files:**
- No new files expected.

**Interfaces:**
- Consumes: completed WebMCP implementation
- Produces: verified local behavior

- [ ] Run all focused WebMCP tests.

```bash
pnpm --filter web test -- src/features/webmcp
```

- [ ] Run web typecheck.

```bash
pnpm --filter web typecheck
```

- [ ] Run package boundary check.

```bash
pnpm exec turbo boundaries
```

- [ ] Run non-mutating diff check.

```bash
git diff --check
```

- [ ] Start dev Docker with watch.

```bash
docker compose -f compose.dev.yml --profile app up --build --watch
```

- [ ] Open `http://localhost:3000/dashboard/resumes`.
- [ ] In browser devtools, verify `document.modelContext` unsupported path does not break page when unavailable.
- [ ] In a browser/agent environment with WebMCP support, verify:
  - `rr.page.describe` appears on dashboard.
  - `rr.resumes.list_visible` returns current filtered rows.
  - `create_resume` creates a resume without opening the dialog.
  - `rr.resumes.open` navigates to builder.
  - `rr.builder.read_current_resume` returns current draft.
  - `read_resume` matches existing MCP response shape for same resume.
  - `rr.builder.apply_patch` updates UI and autosaves.
  - `rr.builder.undo` reverts last WebMCP edit.
  - `create_application` creates an application.
  - `update_application` changes application status.

## Task 11: Final Graph And Documentation Update

**Files:**
- Modify: `docs/agents/domain.md` only if implementation changes documented integration boundaries.
- Generated: `graphify-out/*`

**Interfaces:**
- Consumes: verified implementation
- Produces: updated repo graph and concise docs

- [ ] If implementation added new durable architecture concepts, document WebMCP as browser-side integration.
- [ ] Run Graphify update once after verification.

```bash
graphify update .
```

- [ ] Review generated graph changes separately from source changes.

```bash
git status --short
git diff --stat
```

## Rollout Notes

- Ship behind feature detection first, not behind env configuration.
- If product wants explicit opt-in later, add a user/account preference after Phase 1 proves tool value.
- Implement creation and non-destructive update parity in first release.
- Gate destructive parity tools behind explicit confirmation support or return structured unsupported errors until confirmation semantics are clear.
- Do not expose arbitrary CSS/template mutation until browser tool permission behavior is better understood.
- Keep existing MCP and WebMCP metadata separate at first. Share names/descriptions only after WebMCP tool behavior stabilizes, because server MCP operates account-wide while WebMCP operates page-context-wide.

## Open Decisions

- Whether to depend on `webmcp-types` or keep local ambient types until the draft API stabilizes.
- Whether `rr.builder.apply_patch` should require a browser confirmation for large patch sets.
- Which destructive existing MCP tools can be safely invoked from WebMCP without a visible browser confirmation prompt.
- Whether public resume pages should expose read-only WebMCP tools. Initial recommendation: no, keep first release authenticated only.
