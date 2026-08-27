# Wobo Resume Builder Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace desktop builder chrome with screenshot-matched Wobo Content, Design, and Analysis workspaces and block editing below 1024px.

**Architecture:** Keep route-level resume store, WebMCP registration, preview outlet, autosave, export dialog, and existing section forms. Add focused presentation components under builder `-components`, with local mode/focused-section state in desktop shell and a standalone small-screen notice selected by route shell.

**Tech Stack:** React 19, TanStack Router, Zustand resume store, Tailwind CSS, Phosphor icons, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-08-27-wobo-builder-layout-design.md`

## Global Constraints

- Desktop starts at 1024px; mobile and tablet widths render no editor.
- Analysis values are static presentation data, not computed ATS claims.
- Treecko remains sole template.
- Preserve route WebMCP tools, autosave, PDF preview, and export behavior.
- Do not alter resume schema, API, database, or PDF template.

---

### Task 1: Responsive Shell and Workspace Header

**Files:**
- Create: `apps/web/src/routes/builder/$resumeId/-components/small-screen-notice.tsx`
- Create: `apps/web/src/routes/builder/$resumeId/-components/wobo-builder-header.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/-components/desktop-builder-shell.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/route.tsx`
- Test: `apps/web/src/routes/builder/$resumeId/-components/desktop-builder-shell.test.tsx`
- Test: `apps/web/src/routes/builder/$resumeId/route.test.tsx`

**Interfaces:**
- Produces: `type BuilderMode = "content" | "design" | "analysis"`.
- Produces: `WoboBuilderHeader({ mode, onModeChange })`.
- Produces: `SmallScreenNotice()`.

- [ ] Write failing tests asserting three selected-state tabs, requested mobile message, and absence of editor shell on small screens.
- [ ] Run focused tests and confirm failures identify missing Wobo components.
- [ ] Implement warm-neutral fixed header with score badge, mode tabs, existing save status, export dialog, AI badge, and theme control.
- [ ] Replace resizable desktop shell with stable two-column workspace and local mode state; route small screens to `SmallScreenNotice`.
- [ ] Run focused tests and confirm pass.

### Task 2: Content List and Focused Existing Editors

**Files:**
- Create: `apps/web/src/routes/builder/$resumeId/-components/wobo-content-panel.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/-sidebar/left/index.tsx`
- Test: `apps/web/src/routes/builder/$resumeId/-components/wobo-content-panel.test.tsx`

**Interfaces:**
- Consumes: `LeftSidebarSection`, `leftSidebarSections`, `getSectionIcon`, and existing resume selectors.
- Produces: `BuilderSectionEditor({ section })`, exported from left sidebar module.
- Produces: `WoboContentPanel({ focusedSection, onFocusedSectionChange })`.

- [ ] Write failing tests for compact section rows, item/status summaries, row selection, focused editor title, and back navigation.
- [ ] Run focused test and confirm failure.
- [ ] Export existing section dispatch as `BuilderSectionEditor` without changing form behavior.
- [ ] Implement screenshot-style rows with fixed dimensions, accessible buttons, status/count pills, AI icon, overflow affordance, and dashed Add Section command.
- [ ] Render selected existing editor in focused layout with back navigation.
- [ ] Run focused test and confirm pass.

### Task 3: Design and Static Analysis Workspaces

**Files:**
- Create: `apps/web/src/routes/builder/$resumeId/-components/wobo-design-panel.tsx`
- Create: `apps/web/src/routes/builder/$resumeId/-components/wobo-analysis-panel.tsx`
- Test: `apps/web/src/routes/builder/$resumeId/-components/wobo-design-panel.test.tsx`
- Test: `apps/web/src/routes/builder/$resumeId/-components/wobo-analysis-panel.test.tsx`

**Interfaces:**
- Produces: `WoboDesignPanel()` using `useCurrentResume` and `useUpdateResumeData`.
- Produces: `WoboAnalysisPanel({ onOpenSection })`.

- [ ] Write failing design tests for page size, margins, font, font size, line height, accent swatches, and date-format labels.
- [ ] Write failing analysis tests for score 86, five fixed categories, filters, suggestion cards, and Open in editor callback.
- [ ] Implement design controls mapped directly to existing `metadata.page`, `metadata.typography.body`, and `metadata.design.colors.primary` fields.
- [ ] Implement static analysis presentation with textual progress values and section callback.
- [ ] Run focused tests and confirm pass.

### Task 4: Integration and Visual Verification

**Files:**
- Modify: `apps/web/src/routes/builder/$resumeId/-components/desktop-builder-shell.tsx`
- Modify: affected tests only when integration exposes legitimate assumptions.

**Interfaces:**
- Desktop shell switches left workspace by `BuilderMode`.
- Preview outlet remains mounted for Content and Design.
- Analysis owns full workspace body and uses `onOpenSection` to switch to Content with focused section.

- [ ] Integrate Content, Design, and Analysis panels in desktop shell.
- [ ] Run focused builder tests.
- [ ] Run `pnpm --filter web typecheck` and `pnpm exec turbo boundaries`.
- [ ] Run `git diff --check`.
- [ ] Run `graphify update .` after verification.
- [ ] Use Codex browser at desktop viewport to verify header, each mode, preview framing, scrolling, and no overlap.
- [ ] Use Codex browser below 1024px to verify exact small-screen message and no builder controls.
- [ ] Check browser console for errors and confirm WebMCP builder tools remain available.
