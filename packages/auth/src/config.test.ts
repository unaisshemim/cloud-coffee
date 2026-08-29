import { describe, expect, it } from "vitest";
import { auth } from "./config";

describe("Google-only authentication", () => {
	it("configures Google as the only social provider", () => {
		expect(Object.keys(auth.options.socialProviders ?? {})).toEqual(["google"]);
	});

	it("does not enable credential authentication", () => {
		expect("emailAndPassword" in auth.options).toBe(false);
	});

	it("does not install passkey, two-factor, or generic OAuth plugins", () => {
		const pluginIds = (auth.options.plugins ?? []).map((plugin) => plugin.id);

		expect(pluginIds).not.toContain("passkey");
		expect(pluginIds).not.toContain("two-factor");
		expect(pluginIds).not.toContain("generic-oauth");
	});
});
