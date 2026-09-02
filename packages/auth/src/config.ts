import type { AppDatabase } from "@reactive-resume/db/runtime";
import type { ServerEnv } from "@reactive-resume/env/schema";
import type { JWTPayload } from "jose";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { dash } from "@better-auth/infra";
import { oauthProvider } from "@better-auth/oauth-provider";
import { APIError, betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { verifyBearerToken } from "better-auth/oauth2";
import { admin, jwt } from "better-auth/plugins";
import { username } from "better-auth/plugins/username";
import * as schema from "@reactive-resume/db/schema";
import { rateLimitConfig, TRUSTED_IP_HEADERS } from "@reactive-resume/utils/rate-limit";
import { generateId, toUsername } from "@reactive-resume/utils/string";
import { isAllowedOAuthRedirectUri } from "@reactive-resume/utils/url-security.node";
import { createProfileMapper } from "./oauth-profile";
import { getTrustedOrigins } from "./trusted-origins";

// JWKS must be reachable from inside the Node runtime. `authBaseUrl` is the
// publicly-visible URL — under Docker port-mapping or behind a reverse proxy
// it does not loop back to the app process. Override with `BETTER_AUTH_INTERNAL_URL`
// for split deployments or custom servers that bind to a port not exposed via `PORT`.
function resolveInternalBaseUrl(config: ServerEnv): string {
	const configured = process.env.BETTER_AUTH_INTERNAL_URL?.trim();
	if (configured) {
		return configured.replace(/\/+$/, "");
	}

	const port = process.env.NODE_ENV === "production" ? (process.env.PORT ?? "3000") : String(config.SERVER_PORT);

	return `http://127.0.0.1:${port}`;
}

export function createOAuthTokenVerifier(config: ServerEnv, options: { jwksBaseUrl?: string } = {}) {
	const authBaseUrl = config.APP_URL;
	const oauthAudienceBase = authBaseUrl.replace(/\/$/, "");
	const audiences = [oauthAudienceBase, `${oauthAudienceBase}/`];
	const internalBaseUrl = (options.jwksBaseUrl ?? resolveInternalBaseUrl(config)).replace(/\/+$/, "");

	return (token: string): Promise<JWTPayload> =>
		verifyBearerToken(token, {
			jwksUrl: `${internalBaseUrl}/api/auth/jwks`,
			verifyOptions: {
				issuer: `${authBaseUrl}/api/auth`,
				audience: audiences,
			},
		});
}

// `@better-auth/oauth-provider@1.7.1` declares OpenAPI parameter metadata (`schema.items`) in a
// shape that is not `exactOptionalPropertyTypes`-clean, which stops the plugin from structurally
// satisfying `BetterAuthPlugin`. `metadata` only feeds doc generation, so dropping it from the
// endpoint types keeps request/response inference (`auth.api.*`) intact. Remove once upstream ships
// EOPT-compatible endpoint types.
type WithoutEndpointMetadata<TPlugin> = TPlugin extends { endpoints: infer TEndpoints }
	? Omit<TPlugin, "endpoints"> & {
			endpoints: {
				[K in keyof TEndpoints]: TEndpoints[K] extends {
					(...args: infer TArgs): infer TResult;
					options: infer TOptions;
					path: infer TPath;
				}
					? {
							(...args: TArgs): TResult;
							options: Omit<TOptions, "metadata">;
							path: TPath;
						}
					: TEndpoints[K];
			};
		}
	: TPlugin;

export function createAuth(database: AppDatabase, config: ServerEnv) {
	const authBaseUrl = config.APP_URL;
	const isRateLimitEnabled = process.env.NODE_ENV === "production" && !config.FLAG_DISABLE_API_RATE_LIMIT;
	const trustedOrigins = getTrustedOrigins(config.APP_URL);
	const oauthAudienceBase = authBaseUrl.replace(/\/$/, "");
	const oauthAudiences = [oauthAudienceBase, `${oauthAudienceBase}/`];
	const oauthProviderRateLimit = isRateLimitEnabled
		? rateLimitConfig.betterAuth.oauthProvider
		: ({
				register: false,
				authorize: false,
				token: false,
				introspect: false,
				revoke: false,
				userinfo: false,
			} as const);

	return betterAuth({
		appName: "cloudcoffee",
		baseURL: authBaseUrl,
		secret: config.AUTH_SECRET,

		database: drizzleAdapter(database, { schema, provider: "pg" }),

		telemetry: { enabled: false },
		trustedOrigins,
		rateLimit: {
			...rateLimitConfig.betterAuth.global,
			enabled: isRateLimitEnabled,
		},

		hooks: {
			// biome-ignore lint/suspicious/useAwait: Better Auth requires middleware callbacks to return a Promise.
			before: createAuthMiddleware(async (ctx) => {
				if (!ctx.path.includes("/oauth2/register")) return;

				const body = ctx.body as { redirect_uris?: unknown } | undefined;
				const redirectUris = Array.isArray(body?.redirect_uris) ? body.redirect_uris : [];

				for (const uri of redirectUris) {
					if (typeof uri !== "string") {
						throw new APIError("BAD_REQUEST", { message: "redirect_uris entries must be strings" });
					}
					if (
						!isAllowedOAuthRedirectUri(uri, trustedOrigins, {
							allowUnsafe: config.FLAG_ALLOW_UNSAFE_OAUTH_REDIRECT_URI,
						})
					) {
						throw new APIError("BAD_REQUEST", {
							message: "redirect_uri is not allowed for dynamic client registration",
						});
					}
				}
			}),
		},

		// Without this, OAuth callback failures land on Better Auth's built-in `/api/auth/error`
		// page. It also backs the `oauthProvider` plugin's authorization errors that happen before
		// `redirect_uri` is validated and so cannot be returned to the requesting client.
		onAPIError: { errorURL: "/auth/error" },

		advanced: {
			database: { generateId },
			useSecureCookies: authBaseUrl.startsWith("https://"),
			ipAddress: { ipAddressHeaders: TRUSTED_IP_HEADERS },
		},

		emailAndPassword: {
			enabled: true,
			autoSignIn: true,
			minPasswordLength: 8,
			maxPasswordLength: 64,
			requireEmailVerification: false,
			disableSignUp: config.FLAG_DISABLE_SIGNUPS,
		},

		user: {
			additionalFields: {
				username: {
					type: "string",
					required: true,
				},
			},
		},

		account: {
			accountLinking: {
				enabled: true,
				trustedProviders: ["google"],
			},
		},

		socialProviders: {
			google: {
				enabled: !!config.GOOGLE_CLIENT_ID && !!config.GOOGLE_CLIENT_SECRET,
				disableSignUp: config.FLAG_DISABLE_SIGNUPS,
				clientId: config.GOOGLE_CLIENT_ID ?? "",
				clientSecret: config.GOOGLE_CLIENT_SECRET ?? "",
				mapProfileToUser: createProfileMapper({
					providerName: "Google",
					getName: (profile, context) => profile.name ?? context.emailLocalPart,
					getImage: (profile) => profile.picture,
				}),
			},
		},

		plugins: [
			jwt(),
			admin(),
			oauthProvider({
				loginPage: "/api/auth/oauth",
				consentPage: "/api/auth/oauth",
				validAudiences: oauthAudiences,
				allowDynamicClientRegistration: true,
				// Required for MCP client onboarding (RFC 7591). Phishing vector is closed by the
				// redirect_uri policy in the hooks.before middleware above and server auth preflight.
				allowUnauthenticatedClientRegistration: true,
				rateLimit: oauthProviderRateLimit,
				silenceWarnings: { oauthAuthServerConfig: true },
			}) as WithoutEndpointMetadata<ReturnType<typeof oauthProvider>>,
			username({
				minUsernameLength: 3,
				maxUsernameLength: 64,
				usernameNormalization: (value) => toUsername(value),
				displayUsernameNormalization: (value) => toUsername(value),
				usernameValidator: (username) => /^[a-z0-9._-]+$/.test(username),
				validationOrder: { username: "post-normalization", displayUsername: "post-normalization" },
			}),
			...(config.BETTER_AUTH_API_KEY
				? [dash({ apiKey: config.BETTER_AUTH_API_KEY, activityTracking: { enabled: true } })]
				: []),
		],
	});
}

export type Auth = ReturnType<typeof createAuth>;
export type OAuthTokenVerifier = ReturnType<typeof createOAuthTokenVerifier>;
