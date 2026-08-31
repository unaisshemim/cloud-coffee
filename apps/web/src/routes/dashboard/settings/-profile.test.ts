import { describe, expect, it } from "vitest";
import { Route } from "./profile";

describe("legacy profile settings route", () => {
	it("redirects to the dashboard profile route", () => {
		expect(Route.options.beforeLoad).toBeTypeOf("function");

		try {
			Route.options.beforeLoad?.({} as never);
		} catch (error) {
			expect(error).toMatchObject({
				options: { replace: true, to: "/dashboard/profile" },
			});
			return;
		}

		throw new Error("Expected the legacy profile route to redirect.");
	});
});
