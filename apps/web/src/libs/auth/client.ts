import type { auth } from "@reactive-resume/auth/config";
import { dashClient } from "@better-auth/infra/client";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import { adminClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	plugins: [
		dashClient(),
		adminClient(),
		usernameClient(),
		oauthProviderClient(),
		oauthProviderResourceClient(),
		inferAdditionalFields<typeof auth>(),
	],
});
