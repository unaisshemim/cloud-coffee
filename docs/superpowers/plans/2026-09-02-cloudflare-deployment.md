# Cloudflare Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy cloudcoffee's Vite frontend on Cloudflare Pages, Hono API on Cloudflare Workers, uploads in R2, and existing PostgreSQL through Hyperdrive without breaking Node self-hosting.

**Architecture:** Pages stays public origin and forwards server-owned paths through service binding to private Hono Worker, preserving same-origin auth. Worker uses request-scoped Drizzle connection through Hyperdrive and request-scoped R2 storage adapter. Node entry retains filesystem/S3, SMTP, static serving, and rollback capability behind separate runtime adapters.

**Tech Stack:** TypeScript, pnpm/Turborepo, Hono, Cloudflare Workers, Cloudflare Pages Functions, Wrangler, R2, Hyperdrive, PostgreSQL, Drizzle ORM, Better Auth, Vitest, Playwright, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-02-cloudflare-deployment-design.md`

## Global Constraints

- Keep PostgreSQL authoritative; do not migrate schema or data to D1.
- Keep oRPC, Better Auth, Drizzle, TanStack Router, Hono, resume templates, and document formats.
- Keep Node self-host build and runtime working until Cloudflare cutover and rollback window finish.
- Pages remains browser-visible origin; browser API URLs and cookies stay same-origin.
- Worker accesses PostgreSQL only through `HYPERDRIVE` binding and R2 only through `STORAGE` binding.
- Worker never runs database migrations during module initialization or request handling.
- Worker bundle must not include filesystem storage, Nodemailer, `sharp`, or `@hono/node-server`.
- Set Worker `compatibility_date` to `2026-09-02`; use Node.js compatibility and generated binding types.
- Store secrets in Cloudflare secrets or GitHub environment secrets, never tracked configuration.
- Add every new process environment variable to root `turbo.json` `globalEnv`.
- Keep unrelated untracked files under `output/hackathon-showcase/` untouched.
- Run `graphify update .` once after implementation verification.

## File Structure

### Runtime and HTTP composition

- `apps/server/src/http/api-app.ts`: runtime-neutral Hono route composition.
- `apps/server/src/http/app.ts`: Node composition that adds web-dist/static fallbacks.
- `apps/server/src/platform/types.ts`: API application dependency and Worker binding types.
- `apps/server/src/platform/node.ts`: Node trusted-client and default runtime setup.
- `apps/server/src/platform/cloudflare.ts`: Worker trusted-client, Hyperdrive, R2, and request-runtime setup.
- `apps/server/src/worker.ts`: Cloudflare Worker fetch entry.
- `apps/server/wrangler.jsonc`: Worker deployment/binding configuration.

### Environment, database, auth, storage, and email

- `packages/env/src/schema.ts`: runtime-neutral server-variable schema.
- `packages/env/src/server.ts`: validated `process.env` export without filesystem discovery.
- `packages/db/src/runtime.ts`: request-scoped database access.
- `packages/db/src/client.ts`: Node PostgreSQL default database.
- `packages/auth/src/config.ts`: auth factory bound to current database and runtime URLs.
- `packages/api/src/features/storage/contracts.ts`: storage and image-processor interfaces.
- `packages/api/src/features/storage/runtime.ts`: request-scoped storage runtime.
- `packages/api/src/features/storage/node.ts`: local/S3 storage and Sharp image processor.
- `packages/api/src/features/storage/r2.ts`: native R2 storage and passthrough image processor.
- `packages/api/src/features/storage/service.ts`: runtime-neutral storage helpers.
- `packages/email/src/contracts.ts`: rendered email payload and transport contract.
- `packages/email/src/transport.ts`: runtime-neutral rendering and dispatch.
- `packages/email/src/node.ts`: Nodemailer adapter.
- `apps/server/src/platform/resend.ts`: Worker HTTP email adapter.

### Pages, migration, delivery, and docs

- `apps/web/functions/_middleware.ts`: Pages asset/metadata/API gateway.
- `packages/resume/src/web-meta/route-policy.ts`: shared route classification.
- `packages/resume/src/web-meta/seo.ts`: shared HTML metadata injection.
- `apps/web/public/_routes.json`: narrow Pages Function invocation rules.
- `apps/web/wrangler.jsonc`: Pages project and API service binding.
- `tooling/migrate-storage-to-r2.ts`: resumable object migration command.
- `tooling/migrate-storage-to-r2.test.ts`: migration manifest and verification tests.
- `.github/workflows/deploy-cloudflare.yml`: preview/production deploy pipeline.
- `docs/deployment/cloudflare.md`: provisioning, deployment, cutover, and rollback runbook.

---

### Task 1: Split Portable Hono API from Node Web Server

**Files:**

- Create: `apps/server/src/http/api-app.ts`
- Create: `apps/server/src/http/api-app.test.ts`
- Modify: `apps/server/src/http/app.ts`
- Modify: `apps/server/src/http/app.test.ts`
- Create: `apps/server/src/platform/types.ts`

**Interfaces:**

- Produces: `createApiApp(options: ApiAppOptions): Hono<ApiEnvironment>`.
- Produces: `ApiAppOptions.getTrustedClient(context): string`.
- Consumes later: Node and Worker entries compose same API routes with different trusted-client resolvers.

- [ ] **Step 1: Write failing API-composition tests**

Move API-route assertions from `app.test.ts` into `api-app.test.ts`. Assert `/api/rpc`, auth, OAuth metadata, health, upload, PDF, robots, sitemap, `llms.txt`, and `schema.json` route correctly. Assert `/`, `/assets/app.js`, and unknown routes return 404 from API-only app.

```ts
const app = createApiApp({ getTrustedClient: () => "203.0.113.9" });
const response = await app.request("/api/health");
expect(response.status).toBe(200);
expect(mocks.handleHealth).toHaveBeenCalledOnce();

await expect(app.request("/").then((result) => result.status)).resolves.toBe(404);
```

- [ ] **Step 2: Run focused test and verify failure**

Run: `pnpm --filter server test -- src/http/api-app.test.ts`

Expected: FAIL because `createApiApp` does not exist.

- [ ] **Step 3: Extract portable route composition**

Define exact contract in `platform/types.ts`:

```ts
import type { Context, Hono } from "hono";

export type ApiBindings = Record<string, unknown>;
export type ApiEnvironment = { Bindings: ApiBindings };
export type TrustedClientResolver = (context: Context<ApiEnvironment>) => string;

export type ApiAppOptions = {
	getTrustedClient: TrustedClientResolver;
};

export type ApiApp = Hono<ApiEnvironment>;
```

Move all server-owned routes from current `createApp()` into `createApiApp()`. Do not import `@hono/node-server`, `node:net`, `../static/web`, or `serveStatic` from this file.

Keep `createApp()` in `app.ts` as Node wrapper:

```ts
export function createApp() {
	const app = createApiApp({ getTrustedClient });
	app.on(["GET", "HEAD"], "/", (c) => handleWebApp(c.req.raw));
	app.use("/*", serveWebDistStatic);
	app.on(["GET", "HEAD"], "/*", (c) => handleWebApp(c.req.raw));
	return app;
}
```

- [ ] **Step 4: Run server route tests**

Run: `pnpm --filter server test -- src/http/api-app.test.ts src/http/app.test.ts`

Expected: PASS. Existing Node static/SEO assertions remain in `app.test.ts`; API assertions pass in `api-app.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/server/src/http/api-app.ts apps/server/src/http/api-app.test.ts apps/server/src/http/app.ts apps/server/src/http/app.test.ts apps/server/src/platform/types.ts
git commit -m "refactor(server): split portable Hono API app"
```

### Task 2: Make Environment Validation Worker-Compatible

**Files:**

- Create: `packages/env/src/schema.ts`
- Create: `packages/env/src/schema.test.ts`
- Modify: `packages/env/src/server.ts`
- Modify: `packages/env/package.json`
- Create: `apps/server/src/node.ts`
- Modify: `apps/server/src/index.ts`
- Modify: `turbo.json`

**Interfaces:**

- Produces: `serverEnvSchema` and `parseServerEnv(runtimeEnv)` from `@reactive-resume/env/schema`.
- Preserves: `env` from `@reactive-resume/env/server` for Node and Worker string configuration.
- Produces later: Worker receives object bindings separately from string configuration.

- [ ] **Step 1: Write failing schema tests**

Test valid minimum input, string-boolean coercion, optional secrets, invalid URL, and absence of filesystem checks from schema module.

```ts
expect(
	parseServerEnv({
		APP_URL: "https://resume.example",
		DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres",
		AUTH_SECRET: "secret",
	}),
).toMatchObject({ APP_URL: "https://resume.example", FLAG_DISABLE_IMAGE_PROCESSING: false });
```

- [ ] **Step 2: Run environment tests and verify failure**

Run: `pnpm --filter @reactive-resume/env test -- src/schema.test.ts`

Expected: FAIL because schema module does not exist.

- [ ] **Step 3: Extract pure schema and Node bootstrap**

Move Zod declarations into `schema.ts`. `parseServerEnv` must accept `Record<string, string | undefined>` and return inferred `ServerEnv`. Remove `node:path`, workspace discovery, and `.env` loading from `server.ts`; it becomes:

```ts
import { parseServerEnv } from "./schema";

export const env = parseServerEnv(process.env);
```

Move `.env` auto-loading and Node-only startup into `apps/server/src/node.ts`. Keep `index.ts` as tiny bootstrap that loads environment before dynamically importing `node.ts`.

Add exports:

```json
{
	"./schema": "./src/schema.ts",
	"./server": "./src/server.ts"
}
```

Add these future Worker variables to `turbo.json` now so later tasks cannot forget strict-env propagation:

```json
"INTERNAL_SERVICE_TOKEN",
"RESEND_API_KEY",
"EMAIL_FROM",
"PDF_RENDERER_URL",
"PDF_RENDERER_TOKEN"
```

- [ ] **Step 4: Verify environment and Node startup surfaces**

Run: `pnpm --filter @reactive-resume/env test && pnpm --filter @reactive-resume/env typecheck && pnpm --filter server typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/env/src/schema.ts packages/env/src/schema.test.ts packages/env/src/server.ts packages/env/package.json apps/server/src/index.ts apps/server/src/node.ts turbo.json
git commit -m "refactor(env): isolate runtime-neutral validation"
```

### Task 3: Add Request-Scoped Database Runtime and Hyperdrive Adapter

**Files:**

- Create: `packages/db/src/runtime.ts`
- Create: `packages/db/src/runtime.test.ts`
- Modify: `packages/db/src/client.ts`
- Modify: `packages/db/package.json`
- Modify: all files currently importing `@reactive-resume/db/client` under `apps/server/src`, `packages/api/src`, and `packages/auth/src`
- Modify: `packages/auth/src/config.ts`
- Modify: `packages/auth/src/config.test.ts`
- Modify: `packages/auth/src/types.ts`
- Create: `apps/server/src/platform/database.ts`
- Create: `apps/server/src/platform/database.test.ts`

**Interfaces:**

- Produces: `AppDatabase`, `getDatabase()`, `runWithDatabase(database, callback)` from `@reactive-resume/db/runtime`.
- Produces: `createHyperdriveDatabase(connectionString): Promise<{ database: AppDatabase; close(): Promise<void> }>`.
- Produces: `createAuth(database: AppDatabase, config: ServerEnv): Auth`.
- Preserves: Node default client from `@reactive-resume/db/client`.

- [ ] **Step 1: Write failing database-context tests**

```ts
await runWithDatabase(first, async () => {
	expect(getDatabase()).toBe(first);
	await runWithDatabase(second, async () => expect(getDatabase()).toBe(second));
	expect(getDatabase()).toBe(first);
});
expect(() => getDatabase()).toThrow("Database runtime is not configured");
```

Test concurrent contexts with two unresolved promises to prove no cross-request database leakage.

- [ ] **Step 2: Run database tests and verify failure**

Run: `pnpm --filter @reactive-resume/db test -- src/runtime.test.ts`

Expected: FAIL because runtime exports do not exist.

- [ ] **Step 3: Implement database context**

Use `AsyncLocalStorage<AppDatabase>` from `node:async_hooks`. Export exact API:

```ts
export type AppDatabase = NodePgDatabase<typeof schema>;
export function getDatabase(): AppDatabase;
export function setDefaultDatabase(database: AppDatabase): void;
export function runWithDatabase<T>(database: AppDatabase, callback: () => T): T;
```

`client.ts` creates existing Node pool, calls `setDefaultDatabase(database)`, and exports `database` plus `getPool()`. Add `./runtime` export map.

Replace direct `db` imports with `getDatabase()` at operation boundaries. In transaction type aliases use `AppDatabase`, not `typeof db`. Dynamic imports in `social-meta.ts` and `public-pdf.ts` import `getDatabase` from runtime.

- [ ] **Step 4: Convert Better Auth to database-bound factory**

Change `config.ts` to export:

```ts
export function createAuth(database: AppDatabase, config: ServerEnv) {
	return betterAuth({
		baseURL: config.APP_URL,
		database: drizzleAdapter(database, { schema, provider: "pg" }),
		// retain existing hooks, providers, plugins, and policies
	});
}

export type Auth = ReturnType<typeof createAuth>;
```

Node runtime constructs one `auth` from default database. Worker constructs auth inside database request context. Update API oRPC context to receive `auth: Auth`; update `handleRpc`, `handleOpenApi`, auth HTTP handlers, and OAuth metadata handlers to receive it explicitly.

- [ ] **Step 5: Add Hyperdrive client factory**

Implement request-scoped `pg.Client` creation using `env.HYPERDRIVE.connectionString`, `await client.connect()`, `drizzle(client, { schema })`, and idempotent `close()` calling `client.end()`. Do not create a module-global Worker pool.

Test connect/end calls and assert close occurs after both successful and failing callbacks.

- [ ] **Step 6: Run affected tests**

Run:

```bash
pnpm --filter @reactive-resume/db test
pnpm --filter @reactive-resume/auth test
pnpm --filter @reactive-resume/api test
pnpm --filter server test
pnpm --filter @reactive-resume/db typecheck
pnpm --filter @reactive-resume/auth typecheck
pnpm --filter @reactive-resume/api typecheck
pnpm --filter server typecheck
```

Expected: PASS. `rg -n '@reactive-resume/db/client' apps/server packages/api packages/auth` only shows Node bootstrap or explicit Node tests.

- [ ] **Step 7: Commit**

```bash
git add packages/db packages/auth packages/api apps/server/src turbo.json
git commit -m "refactor(db): support request-scoped Hyperdrive clients"
```

### Task 4: Split Storage Runtime and Implement Native R2 Adapter

**Files:**

- Create: `packages/api/src/features/storage/contracts.ts`
- Create: `packages/api/src/features/storage/runtime.ts`
- Create: `packages/api/src/features/storage/runtime.test.ts`
- Create: `packages/api/src/features/storage/node.ts`
- Create: `packages/api/src/features/storage/r2.ts`
- Create: `packages/api/src/features/storage/r2.test.ts`
- Modify: `packages/api/src/features/storage/service.ts`
- Modify: `packages/api/src/features/storage/service.test.ts`
- Modify: `packages/api/src/features/storage/router.ts`
- Modify: `packages/api/src/features/storage/index.ts`
- Modify: `packages/api/package.json`
- Modify: `apps/server/src/static/uploads.ts`
- Modify: `apps/server/src/static/uploads.test.ts`

**Interfaces:**

- Produces: `StorageService`, `StorageReadResult`, `ImageProcessor`, and `StorageRuntime`.
- Produces: `runWithStorageRuntime(runtime, callback)` and `getStorageRuntime()`.
- Produces: `createNodeStorageRuntime(config)` and `createR2StorageRuntime(bucket)`.
- Changes: stored object reads expose `body: ReadableStream<Uint8Array> | Uint8Array`, allowing upload responses to stream.

- [ ] **Step 1: Write failing storage-runtime and R2 contract tests**

Use an in-memory fake `R2Bucket`. Cover paginated `list`, `put` HTTP metadata, missing `get`, streamed body, exact delete, prefix delete across multiple pages, and non-mutating health check.

```ts
const service = new R2StorageService(bucket);
await service.write({ key: "uploads/u1/picture.png", data, contentType: "image/png" });
expect(bucket.put).toHaveBeenCalledWith(
	"uploads/u1/picture.png",
	data,
	{ httpMetadata: { contentType: "image/png" } },
);
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --filter @reactive-resume/api test -- src/features/storage/runtime.test.ts src/features/storage/r2.test.ts`

Expected: FAIL because runtime and R2 modules do not exist.

- [ ] **Step 3: Extract contracts and Node implementation**

Move filesystem, AWS SDK, and Sharp imports into `node.ts`. Keep `service.ts` free of `node:fs`, `node:path`, `@aws-sdk/client-s3`, and `sharp`.

Define exact runtime contract:

```ts
export type StorageRuntime = {
	storage: StorageService;
	processImage(file: File): Promise<{ data: Uint8Array; contentType: string }>;
};
```

Node factory chooses S3 or local storage from validated config and uses Sharp processor unless flag disables it. `service.ts` calls `getStorageRuntime()` for `uploadFile`, image processing, and deletion.

- [ ] **Step 4: Implement R2 service**

`R2StorageService.list()` loops while `truncated` and supplies returned cursor. `delete(prefix)` first attempts exact key, then enumerates and batches `bucket.delete(keys)` in groups no larger than platform-supported batch size. `read()` returns `object.body`, `object.size`, quoted `object.httpEtag`, `object.uploaded`, and `object.httpMetadata?.contentType`.

R2 runtime processor returns original bytes when `FLAG_DISABLE_IMAGE_PROCESSING=true`. Throw explicit configuration error if Worker enables processing without a Cloudflare image processor.

- [ ] **Step 5: Stream upload responses**

Update `handleUpload` to pass a stream directly to `Response` and omit `Content-Length` only when size is unknown. Preserve ETag, cache, content disposition, robots, CORP, referrer, frame, and nosniff headers. Remove hash fallback for streamed bodies; R2 and S3/local adapters must supply ETag.

- [ ] **Step 6: Run storage tests and typecheck**

Run:

```bash
pnpm --filter @reactive-resume/api test -- src/features/storage
pnpm --filter server test -- src/static/uploads.test.ts
pnpm --filter @reactive-resume/api typecheck
pnpm --filter server typecheck
```

Expected: PASS. `rg -n 'sharp|@aws-sdk/client-s3|node:fs' packages/api/src/features/storage/service.ts packages/api/src/features/storage/runtime.ts packages/api/src/features/storage/r2.ts` returns no matches.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/features/storage packages/api/package.json apps/server/src/static/uploads.ts apps/server/src/static/uploads.test.ts
git commit -m "feat(storage): add request-scoped R2 backend"
```

### Task 5: Add Runtime-Neutral Email Transport

**Files:**

- Create: `packages/email/src/contracts.ts`
- Create: `packages/email/src/runtime.ts`
- Create: `packages/email/src/runtime.test.ts`
- Create: `packages/email/src/node.ts`
- Modify: `packages/email/src/transport.ts`
- Modify: `packages/email/src/transport.test.ts`
- Modify: `packages/email/package.json`
- Create: `apps/server/src/platform/resend.ts`
- Create: `apps/server/src/platform/resend.test.ts`
- Modify: `packages/env/src/schema.ts`
- Modify: `packages/env/src/schema.test.ts`

**Interfaces:**

- Produces: `EmailTransport.send(payload: RenderedEmail): Promise<void>`.
- Produces: `runWithEmailTransport(transport, callback)` and `sendEmail(options)`.
- Produces: `createNodemailerTransport(config)` and `createResendTransport(config, fetchImpl?)`.

- [ ] **Step 1: Write failing transport tests**

Test React rendering occurs before transport dispatch, missing body skips dispatch, no configured transport logs without throwing, and Resend adapter sends exact HTTP request.

```ts
expect(fetchMock).toHaveBeenCalledWith("https://api.resend.com/emails", {
	method: "POST",
	headers: { Authorization: "Bearer resend-key", "Content-Type": "application/json" },
	body: JSON.stringify({ from: "noreply@example.com", to: ["user@example.com"], subject: "Verify", html: "<p>Code</p>" }),
});
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --filter @reactive-resume/email test && pnpm --filter server test -- src/platform/resend.test.ts`

Expected: FAIL because transport contracts/adapters do not exist.

- [ ] **Step 3: Split rendering from delivery**

Keep React Email rendering in runtime-neutral `transport.ts`. Move Nodemailer import and SMTP configuration to `node.ts`. Use request-scoped transport in Worker and default Node transport for current server.

Add `RESEND_API_KEY` and `EMAIL_FROM` to environment schema. Resend adapter validates `response.ok`; on error include status and bounded response text in thrown error. `sendEmail` retains current log-and-continue behavior after structured error logging.

- [ ] **Step 4: Run tests and bundle-import check**

Run:

```bash
pnpm --filter @reactive-resume/email test
pnpm --filter @reactive-resume/email typecheck
pnpm --filter server test -- src/platform/resend.test.ts
pnpm --filter server typecheck
```

Expected: PASS. Worker-facing imports do not reach `packages/email/src/node.ts` or Nodemailer.

- [ ] **Step 5: Commit**

```bash
git add packages/email apps/server/src/platform/resend.ts apps/server/src/platform/resend.test.ts packages/env/src/schema.ts packages/env/src/schema.test.ts turbo.json
git commit -m "refactor(email): add Workers-compatible HTTP transport"
```

### Task 6: Build Cloudflare Worker Entry and Bindings

**Files:**

- Create: `apps/server/src/platform/cloudflare.ts`
- Create: `apps/server/src/platform/cloudflare.test.ts`
- Create: `apps/server/src/worker.ts`
- Create: `apps/server/src/worker.test.ts`
- Create: `apps/server/wrangler.jsonc`
- Modify: `apps/server/package.json`
- Modify: `apps/server/tsconfig.json`
- Modify: root `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/server/src/http/api-app.ts`
- Modify: `apps/server/src/http/api-app.test.ts`

**Interfaces:**

- Produces Worker bindings: `HYPERDRIVE: Hyperdrive`, `STORAGE: R2Bucket`, `INTERNAL_SERVICE_TOKEN`, `RESEND_API_KEY`, `EMAIL_FROM`, plus string app configuration.
- Produces: default Worker `fetch(request, bindings, executionContext): Promise<Response>`.
- Produces: private `GET /internal/resume-social-meta/:username/:slug` route.

- [ ] **Step 1: Add Wrangler and generated-type toolchain**

Add root dev dependencies `wrangler` and `@cloudflare/workers-types`. Add scripts:

```json
{
	"cf:types": "pnpm --filter server cf:types && pnpm --filter web cf:types",
	"dev:worker": "pnpm --filter server dev:worker",
	"deploy:worker": "pnpm --filter server deploy:worker"
}
```

Server scripts:

```json
{
	"cf:types": "wrangler types src/worker-configuration.d.ts",
	"dev:worker": "wrangler dev",
	"deploy:worker": "wrangler deploy"
}
```

- [ ] **Step 2: Write failing Worker lifecycle tests**

Mock Hyperdrive client, R2 runtime, and email transport. Assert request wrapper connects before fetch, supplies isolated runtimes, closes database in `finally`, and converts initialization failure to structured 503 without leaking secrets.

Test trusted client resolution accepts only gateway-injected header when constant-time service-token validation passes; otherwise returns `unknown`.

- [ ] **Step 3: Run tests and verify failure**

Run: `pnpm --filter server test -- src/platform/cloudflare.test.ts src/worker.test.ts`

Expected: FAIL because Worker entry does not exist.

- [ ] **Step 4: Implement Worker request runtime**

Exact flow:

```ts
const connection = await createHyperdriveDatabase(bindings.HYPERDRIVE.connectionString);
const storage = createR2StorageRuntime(bindings.STORAGE, { disableImageProcessing: true });
const email = createResendTransport({ apiKey: bindings.RESEND_API_KEY, from: bindings.EMAIL_FROM });

try {
	return await runWithDatabase(connection.database, () =>
		runWithStorageRuntime(storage, () =>
			runWithEmailTransport(email, () => api.fetch(request, bindings, executionContext)),
		),
	);
} finally {
	await connection.close();
}
```

Every promise is awaited or returned. No request data enters module-global mutable state.

- [ ] **Step 5: Add internal social-metadata route**

Validate `X-Cloudcoffee-Service-Token` using Web Crypto constant-time comparison. Return only `name`, `title`, `description`, and `template`; return 401 for invalid token and 404 for absent/private/password-protected resume. Do not expose route from Pages gateway.

- [ ] **Step 6: Configure Wrangler**

Check in configuration with:

- name `cloudcoffee-api`;
- main `src/worker.ts`;
- compatibility date `2026-09-02`;
- Node.js compatibility;
- Smart Placement;
- observability enabled with explicit sampling;
- 30-second CPU limit for normal API requests;
- `HYPERDRIVE` and `STORAGE` bindings in preview and production environments;
- `FLAG_DISABLE_IMAGE_PROCESSING` set to string `true`;
- no public route or custom domain.

Provision preview and production resources before filling binding IDs:

```bash
pnpm wrangler r2 bucket create cloudcoffee-preview
pnpm wrangler r2 bucket create cloudcoffee-production
pnpm wrangler hyperdrive create cloudcoffee-preview --connection-string "$PREVIEW_DATABASE_URL"
pnpm wrangler hyperdrive create cloudcoffee-production --connection-string "$PRODUCTION_DATABASE_URL"
```

Copy each command's emitted Hyperdrive ID into matching Wrangler environment. Set secrets with `wrangler secret put` for each environment; do not put values in JSONC.

- [ ] **Step 7: Generate types and run local Worker smoke test**

Run:

```bash
pnpm cf:types
pnpm --filter server typecheck
pnpm --filter server test
pnpm --filter server dev:worker
```

In second terminal:

```bash
curl -i http://localhost:8787/api/health
curl -i http://localhost:8787/
```

Expected: health returns 200 with database/storage checks; root returns 404; generated types compile without handwritten `Env` casts.

- [ ] **Step 8: Verify Worker bundle excludes Node-only adapters**

Run: `pnpm --filter server exec wrangler deploy --dry-run --outdir /tmp/cloudcoffee-worker-dry-run`

Inspect generated metafile/bundle. Expected: no `@hono/node-server`, `nodemailer`, `sharp`, local storage module, or `node:fs` application import; bundle stays within paid Worker size limit.

- [ ] **Step 9: Commit**

```bash
git add package.json pnpm-lock.yaml apps/server/package.json apps/server/tsconfig.json apps/server/wrangler.jsonc apps/server/src/worker.ts apps/server/src/worker.test.ts apps/server/src/worker-configuration.d.ts apps/server/src/platform/cloudflare.ts apps/server/src/platform/cloudflare.test.ts apps/server/src/http/api-app.ts apps/server/src/http/api-app.test.ts
git commit -m "feat(server): add Cloudflare Worker runtime"
```

### Task 7: Establish PDF Compatibility Gate and Renderer Boundary

**Files:**

- Create: `packages/api/src/features/resume/pdf-renderer.ts`
- Create: `packages/api/src/features/resume/pdf-renderer.test.ts`
- Modify: `packages/api/src/features/resume/export.ts`
- Modify: `packages/api/src/features/resume/public-pdf.ts`
- Create: `apps/server/src/platform/pdf.ts`
- Create: `apps/server/src/platform/pdf.worker.test.ts`
- Create conditionally if direct rendering fails: `apps/server/src/platform/remote-pdf.ts`
- Create conditionally if direct rendering fails: `apps/server/src/platform/remote-pdf.test.ts`
- Modify conditionally if direct rendering fails: `apps/server/src/http/app.ts`
- Create: `docs/deployment/cloudflare.md`

**Interfaces:**

- Produces: `PdfRenderer.render(input: { data: ResumeData; filename: string }): Promise<File>`.
- Produces: `runWithPdfRenderer(renderer, callback)` and `getPdfRenderer()`.
- Direct path: Worker adapter calls existing `createResumePdfFile`.
- Fallback path: Worker adapter posts serialized render input to authenticated Node renderer endpoint.

- [ ] **Step 1: Write failing renderer-boundary tests**

Assert private and public PDF functions call injected renderer, propagate filename, preserve access checks, and map renderer failures to existing API error/status behavior.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --filter @reactive-resume/api test -- src/features/resume/pdf-renderer.test.ts src/features/resume/public-pdf.test.ts`

Expected: FAIL because renderer runtime does not exist.

- [ ] **Step 3: Implement renderer boundary**

Remove dynamic direct imports of `@reactive-resume/pdf/server` from API defaults. Resolve renderer from request context. Node runtime registers current React PDF renderer; Worker runtime registers direct Worker renderer for compatibility probe.

- [ ] **Step 4: Add Worker compatibility fixtures**

Render six checked-in fixtures: small, 20-page, image-heavy, CJK, RTL, and cover letter. For every output assert `%PDF-` header, `%%EOF` trailer, non-zero page count through existing PDF.js test helper, and completion under configured Worker CPU/memory limits.

Run: `pnpm --filter server test -- src/platform/pdf.worker.test.ts`

Decision rule:

- If all six pass in `wrangler dev` and deployed preview Worker, retain direct renderer.
- If any fixture fails bundle, CPU, memory, font, or output validation, use fallback steps below before continuing.

- [ ] **Step 5A: Direct-render path verification**

Run preview downloads for owner, anonymous public resume, password-protected resume, and expired signed URL. Record Worker CPU and memory metrics in `docs/deployment/cloudflare.md`. Continue only if all succeed.

- [ ] **Step 5B: Required fallback when direct render fails**

Implement `RemotePdfRenderer` posting JSON to `${PDF_RENDERER_URL}/internal/pdf/render` with `Authorization: Bearer ${PDF_RENDERER_TOKEN}`. Add matching Node-only route that validates token with `timingSafeEqual`, parses `ResumeData`, calls existing React PDF renderer, and returns PDF. Worker performs auth/database lookup before delegation, so fallback receives only render input and has no database access.

Test invalid token=401, invalid schema=400, valid render=200 PDF, upstream timeout=504, and upstream 5xx maps to current PDF failure response. Keep fallback URL/token optional in Node but required in Worker only when direct renderer is disabled.

- [ ] **Step 6: Run PDF suites and typechecks**

Run:

```bash
pnpm --filter @reactive-resume/pdf test
pnpm --filter @reactive-resume/api test -- src/features/resume
pnpm --filter server test -- src/http/resume-pdf.test.ts src/http/public-resume-pdf.test.ts src/platform/pdf.worker.test.ts
pnpm --filter @reactive-resume/api typecheck
pnpm --filter server typecheck
```

Expected: PASS for selected direct or fallback path. Do not mark Cloudflare deployment ready with PDF route disabled.

- [ ] **Step 7: Commit**

```bash
git add packages/api/src/features/resume apps/server/src/platform apps/server/src/http/app.ts docs/deployment/cloudflare.md turbo.json
git commit -m "refactor(pdf): isolate runtime renderer"
```

### Task 8: Add Pages Gateway, SPA Routing, and SEO Injection

**Files:**

- Create: `packages/resume/src/web-meta/route-policy.ts`
- Create: `packages/resume/src/web-meta/route-policy.test.ts`
- Create: `packages/resume/src/web-meta/seo.ts`
- Create: `packages/resume/src/web-meta/seo.test.ts`
- Create: `packages/resume/src/web-meta/index.ts`
- Modify: `packages/resume/package.json`
- Create: `apps/web/functions/_middleware.ts`
- Create: `apps/web/functions/_middleware.test.ts`
- Create: `apps/web/public/_routes.json`
- Create: `apps/web/wrangler.jsonc`
- Modify: `apps/web/package.json`
- Modify: `apps/web/tsconfig.json`
- Modify: `apps/server/src/static/web.ts`
- Modify: `apps/server/src/static/web.test.ts`

**Interfaces:**

- Produces: `classifyPageRequest(url): "proxy" | "metadata" | "asset" | "shell" | "not-found"`.
- Produces: `injectPageMetadata(html, metadata): string` shared by Node and Pages.
- Consumes: Pages bindings `API: Fetcher`, `INTERNAL_SERVICE_TOKEN: string`.
- Preserves: root/ATS/public resume metadata, noindex headers, security headers, and asset-like 404 behavior.

- [ ] **Step 1: Write route-policy and metadata parity tests**

Table-test `/`, `/ats-checker`, `/auth/login`, `/dashboard`, `/builder/id`, `/templates`, `/jane/resume`, `/assets/app.js`, `/unknown.js`, `/api/rpc`, `/uploads/u/p.png`, and `/.well-known/openid-configuration`.

Reuse current malicious social-meta fixtures to assert `&`, `<`, `>`, quotes, and apostrophes are escaped before HTML injection.

- [ ] **Step 2: Run tests and verify failure**

Run: `pnpm --filter @reactive-resume/resume test -- src/web-meta/route-policy.test.ts src/web-meta/seo.test.ts && pnpm --filter web test -- functions/_middleware.test.ts`

Expected: FAIL because Pages modules do not exist.

- [ ] **Step 3: Extract shared route and SEO logic**

Move pure route classification and HTML string transforms from Node `static/web.ts` into `packages/resume/src/web-meta`. Add explicit `@reactive-resume/resume/web-meta` export and consume it from both apps. Shared helpers must have no DOM, filesystem, database, Node server, or Worker binding dependency.

- [ ] **Step 4: Implement Pages middleware**

Behavior:

```ts
if (policy === "proxy") {
	const headers = new Headers(context.request.headers);
	headers.delete("X-Cloudcoffee-Service-Token");
	headers.delete("X-Cloudcoffee-Client-IP");
	headers.set("X-Cloudcoffee-Service-Token", context.env.INTERNAL_SERVICE_TOKEN);
	headers.set("X-Cloudcoffee-Client-IP", context.request.headers.get("CF-Connecting-IP") ?? "unknown");
	return context.env.API.fetch(new Request(context.request, { headers }));
}

const shell = await context.next();
// inject static or service-fetched metadata only for metadata routes
```

For public resume metadata, call service binding route with shared secret. On 401, 404, timeout, or invalid JSON, return generic noindex shell. Never forward `/internal/*` from browser to Worker.

- [ ] **Step 5: Configure Pages routing**

`_routes.json` includes server paths and HTML routes, excludes hashed/static directories (`/assets/*`, `/fonts/*`, `/images/*`, `/templates/*`, `/videos/*`, `/opengraph/*`) and known root static files. Middleware returns `context.next()` for non-special SPA paths.

Pages `wrangler.jsonc` defines project name `cloudcoffee-web`, compatibility date `2026-09-02`, service binding `API` to matching `cloudcoffee-api` environment, and no tracked secret values.

Add scripts:

```json
{
	"cf:types": "wrangler types src/pages-configuration.d.ts",
	"dev:pages": "wrangler pages dev dist -c wrangler.jsonc -c ../server/wrangler.jsonc",
	"deploy:pages": "wrangler pages deploy dist --project-name cloudcoffee-web"
}
```

- [ ] **Step 6: Run Pages parity and boundary checks**

Run:

```bash
pnpm --filter web build
pnpm --filter web test
pnpm --filter @reactive-resume/resume test -- src/web-meta
pnpm --filter server test -- src/static/web.test.ts
pnpm --filter web typecheck
pnpm --filter @reactive-resume/resume typecheck
pnpm --filter server typecheck
pnpm exec turbo boundaries
```

Expected: PASS. Built `dist/_routes.json` exists. Asset requests bypass Functions; root/public resume HTML contains expected metadata; protected app routes return noindex shell.

- [ ] **Step 7: Commit**

```bash
git add apps/web apps/server/src/static/web.ts apps/server/src/static/web.test.ts packages/resume package.json pnpm-lock.yaml
git commit -m "feat(web): add Pages gateway and SEO middleware"
```

### Task 9: Build Resumable Storage Migration Tool

**Files:**

- Create: `tooling/migrate-storage-to-r2.ts`
- Create: `tooling/migrate-storage-to-r2.test.ts`
- Modify: `tooling/package.json`
- Modify: root `package.json`
- Modify: `.gitignore`

**Interfaces:**

- Produces command: `pnpm storage:migrate-r2 -- --manifest /tmp/cloudcoffee-r2-migration.jsonl --source local --verify`.
- Produces JSONL records: `{ key, size, sourceEtag, destinationEtag, status, verifiedAt, error? }`.
- Uses R2 S3-compatible endpoint only from local migration tooling; application Worker continues using native binding.

- [ ] **Step 1: Write failing migration tests**

Use fake source/destination object stores. Test resume skips verified keys, changed size recopies, bounded concurrency, failure records, retry, count summary, and SHA-256 verification for configured sample rate.

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter @reactive-resume/tooling test -- migrate-storage-to-r2.test.ts`

Expected: FAIL because migration command does not exist.

- [ ] **Step 3: Implement source/destination abstraction and manifest**

Define:

```ts
type MigrationObjectStore = {
	list(cursor?: string): Promise<{ objects: Array<{ key: string; size: number; etag?: string }>; cursor?: string }>;
	read(key: string): Promise<ReadableStream<Uint8Array>>;
	write(key: string, body: ReadableStream<Uint8Array>, metadata: { contentType?: string }): Promise<{ etag?: string }>;
	head(key: string): Promise<{ size: number; etag?: string } | null>;
};
```

Append one fsynced JSONL record per completed key. Never delete source objects. Default concurrency 4. Retry transient 429/5xx/network failures with capped exponential backoff; record permanent failures and exit non-zero.

- [ ] **Step 4: Add dry-run and verification modes**

Dry-run lists counts/bytes without writes. Verification compares every size and hashes a deterministic 10% sample plus every object smaller than 1 MiB. `--verify-all` hashes all objects.

Secrets come from `SOURCE_S3_*` and `R2_*` environment variables; manifest path must be absolute and outside tracked directories.

- [ ] **Step 5: Run migration tests**

Run: `pnpm --filter @reactive-resume/tooling test -- migrate-storage-to-r2.test.ts && pnpm --filter @reactive-resume/tooling typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tooling/migrate-storage-to-r2.ts tooling/migrate-storage-to-r2.test.ts tooling/package.json package.json .gitignore pnpm-lock.yaml
git commit -m "feat(tooling): add resumable R2 migration"
```

### Task 10: Add Cloudflare CI/CD and Deployment Runbook

**Files:**

- Create: `.github/workflows/deploy-cloudflare.yml`
- Modify: `docs/deployment/cloudflare.md`
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `apps/server/wrangler.jsonc`
- Modify: `apps/web/wrangler.jsonc`

**Interfaces:**

- Produces: pull-request preview deployment, manually approved production deployment, migration gate, smoke gate, and recorded rollback identifiers.
- Consumes GitHub environments `cloudflare-preview` and `cloudflare-production`.

- [ ] **Step 1: Write workflow validation expectations**

Document required GitHub secrets/variables before writing workflow:

- Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL`, `AUTH_SECRET`, `INTERNAL_SERVICE_TOKEN`, OAuth/AI secrets, `RESEND_API_KEY`, optional PDF fallback token.
- Variables: `APP_URL`, `EMAIL_FROM`, Worker environment, Pages project, expected custom domain, optional PDF fallback URL.

Preview and production use separate GitHub environments and separate PostgreSQL/Hyperdrive/R2 resources.

- [ ] **Step 2: Add deployment workflow**

Workflow order:

1. checkout;
2. setup Node 24 and pnpm 11.24.0;
3. frozen install;
4. package tests, typecheck, and boundaries;
5. build web;
6. run `dotenvx run -- pnpm db:migrate` once against target PostgreSQL;
7. deploy environment-specific private Worker;
8. deploy Pages output;
9. capture Worker version and Pages deployment URL as job outputs/artifact;
10. run smoke script against deployment URL;
11. require protected GitHub environment approval before production job.

Use workflow concurrency per environment. Do not use `cancel-in-progress` for production after migration step begins.

- [ ] **Step 3: Write deployment runbook**

Runbook contains exact commands for Cloudflare login, R2/Hyperdrive provisioning, secret entry, Pages service binding, custom domain, preview deployment, production migration, object dry-run/copy/verify, smoke checks, log inspection, rollback to previous Pages deployment/Worker version, and source-object retention period.

Include feature matrix:

- database via Hyperdrive;
- R2 read/write/delete/list;
- auth session/OAuth;
- API/OpenAPI/well-known endpoints;
- public/private/password resume routes;
- PDF selected path;
- email HTTP adapter;
- root/ATS/public SEO;
- Node rollback deployment.

- [ ] **Step 4: Validate workflow and docs**

Run:

```bash
pnpm exec github-actionlint .github/workflows/deploy-cloudflare.yml
pnpm exec markdownlint-cli2 docs/deployment/cloudflare.md README.md
pnpm build
```

Expected: PASS. No secret literal or live resource credential appears in `git diff`.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/deploy-cloudflare.yml docs/deployment/cloudflare.md .env.example README.md apps/server/wrangler.jsonc apps/web/wrangler.jsonc
git commit -m "ci: add Cloudflare deployment pipeline"
```

### Task 11: End-to-End Verification, Staging Soak, and Cutover

**Files:**

- Create: `tests/e2e/cloudflare-deployment.spec.ts`
- Create: `tooling/cloudflare-smoke.mjs`
- Modify: `playwright.config.ts`
- Modify: root `package.json`
- Modify: `docs/deployment/cloudflare.md`

**Interfaces:**

- Produces: `pnpm test:e2e:cloudflare` and `pnpm cloudflare:smoke -- <base-url>`.
- Produces: objective go/no-go checklist and rollback rehearsal evidence.

- [ ] **Step 1: Write failing Cloudflare E2E tests**

Cover:

- Pages static asset returns long-lived immutable caching and does not include Function marker header.
- registration/login/session/logout preserve secure same-origin cookies;
- resume create/update/public share flow persists through Hyperdrive;
- image upload/read/delete flows through R2 with correct headers;
- private attachment cannot be fetched from public upload path;
- root, ATS checker, public resume, protected shell, and unknown asset HTML/status match policy;
- private/public/password-protected/expired-token PDF cases work;
- health reports database and storage healthy;
- API error response does not expose bindings, database URL, or secrets.

- [ ] **Step 2: Run against preview and verify initial failure**

Run: `PLAYWRIGHT_BASE_URL="$CLOUDFLARE_PREVIEW_URL" pnpm test:e2e:cloudflare`

Expected before deployment: FAIL because preview URL/runtime is unavailable.

- [ ] **Step 3: Deploy preview and run full verification**

Run:

```bash
pnpm check
pnpm typecheck
pnpm test
pnpm exec turbo boundaries
pnpm build
pnpm --filter server deploy:worker --env preview
pnpm --filter web deploy:pages
PLAYWRIGHT_BASE_URL="$CLOUDFLARE_PREVIEW_URL" pnpm test:e2e:cloudflare
pnpm cloudflare:smoke -- "$CLOUDFLARE_PREVIEW_URL"
```

Expected: all commands PASS. Note `pnpm check` is write-capable; inspect resulting diff and retain only formatting relevant to this implementation.

- [ ] **Step 4: Perform R2 migration rehearsal**

Run dry-run, copy, resume, and verify-all against preview bucket. Interrupt once after several objects, restart with same manifest, and confirm no verified object is recopied. Record counts and byte totals in runbook.

- [ ] **Step 5: Soak preview and rehearse rollback**

Run representative traffic for at least 24 hours. Review Worker exceptions, p95 latency, CPU, memory failures, Hyperdrive connection/query failures, R2 errors, auth errors, PDF failures, and email failures. Roll Pages and Worker back one version, rerun smoke test, then restore candidate versions.

- [ ] **Step 6: Production go/no-go gate**

Proceed only when:

- all automated checks pass;
- preview soak has no unresolved severity-1 or severity-2 failures;
- PDF path meets compatibility decision;
- object migration verification has zero unexplained mismatches;
- database migrations are backward-compatible through rollback window;
- previous Node service, Worker version, and Pages deployment identifiers are recorded.

- [ ] **Step 7: Cut over production**

Apply migrations, deploy Worker, verify private service binding, migrate/verify R2 objects, deploy Pages, attach/promote custom domain, and run E2E/smoke suite. Monitor dashboards continuously during cutover.

If smoke or health fails, restore previous Pages deployment and route traffic to Node service. Do not delete source objects. Retain source storage until agreed post-cutover retention period expires.

- [ ] **Step 8: Update Graphify and final verification**

Run:

```bash
graphify update .
git status --short
git diff --check
pnpm typecheck
pnpm test
pnpm exec turbo boundaries
pnpm build
```

Expected: PASS. Only intended tracked implementation changes remain; unrelated showcase files remain untouched.

- [ ] **Step 9: Commit**

```bash
git add tests/e2e/cloudflare-deployment.spec.ts tooling/cloudflare-smoke.mjs playwright.config.ts package.json docs/deployment/cloudflare.md
git commit -m "test: verify Cloudflare deployment end to end"
```

## Execution Notes

- Complete tasks in order. Tasks 1–6 establish deployable API Worker; Task 7 is hard PDF gate; Task 8 adds public Pages origin; Tasks 9–11 handle data and production delivery.
- Keep commits small and independently revertible. Do not combine PDF fallback with unrelated runtime work.
- When direct PDF rendering fails, complete Task 7 fallback before Pages production cutover. Cloudflare deployment is not feature-complete without working PDF endpoints.
- Provisioned resource IDs and secret values are environment-specific operational inputs. Record names and non-secret IDs in Wrangler/runbook; store secret values only in Cloudflare/GitHub secret stores.
- Run focused tests after each task, then repo-wide verification only at Task 11.
