import { describe, expect, it } from "vitest";
import { createPageDescriptionTool } from "./page-tools";

describe("createPageDescriptionTool", () => {
	it("returns route context as JSON", async () => {
		const tool = createPageDescriptionTool({
			page: "resume-dashboard",
			route: "/dashboard/resumes",
			params: {},
			search: { view: "grid" },
			capabilities: ["list_resumes"],
		});

		const result = await tool.execute({}, { signal: new AbortController().signal });

		expect(tool.name).toBe("rr.page.describe");
		expect(tool.annotations?.readOnlyHint).toBe(true);
		expect(JSON.parse(result.content[0]?.text ?? "{}")).toEqual({
			page: "resume-dashboard",
			route: "/dashboard/resumes",
			params: {},
			search: { view: "grid" },
			capabilities: ["list_resumes"],
		});
	});
});
