# Google-Only Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Google OAuth the only interactive sign-in and sign-up method while preserving sessions, usernames, account data, and MCP OAuth authorization.

**Architecture:** Better Auth keeps Google, session, admin, JWT, username, Dash, and MCP OAuth-provider plugins. Public provider discovery becomes a Google-only capability check. Web auth becomes one Google button with a validated local callback path; legacy auth and authentication-settings routes redirect to supported pages.

**Tech Stack:** TypeScript 7, React 19, Better Auth 1.7.2, TanStack Router, oRPC, Vitest, pnpm/Turborepo

**Spec:** `docs/superpowers/specs/2026-08-29-google-only-auth-design.md`

## Global Constraints

- Google OAuth is the only interactive user authentication method.
- Keep MCP OAuth client authorization (`oauthProvider`) intact.
- Preserve existing auth tables and data; generate no database migration.
- Keep username/profile behavior, sessions, admin, JWT, Dash, and account deletion.
- Google callback is `${APP_URL}/api/auth/callback/google`; local callback is `http://localhost:3000/api/auth/callback/google`.
- Never allow an absolute or protocol-relative post-login redirect.
- Do not hand-edit `apps/web/src/routeTree.gen.ts`.

---

### Task 1: Google-Only Provider Discovery

**Files:**
- Modify: `packages/auth/src/types.ts`
- Modify: `packages/api/src/features/auth/service.ts`
- Modify: `packages/api/src/features/auth/service.test.ts`
- Modify: `packages/api/src/features/auth/router.ts`

**Interfaces:**
- Produces: `AuthProvider = "google"`
- Produces: `authService.providers.list(): Partial<Record<"google", string>>`

- [ ] **Step 1: Replace provider tests with failing Google-only assertions**

```ts
it("returns no provider when Google credentials are incomplete", () => {
	resetEnv();
	expect(authService.providers.list()).toEqual({});
	envMock.GOOGLE_CLIENT_ID = "id";
	expect(authService.providers.list()).toEqual({});
});

it("returns only Google when both credentials are configured", () => {
	resetEnv();
	envMock.GOOGLE_CLIENT_ID = "id";
	envMock.GOOGLE_CLIENT_SECRET = "secret";
	expect(authService.providers.list()).toEqual({ google: "Google" });
});
```

- [ ] **Step 2: Run focused API test and verify RED**

Run: `pnpm --filter @reactive-resume/api test -- src/features/auth/service.test.ts`

Expected: FAIL because credentials and passkey are still always returned and non-Google environment fields remain in provider discovery.

- [ ] **Step 3: Implement Google-only provider contract**

Set `AuthProvider` to `"google"`. Make `providers.list()` return `{ google: "Google" }` only when both Google credentials exist, otherwise `{}`. Update route documentation to state Google is the sole provider.

- [ ] **Step 4: Run focused API test and verify GREEN**

Run: `pnpm --filter @reactive-resume/api test -- src/features/auth/service.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit provider contract**

```bash
git add packages/auth/src/types.ts packages/api/src/features/auth/service.ts packages/api/src/features/auth/service.test.ts packages/api/src/features/auth/router.ts
git commit -m "refactor(auth): expose only Google provider"
```

### Task 2: Reduce Better Auth Server to Google

**Files:**
- Modify: `packages/auth/src/config.ts`
- Modify: `packages/auth/src/config.test.ts`
- Modify: `packages/auth/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Keeps: `auth`, `verifyOAuthToken(token: string): Promise<JWTPayload>`
- Keeps plugin IDs: JWT, admin, OAuth provider, username, optional Dash
- Removes user-facing credential, passkey, two-factor, GitHub, LinkedIn, and generic OAuth endpoints

- [ ] **Step 1: Write failing server configuration tests**

```ts
it("configures Google as the only social provider", () => {
	expect(Object.keys(auth.options.socialProviders ?? {})).toEqual(["google"]);
});

it("does not enable credential authentication", () => {
	expect(auth.options.emailAndPassword?.enabled).not.toBe(true);
});

it("does not install passkey, two-factor, or generic OAuth plugins", () => {
	const pluginIds = (auth.options.plugins ?? []).map((plugin) => plugin.id);
	expect(pluginIds).not.toContain("passkey");
	expect(pluginIds).not.toContain("two-factor");
	expect(pluginIds).not.toContain("generic-oauth");
});
```

- [ ] **Step 2: Run auth config test and verify RED**

Run: `pnpm --filter @reactive-resume/auth test -- src/config.test.ts`

Expected: FAIL because three social providers, credential auth, passkey, two-factor, and generic OAuth are enabled.

- [ ] **Step 3: Remove unsupported server auth capabilities**

Remove imports and configuration for `bcrypt`, React email rendering, auth email templates, `@better-auth/passkey`, generic OAuth, two-factor, GitHub mapping, email/password, email verification, and change-email confirmation. Keep `additionalFields.username`, Google mapping, `accountLinking.trustedProviders: ["google"]`, MCP `oauthProvider`, username, JWT, admin, and optional Dash.

- [ ] **Step 4: Remove now-unused auth package dependencies and update lockfile**

Remove `@better-auth/passkey`, `@reactive-resume/email`, `bcrypt`, `react`, `@types/bcrypt`, and `@types/react` from `packages/auth/package.json` only after imports are gone.

Run: `pnpm install --lockfile-only`

Expected: lockfile updates without dependency-resolution errors.

- [ ] **Step 5: Run auth tests and typecheck**

Run: `pnpm --filter @reactive-resume/auth test`

Run: `pnpm --filter @reactive-resume/auth typecheck`

Expected: both PASS.

- [ ] **Step 6: Commit server reduction**

```bash
git add packages/auth/src/config.ts packages/auth/src/config.test.ts packages/auth/package.json pnpm-lock.yaml
git commit -m "refactor(auth): keep Google sign-in only"
```

### Task 3: Google-Only Login and Safe Return Paths

**Files:**
- Create: `apps/web/src/features/auth/redirect.ts`
- Create: `apps/web/src/features/auth/redirect.test.ts`
- Create: `apps/web/src/features/auth/pages/login.test.tsx`
- Modify: `apps/web/src/features/auth/pages/login.tsx`
- Modify: `apps/web/src/features/auth/components/social-auth.tsx`
- Modify: `apps/web/src/libs/auth/client.ts`
- Modify: `apps/web/src/routes/auth/login.tsx`
- Modify: `apps/web/src/routes/dashboard/route.tsx`
- Modify: `apps/web/src/routes/builder/$resumeId/route.tsx`

**Interfaces:**
- Produces: `resolveAuthRedirect(value: unknown): string`
- Changes: `LoginPageProps = { callbackURL: string }`
- Changes: `SocialAuthProps = { callbackURL: string }`

- [ ] **Step 1: Write failing redirect-policy tests**

```ts
expect(resolveAuthRedirect("/dashboard/resumes")).toBe("/dashboard/resumes");
expect(resolveAuthRedirect("https://evil.example")).toBe("/dashboard");
expect(resolveAuthRedirect("//evil.example")).toBe("/dashboard");
expect(resolveAuthRedirect(undefined)).toBe("/dashboard");
```

- [ ] **Step 2: Run redirect tests and verify RED**

Run: `pnpm --filter web test -- src/features/auth/redirect.test.ts`

Expected: FAIL because `resolveAuthRedirect` does not exist.

- [ ] **Step 3: Implement redirect policy**

```ts
export function resolveAuthRedirect(value: unknown): string {
	if (typeof value !== "string") return "/dashboard";
	if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
	return value;
}
```

- [ ] **Step 4: Write failing login rendering test**

Render `LoginPage` with provider discovery mocked to `{ google: "Google" }`. Assert one button named `Continue with Google`, and assert absence of Password, Passkey, GitHub, LinkedIn, register, and forgot-password actions. Add a second case with `{}` that shows `Google sign-in is unavailable` and no enabled sign-in action.

- [ ] **Step 5: Run login test and verify RED**

Run: `pnpm --filter web test -- src/features/auth/pages/login.test.tsx`

Expected: FAIL because credential and multi-provider controls still render.

- [ ] **Step 6: Implement Google-only login**

Reduce `LoginPage` to heading plus `SocialAuth`. Reduce `SocialAuth` to one full-width Google button that calls:

```ts
authClient.signIn.social({ provider: "google", callbackURL })
```

Show a skeleton while provider discovery loads and an unavailable message when Google is absent. Remove passkey/two-factor client plugins while retaining username field inference, admin, Dash, and MCP OAuth clients.

Validate optional login search `redirect`, pass it through `resolveAuthRedirect`, and include `search: { redirect: location.href }` when dashboard or builder guards send anonymous users to login.

- [ ] **Step 7: Run web auth tests and typecheck**

Run: `pnpm --filter web test -- src/features/auth/redirect.test.ts src/features/auth/pages/login.test.tsx`

Run: `pnpm --filter web typecheck`

Expected: both PASS.

- [ ] **Step 8: Commit login flow**

```bash
git add apps/web/src/features/auth/redirect.ts apps/web/src/features/auth/redirect.test.ts apps/web/src/features/auth/pages/login.tsx apps/web/src/features/auth/pages/login.test.tsx apps/web/src/features/auth/components/social-auth.tsx apps/web/src/libs/auth/client.ts apps/web/src/routes/auth/login.tsx apps/web/src/routes/dashboard/route.tsx 'apps/web/src/routes/builder/$resumeId/route.tsx'
git commit -m "feat(auth): add Google-only login"
```

### Task 4: Redirect Legacy Auth and Remove Unsupported Settings

**Files:**
- Modify: `apps/web/src/routes/auth/register.tsx`
- Modify: `apps/web/src/routes/auth/forgot-password.tsx`
- Modify: `apps/web/src/routes/auth/reset-password.tsx`
- Modify: `apps/web/src/routes/auth/verify-2fa.tsx`
- Modify: `apps/web/src/routes/auth/verify-2fa-backup.tsx`
- Modify: `apps/web/src/routes/dashboard/settings/authentication/index.tsx`
- Modify: `apps/web/src/routes/dashboard/-components/sidebar.tsx`
- Modify: `apps/web/src/features/settings/pages/profile.tsx`
- Modify: `tests/e2e/specs/settings-profile.spec.ts`
- Modify: `apps/web/src/dialogs/auth/registry.tsx`
- Modify: `apps/web/src/dialogs/auth/schema.ts`
- Delete: `apps/web/src/features/auth/pages/register.tsx`
- Delete: `apps/web/src/features/auth/pages/forgot-password.tsx`
- Delete: `apps/web/src/features/auth/pages/reset-password.tsx`
- Delete: `apps/web/src/features/auth/pages/verify-2fa.tsx`
- Delete: `apps/web/src/features/settings/authentication/`
- Delete: `apps/web/src/dialogs/auth/change-password.tsx`
- Delete: `apps/web/src/dialogs/auth/enable-two-factor.tsx`
- Delete: `apps/web/src/dialogs/auth/disable-two-factor.tsx`

**Interfaces:**
- Legacy public auth routes redirect to `/auth/login`.
- Legacy authentication settings route redirects to `/dashboard/settings/account`.
- Dialog registries export empty readonly arrays with their existing exported names so central registry imports stay stable.

- [ ] **Step 1: Convert legacy route files to unconditional redirects**

Use route `beforeLoad` handlers that throw `redirect({ to: "/auth/login", replace: true })`. Authentication settings instead redirects to `/dashboard/settings/account`.

- [ ] **Step 2: Write a failing profile-email ownership check**

Extend `tests/e2e/specs/settings-profile.spec.ts` to assert that the signed-in user's email is visible but cannot be edited, while name and username remain editable. The assertion must fail against the current editable email field.

- [ ] **Step 3: Remove unsupported pages, settings navigation, controls, hooks, and dialogs**

Delete components reachable only from those redirect routes. Remove Authentication from dashboard sidebar. Keep `authDialogRenderers` and `authDialogSchemas` as empty readonly arrays unless central registry types permit removing their imports cleanly.

Remove `authClient.changeEmail` from profile settings and render session email as a disabled/read-only field. Continue submitting only `name`, `username`, and `displayUsername` through `authClient.updateUser`.

- [ ] **Step 4: Regenerate route tree through supported tooling**

Run: `pnpm --filter web typecheck`

Expected: TanStack tooling refreshes generated routing as needed; typecheck passes without hand-editing `routeTree.gen.ts`.

- [ ] **Step 5: Search for unsupported auth UI references**

Run:

```bash
rg -n "signIn\.(email|username|passkey)|signUp\.email|changeEmail|forgot-password|reset-password|verify-2fa|auth\.(change-password|two-factor)|PasskeysSection|PasswordSection|TwoFactorSection" apps/web/src --glob '!routeTree.gen.ts'
```

Expected: only intentional legacy route filenames/redirect declarations remain; no callable unsupported auth controls remain.

- [ ] **Step 6: Run web test suite**

Run: `pnpm --filter web test`

Expected: PASS.

- [ ] **Step 7: Commit UI cleanup**

```bash
git add apps/web/src tests/e2e/specs/settings-profile.spec.ts
git commit -m "refactor(auth): remove unsupported auth screens"
```

### Task 5: Remove Obsolete Auth Environment and Dependencies

**Files:**
- Modify: `packages/env/src/server.ts`
- Modify: `packages/api/src/features/flags/router.ts`
- Modify: `turbo.json`
- Modify: `apps/web/package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Required Google runtime keys remain `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APP_URL`, and `AUTH_SECRET`.
- Removes custom-login configuration and `FLAG_DISABLE_EMAIL_AUTH`; keeps SMTP because email infrastructure is independent of interactive auth.

- [ ] **Step 1: Remove obsolete environment schema keys**

Remove `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, all custom-login `OAUTH_*` keys, and `FLAG_DISABLE_EMAIL_AUTH` from `packages/env/src/server.ts`. Do not remove MCP-specific `BETTER_AUTH_*` keys or `FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI` because MCP dynamic client registration still uses them.

- [ ] **Step 2: Remove the obsolete email-auth feature flag response**

Remove `disableEmailAuth` from `FeatureFlags`, the oRPC output schema, handler data, and route description in `packages/api/src/features/flags/router.ts`. Keep `disableSignups`; it still controls whether Google may create a new user.

- [ ] **Step 3: Mirror environment removal in Turborepo**

Remove the same obsolete keys from `turbo.json.globalEnv`. Keep Google, Better Auth, SMTP, storage, and MCP redirect-policy variables.

- [ ] **Step 4: Remove browser passkey dependency and update lockfile**

Remove `@better-auth/passkey` from `apps/web/package.json`.

Run: `pnpm install --lockfile-only`

Expected: lockfile is internally consistent.

- [ ] **Step 5: Verify removed configuration has no runtime references**

Run:

```bash
rg -n "GITHUB_CLIENT_|LINKEDIN_CLIENT_|OAUTH_(PROVIDER_NAME|CLIENT_ID|CLIENT_SECRET|DISCOVERY_URL|AUTHORIZATION_URL|TOKEN_URL|USER_INFO_URL|SCOPES)|FLAG_DISABLE_EMAIL_AUTH|@better-auth/passkey" packages apps turbo.json --glob '!**/*.md'
```

Expected: no matches.

- [ ] **Step 6: Run focused package checks**

Run: `pnpm --filter @reactive-resume/env typecheck`

Run: `pnpm --filter @reactive-resume/auth typecheck`

Run: `pnpm --filter @reactive-resume/api typecheck`

Run: `pnpm --filter web typecheck`

Expected: all PASS.

- [ ] **Step 7: Commit environment cleanup**

```bash
git add packages/env/src/server.ts packages/api/src/features/flags/router.ts turbo.json apps/web/package.json pnpm-lock.yaml
git commit -m "chore(auth): remove obsolete provider configuration"
```

### Task 6: Full Verification and Documentation Sync

**Files:**
- Modify if generated: `apps/web/src/routeTree.gen.ts`
- Modify if generated: Lingui catalogs under `apps/web/src/locales/`
- Update: `graphify-out/`

**Interfaces:** None; verification gate only.

- [ ] **Step 1: Extract translation catalogs**

Run: `pnpm --filter web lingui:extract`

Expected: obsolete auth messages disappear and Google-only messages are catalogued.

- [ ] **Step 2: Run focused tests**

Run: `pnpm --filter @reactive-resume/auth test`

Run: `pnpm --filter @reactive-resume/api test -- src/features/auth/service.test.ts`

Run: `pnpm --filter web test`

Expected: all PASS with zero failures.

- [ ] **Step 3: Run typechecks and boundary validation**

Run: `pnpm --filter @reactive-resume/auth typecheck`

Run: `pnpm --filter @reactive-resume/api typecheck`

Run: `pnpm --filter web typecheck`

Run: `pnpm exec turbo boundaries`

Expected: all PASS.

- [ ] **Step 4: Run non-mutating formatting and diff checks**

Run: `pnpm exec biome check packages/auth/src packages/api/src/features/auth packages/env/src/server.ts apps/web/src/features/auth apps/web/src/routes/auth apps/web/src/libs/auth apps/web/src/routes/dashboard turbo.json`

Run: `git diff --check`

Expected: both PASS.

- [ ] **Step 5: Verify callback configuration contract**

Confirm code still uses Better Auth's Google callback `${APP_URL}/api/auth/callback/google`. Report these Google Console values:

```text
Authorized JavaScript origin: https://clouddcoffee.dev
Authorized redirect URI:      https://clouddcoffee.dev/api/auth/callback/google
```

- [ ] **Step 6: Update Graphify once**

Run: `graphify update .`

Expected: graph rebuild completes after verified source changes.

- [ ] **Step 7: Commit generated artifacts if changed**

```bash
git add apps/web/src/routeTree.gen.ts apps/web/src/locales
git commit -m "chore(auth): refresh generated auth artifacts"
```
