# WebMCP Career Knowledge Base Design

## Goal

Turn Profile into the canonical, approved career knowledge base for each user. ChatGPT or Codex can extract structured career facts from an uploaded resume or conversation, preview an organized merge, obtain explicit user approval, and save the result through WebMCP. A job description can then produce a new, private, job-specific resume draft from the complete profile.

This design extends the existing Application Profile Settings design. Existing account and job-application fields remain supported.

## Scope

- Upgrade `ApplicationProfile` from version 1 to version 2 without losing existing data.
- Add deterministic profile merge preview and confirmed application APIs.
- Register profile-specific tools only while the authenticated Profile page is mounted.
- Generate a new resume draft from approved profile data and a job description.
- Remove the remote MCP server, package, routes, metadata, tests, dependencies, and documentation references.
- Keep existing browser WebMCP resume, application, and builder tools.

No raw conversations, uploaded source files, source excerpts, confidence scores, or provenance records are stored. Pending proposals are not persisted. ChatGPT or Codex owns the approval conversation.

## Domain Model

`ApplicationProfile` version 2 retains all version 1 groups and adds:

- `careerSummary`: reusable background and positioning text.
- `achievements`: reusable accomplishments with stable IDs, title, description, optional metrics, skills, and related experience or project IDs.
- `hackathons`: dated entries with stable IDs, event, project, placement, URL, description, and highlights.
- `publications`: entries with stable IDs, title, publisher, publication date, URL, and description.
- `customFacts`: stable-ID entries with category, label, and value for career facts that do not fit a fixed section.
- `highlights` on experience and project entries for granular, job-selectable accomplishments.

All new collections use stable generated IDs. Dates remain normalized strings consistent with the existing profile model. Profile descriptions remain plain text and are sanitized when converted into resume rich text.

### Version migration

Persisted version 1 documents remain readable. A pure migration function converts v1 to v2 by retaining every existing field and adding empty defaults for new fields. API reads always return version 2. Writes accept only normalized version 2 data after rollout. No JSONB data backfill is required because the document is upgraded at the application boundary and saved as v2 on the next mutation.

## Persistence and Concurrency

PostgreSQL `application_profile.data` remains the canonical JSONB document. Add a non-negative `revision` integer column, initialized for existing rows and incremented by every successful manual or agent mutation. The schema change uses a normal Drizzle migration.

Profile read responses expose:

- `profile`: normalized version 2 data.
- `revision`: current integer revision, with `0` representing a profile that has not been persisted yet.

Confirmed merge application uses optimistic concurrency. It updates only when the supplied base revision still matches, increments the revision in the same statement, and returns the new value. First-write insertion handles races through the same transaction and unique user key. A mismatch returns a conflict and writes nothing, requiring a fresh read and preview. The existing manual Profile editor also uses revisions so agent and human edits cannot silently overwrite each other.

## WebMCP Contract

The Profile page registers four tools through the existing `document.modelContext` integration.

### `get_career_profile`

Returns the complete approved version 2 profile and current revision. It performs no mutation.

### `preview_profile_merge`

Accepts a strict partial version 2 profile candidate extracted by ChatGPT or Codex. The tool:

1. Loads current profile and revision.
2. Validates supported fields and payload limits.
3. Normalizes whitespace, dates, URLs, IDs, and collection values.
4. Deduplicates skills, languages, links, and entity collections.
5. Merges by stable ID when supplied and by conservative identity keys otherwise.
6. Produces validated JSON Patch operations plus a human-readable change summary.
7. Returns base revision, operations, and resulting preview profile without saving.

Ambiguous entries are additive rather than destructive. Empty incoming strings do not erase populated values. Conflicting populated scalar values appear as explicit replacements in the preview.

### `apply_profile_merge`

Accepts the preview operations, base revision, and `confirm: true`. The tool rejects unknown paths, malformed operations, missing confirmation, and stale revisions. The service applies all operations atomically, validates the complete resulting version 2 profile, persists it, and returns updated profile plus revision.

### `create_targeted_resume`

Accepts:

- required `jobDescription` text;
- optional target role and company;
- optional base resume ID used only for visual configuration;
- optional draft name and template.

The tool always creates a new draft. It never overwrites or locks an existing resume.

## Targeted Resume Generation

Generation runs server-side using the user's configured AI provider.

1. Validate job-description length and optional base resume ownership.
2. Load the current version 2 profile.
3. Build a resume-safe candidate context. Exclude salary preferences, screening answers, equal-opportunity data, work-authorization details, and saved application answers.
4. Ask the model for a structured content plan referencing profile entry IDs.
5. Reject plans containing unknown IDs or unsupported sections.
6. Allow relevance-focused rewriting, but forbid new employers, roles, dates, credentials, education, metrics, or other factual claims absent from the approved profile.
7. Deterministically assemble and validate complete `ResumeData` from selected entries and rewritten presentation text.
8. If a base resume is supplied, copy only its template, layout, typography, page, theme, and other design settings. Do not use its career content as unapproved knowledge.
9. Create an unlocked, private resume tagged `tailored`.
10. Return draft ID, name, and builder URL.

If AI resolution, structured output, validation, or persistence fails, no resume is created. ChatGPT or Codex may read a job URL itself, but WebMCP receives extracted job-description text; the server does not fetch arbitrary URLs.

## Remote MCP Removal

Remove remote MCP surfaces completely:

- `/mcp` and `/mcp/*` server routes.
- `apps/server/src/mcp` handlers, authentication, and server construction.
- `/.well-known/mcp/server-card.json` and related OpenAPI metadata.
- `packages/mcp` and its workspace dependencies.
- Remote MCP tests, static SEO references, documentation links, and package-boundary declarations.
- `@modelcontextprotocol/sdk` dependencies left unused after removal.

WebMCP code under `apps/web/src/features/webmcp` remains and becomes the only model-context integration.

## Security and Privacy

- Profile tools register only for authenticated users on the Profile page.
- All API operations derive user identity from protected server context.
- Input schemas are strict and size-limited.
- Merge paths use an explicit allowlist.
- Rich text is sanitized before persistence and rendering.
- Apply requires `confirm: true` and matching revision.
- Generation excludes sensitive application-profile groups by default.
- Base resumes must belong to the authenticated user.
- AI output is untrusted and must pass schema and reference validation.

## Errors

- Validation errors identify invalid fields without persisting partial data.
- Revision conflicts instruct the caller to read and preview again.
- Missing AI configuration returns the existing provider-setup error.
- Empty profiles or insufficient career content return an actionable error rather than fabricating a resume.
- Generation failures leave no draft or application mutation.

## Verification

- Schema tests cover complete v2 defaults, malformed nested values, and lossless v1 migration.
- Merge tests cover normalization, conservative deduplication, stable IDs, empty-value behavior, patch allowlisting, and deterministic output.
- Service tests cover authenticated isolation, atomic application, revision conflicts, and manual-editor concurrency.
- WebMCP tests cover registration lifecycle, read, preview without writes, explicit confirmation, stale conflicts, and error results.
- Generation tests cover sensitive-field exclusion, valid ID selection, hallucinated-ID rejection, base-design-only copying, valid `ResumeData`, and new private draft creation.
- Server tests prove `/mcp`, `/mcp/*`, and the server-card endpoint no longer exist.
- Run focused tests and typechecks, package-boundary checks, full build, and `graphify update .` after implementation.

## Success Criteria

- ChatGPT or Codex can turn uploaded-resume content and conversational facts into a clear profile proposal.
- No extracted fact is stored before explicit user confirmation.
- Approved facts are organized and deduplicated in one canonical profile.
- A job description produces a new, truthful, schema-valid resume draft using the full approved career profile.
- Remote MCP has no runtime route, package, dependency, or advertised surface.
- Existing profile data, resume workflows, applications, and WebMCP integrations continue to work.
