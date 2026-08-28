# Application Profile Settings Design

## Goal

Replace fragmented settings pages with two clear destinations:

- **Account** owns account identity, appearance, language, AI provider setup, data export, and deletion.
- **Profile** owns reusable job-application information in a Wobo-style section workspace.

## Information Architecture

Dashboard settings navigation contains Profile, Authentication, and Account. Preferences and Integrations are removed as standalone destinations. Their legacy URLs redirect to Account.

Profile uses a fixed internal navigation rail and one active editor pane. Sections are:

- Job Preferences
- Personal Info
- Documents
- Skills & Languages
- Work Experience
- Education
- Projects & Volunteer
- Certifications & Awards
- Work Authorization
- Screening
- Equal Opportunity

## Persistence

Create one `application_profile` row per user. Store a versioned, Zod-validated JSON document in `data`, keyed by `user_id` with cascade deletion. A protected oRPC router exposes `get` and `update`; `get` creates no row and returns schema defaults when absent.

Profile data is account-wide and independent from resume documents. Documents section reads existing resume records and links to builders. Resume-derived fields are not silently copied into application profile.

## Account Consolidation

Move current Profile fields (name, username, email) and Preferences controls (theme, language) into Account. Keep current account export/delete controls. Move AI provider configuration UI from standalone Integrations page into Account so imports and AI review retain a configuration destination.

## Visual Contract

- Warm off-white page background and white bordered workspace.
- Internal navigation rail around 300px wide.
- Compact 14-16px body type; 24-28px section titles.
- Violet active state, muted gray icons, green completion status.
- Two-column fields on desktop; no nested decorative cards.
- Existing dashboard mobile behavior remains unchanged.

## Validation

- Protected APIs isolate data by authenticated user.
- Update payload must satisfy full application profile schema.
- Demographic fields accept explicit enum-like strings or empty values and remain private.
- Focused API tests cover defaults, persistence, and user isolation.
- Web tests cover section navigation and Account consolidation.
