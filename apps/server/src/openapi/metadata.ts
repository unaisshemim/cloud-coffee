import { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata } from "@better-auth/oauth-provider";
import { auth } from "@reactive-resume/auth/config";
import { env } from "@reactive-resume/env/server";

export const handleOAuthAuthorizationServer = oauthProviderAuthServerMetadata(auth);
export const handleOpenIdConfiguration = oauthProviderOpenIdConfigMetadata(auth);

export function handleWellKnownFallback() {
	return new Response("Not Found", { status: 404 });
}

export function handleOAuthProtectedResource() {
	const metadata = {
		resource: env.APP_URL,
		bearer_methods_supported: ["header"],
		authorization_servers: [`${env.APP_URL}/api/auth`],
	};

	return Response.json(metadata, {
		headers: {
			"Content-Type": "application/json",
			"Cache-Control": "public, max-age=15, stale-while-revalidate=15, stale-if-error=86400",
		},
	});
}
