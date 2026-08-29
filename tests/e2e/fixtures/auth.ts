import type { Browser, BrowserContext } from "@playwright/test";
import type { E2EAccount } from "./data";
import { createHmac } from "node:crypto";
import { seedAuthenticatedUser } from "./db";

export async function createAuthenticatedContext(
	browser: Browser,
	account: E2EAccount,
	baseURL: string,
): Promise<BrowserContext> {
	const authSecret = process.env.AUTH_SECRET;
	if (!authSecret) throw new Error("AUTH_SECRET is required for E2E authentication.");

	const sessionToken = await seedAuthenticatedUser(account);
	const signature = createHmac("sha256", authSecret).update(sessionToken).digest("base64");
	const url = new URL(baseURL);
	const secure = url.protocol === "https:";

	return browser.newContext({
		baseURL,
		storageState: {
			origins: [],
			cookies: [
				{
					name: `${secure ? "__Secure-" : ""}better-auth.session_token`,
					value: `${sessionToken}.${signature}`,
					domain: url.hostname,
					path: "/",
					httpOnly: true,
					secure,
					sameSite: "Lax",
					expires: Math.floor(Date.now() / 1000) + 86_400,
				},
			],
		},
	});
}
