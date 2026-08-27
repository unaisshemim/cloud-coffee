# Treecko Resume Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Treecko as a reusable, ATS-friendly gallery template matching the approved full-width teal design and applying its editable typography/page preset on selection.

**Architecture:** Register Treecko through existing schema, PDF page, semantic manifest, and gallery registries. Build dedicated React PDF renderer from shared template primitives, merge each page's main/sidebar section lists into one full-width flow, and render summary in header. Put gallery preset mutation in a pure helper so selection applies template plus styling atomically and existing resume-store snapshots restore every overwritten value through Undo.

**Tech Stack:** TypeScript, React 19, `@react-pdf/renderer` compatibility layer, Zod, Zustand/Immer resume store, Vitest, PDF.js preview pipeline.

**Spec:** `docs/superpowers/specs/2026-08-27-treecko-template-design.md`

## Global Constraints

- Template ID and display name: `treecko` / `Treecko`.
- Dedicated single-column, text-first renderer; no sidebar, cards, or picture.
- Header contains name, headline, summary, and wrapped contact links.
- Name and section headings use editable metadata primary color.
- Gallery selection preset: 36pt horizontal and vertical margins; Roboto body 400/600 at 10pt and 1.45 line height; Roboto heading 600; primary `rgba(0, 150, 137, 1)`.
- Preserve existing heading size and line height because screenshots specify only body font size and line height.
- Do not introduce date-format metadata or rewrite period strings.
- Preserve all page section IDs by rendering de-duplicated `main` entries followed by `sidebar` entries; omit summary from body because it renders in header.
- Keep static preview files at `apps/web/public/templates/pdf/treecko.pdf` and `apps/web/public/templates/jpg/treecko.jpg`.

---

### Task 1: Template Registration Contract

**Files:**
- Modify: `packages/schema/src/templates.ts`
- Modify: `packages/pdf/src/templates/index.test.ts`
- Modify: `apps/web/src/dialogs/resume/template/data.test.ts`
- Modify: `apps/web/src/dialogs/resume/template/data.ts`

**Interfaces:**
- Produces: `Template` union member `"treecko"`, `templates.treecko: TemplateMetadata`, and renderer registry expectation.

- [ ] **Step 1: Add failing registry and gallery tests**

```ts
it("registers Treecko as a renderable template page", () => {
	expect(registry).toContain('import { TreeckoPage } from "./treecko/TreeckoPage";');
	expect(registry).toContain("treecko: TreeckoPage");
});

it("publishes Treecko in the gallery", () => {
	expect(templates.treecko).toMatchObject({
		name: "Treecko",
		imageUrl: "/templates/jpg/treecko.jpg",
		sidebarPosition: "none",
	});
});
```

- [ ] **Step 2: Run focused tests and confirm failure**

Run: `pnpm --filter @reactive-resume/pdf test -- src/templates/index.test.ts && pnpm --filter web test -- src/dialogs/resume/template/data.test.ts`

Expected: FAIL because Treecko registry and gallery metadata do not exist.

- [ ] **Step 3: Register schema ID and gallery metadata**

Add `"treecko"` to `templateSchema` and add:

```ts
treecko: {
	name: "Treecko",
	description: msg`Single-column with teal headings, a compact contact grid, and generous margins; optimized for ATS-friendly technical and operations resumes.`,
	imageUrl: "/templates/jpg/treecko.jpg",
	tags: ["Single-column", "ATS friendly", "Minimal", "Technical", "Operations", "Teal accent"],
	sidebarPosition: "none",
},
```

- [ ] **Step 4: Run gallery test**

Run: `pnpm --filter web test -- src/dialogs/resume/template/data.test.ts`

Expected: PASS. PDF registry test remains red until Task 3.

- [ ] **Step 5: Commit registration contract**

```bash
git add packages/schema/src/templates.ts apps/web/src/dialogs/resume/template/data.ts apps/web/src/dialogs/resume/template/data.test.ts packages/pdf/src/templates/index.test.ts
git commit -m "feat: register Treecko template"
```

### Task 2: Atomic Gallery Preset

**Files:**
- Create: `apps/web/src/dialogs/resume/template/preset.ts`
- Create: `apps/web/src/dialogs/resume/template/preset.test.ts`
- Modify: `apps/web/src/dialogs/resume/template/gallery.tsx`

**Interfaces:**
- Produces: `applyTemplatePreset(data: ResumeData, template: Template): void`.
- Consumes: one Immer draft-compatible `ResumeData`; mutates Treecko fields in place and only template for other IDs.

- [ ] **Step 1: Write failing pure-helper tests**

```ts
it("applies the editable Treecko preset", () => {
	const data = structuredClone(defaultResumeData);
	const headingSize = data.metadata.typography.heading.fontSize;
	applyTemplatePreset(data, "treecko");
	expect(data.metadata.page).toMatchObject({ marginX: 36, marginY: 36 });
	expect(data.metadata.design.colors.primary).toBe("rgba(0, 150, 137, 1)");
	expect(data.metadata.typography.body).toMatchObject({
		fontFamily: "Roboto",
		fontWeights: ["400", "600"],
		fontSize: 10,
		lineHeight: 1.45,
	});
	expect(data.metadata.typography.heading).toMatchObject({ fontFamily: "Roboto", fontWeights: ["600"] });
	expect(data.metadata.typography.heading.fontSize).toBe(headingSize);
});

it("only changes template for templates without presets", () => {
	const data = structuredClone(defaultResumeData);
	const metadata = structuredClone(data.metadata);
	applyTemplatePreset(data, "rhyhorn");
	expect(data.metadata).toEqual({ ...metadata, template: "rhyhorn" });
});
```

- [ ] **Step 2: Run test and confirm failure**

Run: `pnpm --filter web test -- src/dialogs/resume/template/preset.test.ts`

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helper**

```ts
export function applyTemplatePreset(data: ResumeData, template: Template): void {
	data.metadata.template = template;
	if (template !== "treecko") return;
	data.metadata.page.marginX = 36;
	data.metadata.page.marginY = 36;
	data.metadata.design.colors.primary = "rgba(0, 150, 137, 1)";
	Object.assign(data.metadata.typography.body, {
		fontFamily: "Roboto",
		fontWeights: ["400", "600"],
		fontSize: 10,
		lineHeight: 1.45,
	});
	Object.assign(data.metadata.typography.heading, { fontFamily: "Roboto", fontWeights: ["600"] });
}
```

- [ ] **Step 4: Wire gallery selection through one store update**

Replace direct template assignment with `applyTemplatePreset(draft, template)`. In toast Undo, call store `undo()` so the whole previous metadata snapshot returns, rather than restoring only template. Capture `undo` from `useResumeStore` next to existing hooks.

- [ ] **Step 5: Run helper and builder history tests**

Run: `pnpm --filter web test -- src/dialogs/resume/template/preset.test.ts src/features/resume/builder/draft.test.ts`

Expected: PASS; one atomic update creates one undo entry.

- [ ] **Step 6: Commit preset behavior**

```bash
git add apps/web/src/dialogs/resume/template/preset.ts apps/web/src/dialogs/resume/template/preset.test.ts apps/web/src/dialogs/resume/template/gallery.tsx
git commit -m "feat: apply Treecko gallery preset"
```

### Task 3: Dedicated PDF Renderer and Semantic Manifest

**Files:**
- Create: `packages/pdf/src/templates/treecko/TreeckoPage.tsx`
- Create: `packages/pdf/src/templates/treecko/semantic.ts`
- Create: `packages/pdf/src/templates/treecko/TreeckoPage.test.tsx`
- Modify: `packages/pdf/src/templates/index.ts`
- Modify: `packages/pdf/src/semantic/template-manifest.ts`
- Modify: `packages/pdf/src/semantic/template-manifest.test.ts`
- Modify: semantic snapshots/fixtures only where focused tests identify exact Treecko additions.

**Interfaces:**
- Produces: `TreeckoPage: TemplatePage`, `treeckoSemanticManifest: TemplateSemanticManifest`.
- Consumes: shared `Section`, contact-item primitives, semantic node helpers, `createBaseTemplateStyles`, and resume metadata.

- [ ] **Step 1: Write failing renderer behavior tests**

Extract and export a pure section helper from Treecko renderer:

```ts
export function getTreeckoSectionIds(main: string[], sidebar: string[]): string[] {
	return [...new Set([...main, ...sidebar])].filter((section) => section !== "summary");
}
```

Test:

```ts
it("merges main then sidebar without duplicates or body summary", () => {
	expect(getTreeckoSectionIds(["summary", "experience", "skills"], ["skills", "education"]))
		.toEqual(["experience", "skills", "education"]);
});
```

Also extend manifest expectations with Treecko special summary and contact content parts.

- [ ] **Step 2: Run focused PDF tests and confirm failure**

Run: `pnpm --filter @reactive-resume/pdf test -- src/templates/treecko/TreeckoPage.test.tsx src/templates/index.test.ts src/semantic/template-manifest.test.ts`

Expected: FAIL because Treecko renderer and manifest are absent.

- [ ] **Step 3: Implement Treecko header**

Use shared semantic primitives to render name, headline, `summary.content`, and contacts. Keep picture absent. Contact list uses `flexDirection: row`, `flexWrap: wrap`, stable two-column basis where space permits, and icons controlled by `metadata.page.hideIcons`.

- [ ] **Step 4: Implement full-width section flow and styles**

For each page, filter `getTreeckoSectionIds(page.main, page.sidebar)` through `filterSections`, then `useRenderedSectionIds`; render all with `<Section placement="main" />`. Styles use metadata colors, 36pt preset-derived margins, primary name/section headings, body-driven gaps, no heading border, and existing RTL helpers.

- [ ] **Step 5: Register renderer and manifest**

Add Treecko imports/map entries in `packages/pdf/src/templates/index.ts` and `packages/pdf/src/semantic/template-manifest.ts`. Manifest regions: header and main; special summary `{ region: "header", placement: "main", source: "always" }`; include `itemHeaderRowPart` and contact-item content binding.

- [ ] **Step 6: Run focused PDF tests**

Run: `pnpm --filter @reactive-resume/pdf test -- src/templates/treecko/TreeckoPage.test.tsx src/templates/index.test.ts src/semantic/template-manifest.test.ts src/semantic/all-templates-presentation.test.ts src/semantic/binding-inventory.test.ts`

Expected: PASS after adding exact Treecko expectations/snapshots reported by Vitest.

- [ ] **Step 7: Commit renderer**

```bash
git add packages/pdf/src/templates/treecko packages/pdf/src/templates/index.ts packages/pdf/src/semantic/template-manifest.ts packages/pdf/src/semantic/template-manifest.test.ts packages/pdf/src/semantic
git commit -m "feat: render Treecko resume template"
```

### Task 4: Static Gallery Assets and Visual QA

**Files:**
- Create: `apps/web/public/templates/pdf/treecko.pdf`
- Create: `apps/web/public/templates/jpg/treecko.jpg`

**Interfaces:**
- Produces: gallery thumbnail and downloadable reference preview at existing static paths.
- Consumes: sample resume data rendered with `metadata.template = "treecko"` and Treecko preset.

- [ ] **Step 1: Identify existing preview generation command**

Run: `rg -n "templates/(jpg|pdf)|render.*template|generate.*preview" tooling packages apps package.json -g '*.ts' -g '*.tsx' -g '*.json'`

Expected: existing script or documented renderer path that generates template PDF files.

- [ ] **Step 2: Generate Treecko PDF from real renderer**

Use repository preview generator with sample data after applying Treecko preset. Do not hand-author preview artwork.

- [ ] **Step 3: Rasterize first page to JPG**

Use existing PDF preview toolchain at same dimensions/quality as sibling gallery images.

- [ ] **Step 4: Verify assets structurally**

Run: `file apps/web/public/templates/pdf/treecko.pdf apps/web/public/templates/jpg/treecko.jpg`

Expected: valid PDF and JPEG; names match gallery URL exactly.

- [ ] **Step 5: Verify assets visually**

Render PDF pages and inspect first page plus any overflow page. Confirm nonblank output, teal name/headings, compact wrapped contacts, no clipping/overlap, all sections present, and screenshot-like spacing.

- [ ] **Step 6: Commit preview assets**

```bash
git add apps/web/public/templates/pdf/treecko.pdf apps/web/public/templates/jpg/treecko.jpg
git commit -m "feat: add Treecko template previews"
```

### Task 5: End-to-End Verification

**Files:**
- Modify: only files requiring formatting or exact test-fixture updates discovered during verification.

**Interfaces:**
- Consumes: complete Treecko registration, preset, renderer, manifest, and assets.
- Produces: verified feature and refreshed repository graph.

- [ ] **Step 1: Run focused tests**

Run: `pnpm --filter web test -- src/dialogs/resume/template/data.test.ts src/dialogs/resume/template/preset.test.ts src/features/resume/builder/draft.test.ts`

Run: `pnpm --filter @reactive-resume/pdf test -- src/templates/index.test.ts src/templates/treecko/TreeckoPage.test.tsx src/semantic/template-manifest.test.ts src/semantic/all-templates-presentation.test.ts src/semantic/binding-inventory.test.ts`

Expected: PASS.

- [ ] **Step 2: Run package typechecks**

Run: `pnpm --filter web typecheck && pnpm --filter @reactive-resume/pdf typecheck && pnpm --filter @reactive-resume/schema typecheck`

Expected: PASS.

- [ ] **Step 3: Run non-mutating checks on changed source**

Run: `pnpm exec biome check packages/schema/src/templates.ts packages/pdf/src/templates/treecko packages/pdf/src/templates/index.ts packages/pdf/src/semantic/template-manifest.ts apps/web/src/dialogs/resume/template`

Expected: PASS.

- [ ] **Step 4: Verify package boundaries**

Run: `pnpm exec turbo boundaries`

Expected: PASS.

- [ ] **Step 5: Verify live gallery and builder**

Open `http://localhost:3000/builder/01a04338-0479-72b3-9513-67e1800d8151`, select Treecko, verify preset controls and preview, then use Undo and confirm prior template plus margins, font, and primary color return.

- [ ] **Step 6: Refresh Graphify**

Run: `graphify update .`

Expected: graph updates successfully after all source verification.

- [ ] **Step 7: Review final diff**

Run: `git diff --check && git status --short && git diff --stat`

Expected: no whitespace errors; unrelated pre-existing worktree changes remain untouched.

- [ ] **Step 8: Commit verification fixes if any**

If verification changed Treecko-owned files, stage their explicit paths shown by `git status --short` and commit them with `git commit -m "test: verify Treecko template"`. Skip this step when verification makes no edits.
