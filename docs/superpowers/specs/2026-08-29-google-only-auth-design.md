# Google-Only Authentication Design

## Goal

Make Google OAuth the only interactive sign-in and sign-up method. Remove all credential, passkey, two-factor, GitHub, LinkedIn, and custom-OAuth entry points while preserving existing users and auth data.

## OAuth Configuration

Google OAuth uses Better Auth's standard callback route:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `${APP_URL}/api/auth/callback/google`

Each deployed `APP_URL` must have its exact callback URI listed in the Google Cloud OAuth client's **Authorized redirect URIs**. Origins alone are insufficient, and callback URIs must match scheme, host, port, and path exactly.

Required runtime configuration:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `APP_URL`
- `AUTH_SECRET`

## Server Authentication

Keep Better Auth sessions, Google social authentication, the username field and normalization, admin support, JWT support, and OAuth-provider support used by MCP clients.

Remove or disable:

- Email and password authentication
- Password reset and email-verification delivery
- Passkey authentication
- Two-factor authentication
- GitHub authentication
- LinkedIn authentication
- Generic/custom social authentication
- Account linking to any provider except Google

Google configuration remains conditional on valid Google credentials. Startup or provider discovery must expose a clear unavailable state when either credential is absent; the UI must not offer a broken sign-in button.

## Web Authentication Flow

The login route becomes the sole interactive auth page. It displays one primary **Continue with Google** action and retains redirect handling so protected-route sign-in returns users to the intended destination.

Legacy interactive auth routes—register, forgot password, reset password, and two-factor verification—redirect to the login route. Keeping redirects instead of dead links gives old bookmarks and emailed links a safe landing page.

Remove passkey auto-login and all credential form behavior. Auth errors continue through the existing `/auth/error` page.

## Account Settings

Remove password, passkey, two-factor, and non-Google provider controls. Google must not be disconnectable because it is the only login method. Profile editing, session management, account deletion, and unrelated integration settings remain available.

## Existing Users and Data

Do not drop auth tables, columns, accounts, credentials, passkeys, or two-factor records. This release changes enabled behavior only.

Existing users can sign in when Google returns an email that Better Auth can safely associate with their account. Users without a matching Google identity lose interactive access. No automatic bulk account conversion occurs.

## Environment Cleanup

Remove application use of GitHub, LinkedIn, custom OAuth, email-auth, passkey, and two-factor configuration. Remove obsolete variables from validated environment schemas, examples, and Turborepo environment declarations only after confirming they have no remaining non-login purpose.

MCP OAuth client authorization is not a social login method and remains intact.

## Testing and Verification

Tests must prove:

- Auth server exposes Google and does not expose credential, passkey, GitHub, LinkedIn, or custom social sign-in.
- Login renders only **Continue with Google** and preserves callback destinations.
- Legacy auth routes redirect to login.
- Authentication settings contain no password, passkey, two-factor, unlink-Google, or non-Google controls.
- Missing Google credentials produce an unavailable provider state rather than a broken action.
- Focused auth package and web tests pass, followed by auth/web typechecks and package-boundary checks.

No database migration is expected because existing auth data is retained.
