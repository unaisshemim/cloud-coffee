# Treecko-Only Template Implementation Plan

**Goal:** Remove every resume template except Treecko from runtime code, schemas, gallery metadata, static assets, active documentation, and tests.

**Compatibility:** Existing data containing removed template IDs will no longer validate as those IDs. Legacy v4 imports normalize their old template choice to Treecko. Current default and sample resumes use Treecko.

## Tasks

1. Change schema/default/sample/gallery tests to require only Treecko, confirm red, then update registries and preset logic.
2. Delete non-Treecko PDF renderers/manifests/tests and reduce PDF/semantic registries and contract fixtures to Treecko.
3. Remove non-Treecko static JPG/PDF assets and update active web, server, import, DOCX, MCP, ATS, and e2e references.
4. Run repository search, focused tests, typechecks, Biome, boundaries, and full tests; repair assumptions that require removed IDs.
5. Verify live gallery exposes only Treecko and current builder still renders/saves, then run `graphify update .`.
