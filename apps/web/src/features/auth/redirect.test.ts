import { describe, expect, it } from "vitest";
import { resolveAuthRedirect } from "./redirect";

describe("resolveAuthRedirect", () => {
	it("keeps a same-origin application path", () => {
		expect(resolveAuthRedirect("/dashboard/resumes")).toBe("/dashboard/resumes");
	});

	it.each([undefined, null, "", "dashboard", "https://evil.example", "//evil.example"])(
		"falls back to the dashboard for unsafe value %j",
		(value) => {
			expect(resolveAuthRedirect(value)).toBe("/dashboard");
		},
	);
});
