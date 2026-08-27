import { describe, expect, it } from "vitest";
import { getTreeckoSectionIds } from "./TreeckoPage";

describe("getTreeckoSectionIds", () => {
	it("merges main then sidebar without duplicates or body summary", () => {
		expect(getTreeckoSectionIds(["summary", "experience", "skills"], ["skills", "education"])).toEqual([
			"experience",
			"skills",
			"education",
		]);
	});

	it("preserves authored order when summary is absent", () => {
		expect(getTreeckoSectionIds(["projects", "experience"], ["profiles", "skills"])).toEqual([
			"projects",
			"experience",
			"profiles",
			"skills",
		]);
	});
});
