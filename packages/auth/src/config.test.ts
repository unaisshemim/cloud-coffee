import { describe, expect, it } from "vitest";
import { auth } from "./config";

describe("authentication methods", () => {
	it("configures Google as the only social provider", () => {
		expect(Object.keys(auth.options.socialProviders ?? {})).toEqual(["google"]);
	});

	it("enables email and password authentication without requiring email verification", () => {
		expect(auth.options.emailAndPassword).toMatchObject({
			enabled: true,
			autoSignIn: true,
			minPasswordLength: 8,
			maxPasswordLength: 64,
			requireEmailVerification: false,
		});
	});

	it("does not install passkey, two-factor, or generic OAuth plugins", () => {
		const pluginIds = (auth.options.plugins ?? []).map((plugin) => plugin.id);

		expect(pluginIds).not.toContain("passkey");
		expect(pluginIds).not.toContain("two-factor");
		expect(pluginIds).not.toContain("generic-oauth");
	});
});
