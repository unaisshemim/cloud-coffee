# Treecko Resume Template Design

## Summary

Add `treecko` as a first-class cloudcoffee template. Treecko is a full-width, text-first, ATS-friendly layout modeled on the supplied references: prominent primary-color identity, summary in the header, compact contact grid, primary-color section headings, and dense single-column entries without cards or a sidebar.

Treecko will be selectable from the existing template gallery and rendered by the shared PDF pipeline. It will support existing resume data, custom colors, typography, page controls, semantic stylesheets, RTL rendering, and automatic pagination.

## Goals

- Add a reusable template-gallery option, not a one-off stylesheet for one resume.
- Match the reference hierarchy: large colored name, bold headline, short summary, wrapped contact rows, colored section headings, and compact entries.
- Keep content machine-readable and compatible with the existing ATS and semantic rendering systems.
- Reuse shared template primitives and section renderers.
- Preserve user-controlled primary color, typography, page spacing, visibility settings, and layout order.
- Ship real JPG and PDF gallery previews.

## Non-Goals

- Do not change existing templates.
- Do not add a general template-authoring UI.
- Do not hard-code the supplied resume content into the renderer.
- Do not hard-code teal inside the renderer. Gallery selection applies teal as an editable initial preset, and rendering continues using `metadata.design.colors.primary`.
- Do not add cards, sidebars, decorative backgrounds, or a required profile picture.
- Do not add a global date-format setting or rewrite free-text period values.

## Selected Approach

Create a dedicated Treecko renderer that uses shared PDF primitives and section components. This keeps Treecko independent from Rhyhorn while reusing established infrastructure for sections, contacts, RTL direction, semantic node resolution, pagination, custom styles, and ATS-safe text.

Rejected alternatives:

- Parameterizing Rhyhorn would couple two visual contracts and increase regression risk.
- Cloning Rhyhorn wholesale would duplicate renderer logic and drift from shared improvements.

## Visual Design

### Header

- Full-width header with no card or background band.
- Name uses the resume primary color at approximately twice the normal section-heading size.
- Headline appears immediately below the name in a bold sans-serif treatment.
- Summary renders below the headline without its normal section heading.
- Contact items render below the summary in a wrapping grid. Email, phone, location, website, and custom fields use existing structured contact primitives and icons.
- Picture data remains valid but Treecko does not render it. This preserves the text-first reference design and avoids layout instability.

### Body

- One full-width sequential content region.
- Section order always follows the page's `main` list and then its `sidebar` list, with duplicates and `summary` removed. This prevents content loss when switching from a sidebar template regardless of the page's current `fullWidth` flag.
- Section headings use the primary color, bold sans-serif type, and no divider line.
- Items use compact vertical spacing.
- Existing shared section components retain right-aligned location and period fields, lists, links, skill keywords, levels, and custom-section behavior.
- No nested cards, borders, shaded bands, or decorative page chrome.

### Typography And Color

- Renderer consumes existing body and heading typography settings.
- Header name and headline derive scale and weight from heading settings.
- Primary color drives name, section headings, contact icons, and skill level accents.
- Foreground and background continue using existing resume design colors.
- Gallery preview data uses a teal primary close to the supplied reference.

### Treecko Preset

Selecting Treecko from the gallery applies a one-time, editable design preset through existing resume metadata:

- Horizontal page margin: `36pt`.
- Vertical page margin: `36pt`.
- Body font family: `Roboto`.
- Body font weights: `400` and `600`.
- Body font size: `10pt`.
- Body line height: `1.45`.
- Heading font family: `Roboto`.
- Heading font weight: `600`.
- Primary color: `rgba(0, 150, 137, 1)`.

Heading font size and line height remain user-controlled because the reference's `10pt` and `1.45` settings describe summaries and bullets. All preset values remain editable through the existing Page, Typography, and Design sections.

## Rendering Architecture

Add `packages/pdf/src/templates/treecko/TreeckoPage.tsx` with:

- `TreeckoPage` implementing the `TemplatePage` contract.
- A header that renders identity, summary, and contacts through semantic shared primitives.
- A single body region that renders all configured sections without duplicate summary output.
- A memoized style factory built from `createBaseTemplateStyles`, `getTemplateMetrics`, color roles, and RTL helpers.
- Semantic-style-compatible slots for page, header, contact list/items, section headings, items, icons, and level indicators.

Add `packages/pdf/src/templates/treecko/semantic.ts` with:

- Header, main, and sidebar region declarations.
- `specialSummary` bound to the header.
- Exact parts for the header identity/summary group and contact group.
- Existing item-header row bindings used by shared sections.

The semantic manifest will be registered in `packages/pdf/src/semantic/template-manifest.ts` and validated by existing all-template tests.

## Registration And Gallery

- Add `treecko` to `packages/schema/src/templates.ts`.
- Register `TreeckoPage` in `packages/pdf/src/templates/index.ts`.
- Add Treecko metadata to `apps/web/src/dialogs/resume/template/data.ts`.
- Extend gallery selection metadata with an optional Treecko preset. Selecting Treecko applies the preset atomically with the template change; the existing Undo action restores the previous template and every overwritten metadata value.
- Gallery metadata:
  - Name: `Treecko`
  - Sidebar position: `none`
  - Tags: `Single-column`, `ATS friendly`, `Text-first`, `GTM`, `Engineering`, `Compact`, `Primary accent`
  - Description: full-width, compact, text-first layout for engineering, GTM, operations, and startup roles.

## Preview Assets

Generate and commit:

- `apps/web/public/templates/pdf/treecko.pdf`
- `apps/web/public/templates/jpg/treecko.jpg`

The preview fixture will use representative sample resume data, no picture, a teal primary color, a full-width page layout, and enough sections to demonstrate automatic pagination. The JPG will be rendered from the committed PDF so gallery image and PDF output match.

## Testing

- Update template registry tests to require Treecko registration.
- Update gallery metadata tests to include the new schema ID and verify the preview path.
- Test that selecting Treecko applies `36pt` margins, Roboto body typography, `10pt` body text, `1.45` body line height, and the teal primary color.
- Test that Undo restores the prior template, margins, typography, and primary color.
- Run semantic manifest validation for Treecko through existing parameterized tests.
- Update all-template semantic presentation snapshots only for the newly added template entry.
- Run all-template smoke, binding, wrapper, RTL, and legacy-parity checks that derive cases from `templateSchema.options`.
- Add a focused Treecko render test covering:
  - Summary appears once in the header.
  - All configured main/sidebar sections render once.
  - Hidden sections stay hidden.
  - Header contacts render from standard fields and custom fields.
  - Picture is not rendered.
- Run package tests, typecheck, and boundary checks.

## Visual Verification

1. Render Treecko with the repository sample resume and with the user's tailored AI GTM resume.
2. Compare desktop screenshots and generated PDF pages with the supplied references.
3. Verify no clipping, overlap, blank pages, broken icons, or orphaned headings.
4. Confirm long contact values wrap cleanly and RTL output remains coherent.
5. Confirm the gallery card loads the committed JPG and selecting Treecko updates the builder preview.
6. Confirm the generated PDF remains machine-readable and the builder ATS check has no template-caused errors.

## Rollout And Compatibility

Adding the enum value is backward-compatible for existing resume documents. Existing templates and data remain unchanged. Treecko consumes the same universal `ResumeData` shape and shared rendering contracts, so no migration is required.

If a Treecko resume is opened by a build that predates this template, existing schema validation may reject the unknown value. This is consistent with every newly introduced template and requires no separate compatibility layer.
