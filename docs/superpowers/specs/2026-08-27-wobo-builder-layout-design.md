# Wobo Resume Builder Layout Design

## Goal

Replace the desktop resume builder presentation with the Wobo-style workspace shown in the approved references while preserving existing resume editing, autosave, export, dialogs, and PDF preview behavior.

The work is visual and interaction-focused. The Analysis view intentionally uses static presentation data and does not introduce scoring or ATS business logic.

## Scope

### Desktop

- Fixed top workspace header with score badge, Content/Design/Analysis tabs, save status, AI-credit badge, PDF export, and theme control.
- Two-column workspace below the header:
  - Left workspace: approximately 42% width, scrollable, task-specific content.
  - Right workspace: approximately 58% width, persistent resume preview.
- Warm off-white application background, white bordered controls, restrained violet interaction color, green quality status color, and dark primary actions.
- Existing Treecko resume preview remains mounted while switching workspace tabs.

### Mobile and Small Tablets

Do not mount the editor. Show a centered blocking message:

```
Resume Builder | Dashboard - cloudcoffee

Screen Size Too Small

The resume builder requires a larger screen for the best experience. Please use a laptop or desktop to access all features.
```

Desktop builder begins at 1024px. Mobile and tablet widths below 1024px show the blocking notice.

## Architecture

Replace the current desktop three-panel resizable shell with a dedicated Wobo builder shell. Keep the current route, resume store, preview outlet, export dialog, autosave state, and section dialogs.

New shell state is local presentation state:

- `mode`: `content | design | analysis`
- `focusedSection`: selected editable section or `null`

No resume data shape, API contract, or database change is required.

### Component Boundaries

- `DesktopBuilderShell`: owns mode and focused-section presentation state and arranges header/workspace/preview.
- `BuilderHeader`: renders workspace navigation and existing save/export actions using the new visual treatment.
- `BuilderContentPanel`: renders compact section rows and opens focused editors.
- `BuilderFocusedSection`: provides back navigation and hosts existing section builder components.
- `BuilderDesignPanel`: presents layout, typography, line-height, accent, and date controls using existing resume metadata update hooks.
- `BuilderAnalysisPanel`: renders static score breakdown, filters, and suggestion cards.
- `SmallScreenNotice`: renders the requested mobile blocking message.

Existing section forms remain the source of truth. New list rows summarize resume state but do not duplicate editing logic.

## Content Mode

Default view shows compact section rows inspired by the reference:

- Drag affordance and section icon.
- Section title.
- Item count where meaningful.
- Status badge (`All good`, `Optional · empty`, or informational count).
- AI action icon where shown in the reference; visual-only until existing AI behavior can be connected safely.
- Overflow menu using existing section actions when available.
- Dashed `Add Section` command at the bottom.

Selecting a row replaces the list with the corresponding existing editor. Focused editor includes a back icon, title, optional subtitle, and existing form content. Skills use the existing category/item editor rather than a new data model.

## Design Mode

Design mode groups controls into two unframed sections:

### Layout

- Treecko template preview shown as the sole selected template.
- Page size control.
- Top/bottom margin slider.
- Side margin slider.
- Reset action.

### Font and Format Settings

- Font family control.
- Font size control.
- Line-height slider.
- Eight accent-color swatches.
- Date-format control.
- Reset action.

Controls write to existing resume metadata. Unsupported reference-only values are not invented; options map to available schema values.

## Analysis Mode

Analysis mode is static visual presentation:

- Score ring showing 86/100.
- `+2 pts recoverable` summary.
- Five score-category rows with fixed values and colored progress bars.
- Filter pills.
- Suggestion cards with category, title, short instruction, point value, and `Open in editor` action.

`Open in editor` navigates to Content mode and focuses the referenced section where possible. Score values do not claim to represent computed ATS results.

## Preview

Resume preview remains mounted in the right workspace for Content and Design modes. Analysis replaces the right preview area with its dashboard content to match the supplied screenshot.

The preview surface uses the existing route outlet and PDF.js implementation. Page navigation and zoom behavior remain unchanged. New shell styles may constrain its container but must not modify resume PDF rendering.

## Visual System

- Application background: warm neutral off-white.
- Panels and controls: white with low-contrast gray border.
- Primary interaction: violet.
- Success and score: teal/green.
- Primary export action: near-black navy.
- Corner radius: 8px or less for rows and controls; pills reserved for statuses and segmented navigation.
- Typography: existing application font stack to avoid adding font-loading cost.
- No gradients, decorative blobs, nested cards, or marketing composition.

## Error and Locked States

- Existing save status remains visible in the header.
- Locked resumes keep existing edit-disable behavior and unlock affordance.
- Missing preview remains handled by current preview route.
- Static Analysis never blocks editing or export.

## Accessibility

- Header mode controls use tab semantics and expose selected state.
- Every icon-only action has an accessible name and tooltip where meaning is not universal.
- Focused editor back control is keyboard accessible.
- Progress indicators expose textual values.
- Small-screen notice uses a heading hierarchy and readable centered text.

## Verification

- Unit tests for desktop mode switching.
- Unit test that the small-screen notice replaces editor UI below 1024px.
- Unit tests for section-row summaries and focused editor back navigation.
- Unit tests for design control updates where existing coverage does not already apply.
- Typecheck for `apps/web`.
- Focused web tests, then repository boundary check.
- Browser screenshots at representative desktop and mobile viewports.
- Browser checks for overlap, clipping, scroll behavior, section navigation, mode navigation, and export trigger presence.
- Existing WebMCP builder tools must remain registered and usable because route-level wiring is unchanged.

## Non-Goals

- Real resume score computation.
- New AI credit accounting.
- New ATS or recommendation backend.
- Resume schema changes.
- PDF template changes.
- Mobile editing.
