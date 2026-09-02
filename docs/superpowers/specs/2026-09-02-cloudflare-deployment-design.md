# Cloudflare Deployment Design

**Status:** Approved architecture

**Goal:** Deploy cloudcoffee with its Vite web application on Cloudflare Pages, its Hono HTTP application on Cloudflare Workers, its uploads in R2, and its existing PostgreSQL database reached through Hyperdrive.

## Scope

This design covers production and preview deployment topology, runtime adapters, data and asset flow, migrations, secrets, observability, rollout, and rollback. It preserves existing application URLs and PostgreSQL schema.

Out of scope:

- Migrating PostgreSQL to D1.
- Replacing oRPC, Better Auth, Drizzle, TanStack Router, or Hono.
- Rewriting resume templates or document formats.
- Moving AI inference to Workers AI.

## Current Architecture

The repository currently builds a Vite SPA in `apps/web` and a Node.js Hono process in `apps/server`. That Node process:

- mounts oRPC, auth, OAuth, OpenAPI, MCP metadata, upload, health, and PDF endpoints;
- reads and injects metadata into the web build's `index.html`;
- serves static web files and stored uploads;
- opens a PostgreSQL pool and runs migrations during startup;
- chooses local filesystem or S3-compatible storage;
- uses Node-specific facilities including `@hono/node-server`, filesystem APIs, `sharp`, SMTP, and server-side React PDF rendering.

Those responsibilities must be separated because Pages owns immutable frontend assets while Workers has no persistent local filesystem or long-lived Node server process.

## Recommended Topology

```text
Browser / crawler
       |
       v
app.example.com (Cloudflare Pages)
  |-- static assets and SPA shell --------------------> Pages assets
  |-- /api/*, /uploads/*, /.well-known/*, schema.json
  |        |
  |        v
  |   Pages Function gateway -- service binding -----> Hono API Worker
  |                                                     |-- Hyperdrive --> PostgreSQL
  |                                                     |-- R2 binding --> uploads
  |                                                     |-- HTTP email provider
  |                                                     `-- optional Browser Rendering/PDF service
  |
  `-- /:username/:slug --> Pages metadata Function
                              |-- Pages asset binding for index.html
                              `-- API Worker service binding for safe social metadata
```

Pages remains the public origin. A minimal Pages Function gateway forwards server-owned paths to a private Worker through a service binding. This preserves same-origin cookies, existing relative URLs, OAuth callback URLs, and browser security assumptions without public CORS configuration.

The API Worker is independently deployable but does not need a public custom domain. Preview and production Pages environments bind to matching preview and production Worker services.

## Alternatives Considered

### Public API subdomain

Pages would serve `app.example.com` and Worker would serve `api.example.com`. Infrastructure is simpler, but the web client, Better Auth cookies, trusted origins, OAuth redirects, CSP, uploads, and CORS all need cross-origin changes. Rejected because it adds security-sensitive migration work without product benefit.

### Worker with Workers Assets

One Worker could serve both Hono and the SPA through Workers Assets. This is Cloudflare's simplest Hono topology, but it does not satisfy the requirement to use Pages and couples frontend and API releases. Rejected for this deployment.

## Runtime Boundaries

### Pages application

`apps/web` continues producing static Vite output. Pages deploys that output and provides SPA fallback behavior. Hashed assets remain immutable. `_routes.json` invokes Functions only for:

- `/api/*`
- `/uploads/*`
- `/.well-known/*`
- `/schema.json`
- `/robots.txt`
- `/sitemap.xml`
- `/llms.txt`
- the root, ATS checker, and public-resume HTML routes that require metadata injection

All other asset requests bypass Functions.

### Pages gateway

Gateway contains no business logic. It forwards original `Request` objects to `env.API.fetch(request)` and returns Worker responses unchanged. It uses a generated service-binding type, not a handwritten binding cast.

Metadata routes read the SPA shell through the Pages `ASSETS` binding. Static root and ATS metadata can be injected locally. Public-resume metadata comes from a narrow internal Worker endpoint returning already-normalized fields. User-authored values are escaped before HTML injection. Lookup failure returns generic shell rather than failing page request.

### Hono API Worker

Worker entry exports a fetch handler instead of starting `@hono/node-server`. Hono context bindings include Hyperdrive, R2, non-secret configuration, and secrets. Client address comes from a validated Cloudflare request header rather than `getConnInfo()`.

Routes remain grouped under existing server adapters. Static SPA serving is removed from Worker. Node-only startup and process handlers are removed from Worker entry.

Worker configuration uses current compatibility date, Workers Node.js compatibility, generated binding types, structured observability, and explicit CPU limits. Request-scoped database and service instances remain request-scoped; no request state is stored globally.

## PostgreSQL and Hyperdrive

PostgreSQL remains authoritative. Hyperdrive supplies Worker runtime connection string. Drizzle schema and root migrations remain unchanged.

Database client becomes runtime-injected:

- Worker requests construct a `pg.Client` or narrowly scoped pool using `env.HYPERDRIVE.connectionString`.
- Drizzle receives that client through request context.
- Node tooling and tests retain direct `DATABASE_URL` support.
- Business services depend on an injected database type instead of importing a process-global database singleton.

Migration execution moves out of server startup. CI runs migrations exactly once with direct `DATABASE_URL` before promoting Worker and Pages deployments. Worker health checks verify database connectivity but never mutate schema.

Preview should use a separate PostgreSQL database or isolated schema and its own Hyperdrive configuration. Production and preview must not share writable data.

## R2 Storage

Storage contract stays in `packages/api`. Add a native `R2StorageService` using the Worker binding:

- `list(prefix)` uses paginated listing until cursor exhaustion.
- `write()` stores bytes plus HTTP metadata, including content type.
- `read()` returns object body, size, ETag, upload date, and content type.
- `delete()` deletes exact object or enumerated prefix; prefix deletion is bounded and tested.
- `healthcheck()` performs a non-mutating list/head operation.

Worker uses R2 binding directly rather than S3 REST credentials. Node deployments may retain local and S3 adapters for self-hosting. Public files continue flowing through authenticated/path-validating Hono routes so bucket stays private. Responses should stream R2 bodies instead of buffering complete files.

Existing S3/local objects migrate with a resumable manifest containing key, size, ETag/checksum, content type, source, destination status, and verification result. Cutover occurs only after object counts and sampled hashes match.

## Auth and Security

Pages origin remains `APP_URL`, so secure same-site auth cookies and OAuth callback paths remain stable. Gateway preserves method, URL, body, and headers. Worker derives trusted client IP from Cloudflare-provided headers and never trusts arbitrary forwarded headers from public callers.

Secrets live in Cloudflare secret bindings:

- `AUTH_SECRET`
- PostgreSQL origin credentials used to provision Hyperdrive, not exposed as ordinary Worker vars
- OAuth client secrets
- AI-provider encryption secret
- email provider token

Non-secret flags and URLs live in Wrangler environment configuration. Preview and production values are explicit and separate. CSP remains same-origin because browser traffic still uses Pages hostname.

## Email

SMTP transport is not used in Worker. Add an HTTP email adapter using a provider with a Workers-compatible API. Existing console/no-provider behavior remains for local development. Email feature code depends on a small transport interface so Node self-hosting can retain Nodemailer while Worker uses HTTP.

Provider choice and credentials are deployment inputs, not hardcoded application decisions.

## Image Processing

Native `sharp` is excluded from Worker bundle. First production release sets `FLAG_DISABLE_IMAGE_PROCESSING=true`, preserving original supported images with existing validation and size limits.

Second phase may use Cloudflare Image Resizing or Images binding if consistent JPEG normalization remains required. This is optional and cannot block base deployment.

## PDF Generation

PDF support requires an explicit compatibility gate because React PDF can be CPU- and memory-heavy and currently renders through a Node-oriented server adapter.

Implementation begins with a Worker-runtime test rendering representative small, large, CJK, RTL, image-heavy, and multi-page resumes. Acceptance requires byte-valid PDF output within configured CPU and 128 MB memory constraints.

If compatible, PDF rendering stays in API Worker and responses stream where possible. If incompatible, API Worker delegates to a dedicated Cloudflare Browser Rendering Worker or an approved Node fallback through a private authenticated interface. Browser Rendering is preferred for Cloudflare-only deployment. PDF failure remains isolated from ordinary API traffic.

## SEO and Static Metadata

Current Node server injects canonical, OpenGraph, Twitter, and JSON-LD metadata into the SPA shell. Pages Function preserves this behavior:

- root and ATS checker use static metadata;
- public resume pages request safe social metadata from API Worker;
- auth, dashboard, builder, and template shell routes retain `noindex` policy;
- unknown asset-like paths return 404 instead of SPA HTML;
- security headers remain attached to HTML responses.

`robots.txt`, `sitemap.xml`, `llms.txt`, and `schema.json` can remain Worker-generated and pass through gateway unless build-time generation proves equivalent.

## Configuration and Repository Shape

Expected new or changed surfaces:

- `apps/server/src/worker.ts`: Cloudflare Worker entry.
- `apps/server/wrangler.jsonc`: Worker bindings, environments, compatibility, observability, routes disabled by default.
- `apps/server/src/platform/*`: request IP, runtime config, database, and platform service adapters.
- `apps/web/functions/*`: Pages gateway and metadata handlers.
- `apps/web/public/_routes.json`: narrow Function invocation routing.
- `apps/web/wrangler.jsonc`: Pages service binding and environment values.
- `packages/db`: injected Worker/Node client factories with unchanged schema exports.
- `packages/api/src/features/storage`: R2 adapter and streaming read contract.
- `packages/email`: transport abstraction and Worker HTTP adapter.
- CI workflow: migration, Worker deploy, Pages deploy, smoke tests, promotion, rollback metadata.
- deployment documentation and environment-variable matrix.

Exact files and interfaces belong in implementation plan after this design is accepted.

## Delivery Phases

1. Add Worker runtime harness and automated compatibility inventory without changing production.
2. Inject runtime configuration and database access; connect Worker to preview PostgreSQL through Hyperdrive.
3. Add R2 adapter, object migration tool, and upload/read/delete verification.
4. Move email to HTTP adapter and disable native image processing in Worker.
5. Resolve PDF compatibility gate and choose in-Worker or Browser Rendering path.
6. Deploy Pages static output plus same-origin service-binding gateway.
7. Restore SEO metadata behavior in Pages Functions.
8. Add CI/CD, observability, security checks, staging soak, and rollback.
9. Migrate production objects, deploy Worker, deploy Pages, verify, then switch traffic.

Each phase must leave Node self-hosting operational until Cloudflare production cutover succeeds.

## Verification

Required automated checks:

- existing unit and package tests;
- Worker-runtime tests using Wrangler/Miniflare for bindings and route behavior;
- R2 storage contract tests, including pagination, missing objects, metadata, private paths, and streaming;
- Hyperdrive integration tests against preview PostgreSQL;
- auth cookie, OAuth callback, and trusted-client-IP tests through Pages gateway;
- PDF compatibility fixtures and byte validation;
- Pages routing tests proving static assets bypass Functions;
- Playwright smoke tests for registration/login, resume CRUD, image upload, public sharing, PDF download, and logout.

Release smoke checks target both preview URLs and production custom domain. Success requires healthy API/database/storage checks, no Worker exceptions, correct cache/security headers, correct SEO HTML, and successful rollback rehearsal.

## Rollout and Rollback

Deploy additive changes first. Keep current Node service and object source available during migration. R2 write cutover should support a short dual-write or maintenance window; avoid indefinite dual-write complexity.

Production order:

1. Apply database migrations.
2. Verify Hyperdrive and R2 bindings.
3. Deploy private API Worker.
4. Run direct Worker smoke tests through service-binding test environment.
5. Deploy Pages preview and run E2E suite.
6. Copy and verify existing objects in R2.
7. Promote Pages deployment/custom domain.
8. Monitor errors, latency, database connections, R2 failures, auth failures, and PDF failures.

Rollback points Pages to previous deployment and restores traffic to Node service. Database migrations must remain backward-compatible through the rollback window. Source objects remain retained until post-cutover verification period ends.

## Risks and Mitigations

- **Worker bundle incompatibility:** create per-capability runtime probes before broad refactor.
- **PDF resource pressure:** use representative fixtures and isolate rendering if it fails limits.
- **Database connection churn:** use Hyperdrive, request-scoped clients, and integration load tests.
- **Auth regression through gateway:** preserve same origin and test cookies/OAuth end to end.
- **Large upload memory use:** stream request and R2 response bodies; enforce existing size policy.
- **Metadata regression:** port current route classification and escaping tests before traffic switch.
- **Storage data loss:** manifest-based copy, checksums, retained source, and reversible cutover.
- **Node self-hosting regression:** keep Node adapters and select platform at entry-point boundary.

## Success Criteria

- Pages serves SPA and static assets from production custom domain.
- Pages Function forwards only server-owned paths to private Hono Worker.
- All existing API and Better Auth flows work without CORS or cookie changes.
- Worker reaches existing PostgreSQL through Hyperdrive; no migration runs on request or startup.
- New uploads, reads, deletions, and private attachment rules work through R2.
- Existing stored objects are migrated and verified.
- Root, ATS checker, public resume, noindex, and 404 metadata behavior matches current Node deployment.
- PDF route either passes Worker compatibility fixtures or delegates to documented Cloudflare rendering service.
- Node self-host deployment remains buildable during migration and rollback window.
- CI can deploy preview, verify it, promote production, and identify previous deployable versions.

## Primary References

- [Hono on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/hono/)
- [Cloudflare Pages service bindings](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare Pages Function routing](https://developers.cloudflare.com/pages/functions/routing/)
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [Drizzle ORM with Hyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/drizzle-orm/)
- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
