import { describe, expect, it } from "vitest";
import { getClassicSectionIds } from "./ClassicPage";

describe("getClassicSectionIds", () => {
	it("merges authored columns into one ordered body and keeps summary in the header", () => {
		expect(getClassicSectionIds(["summary", "experience", "skills"], ["skills", "education"])).toEqual([
			"experience",
			"skills",
			"education",
		]);
	});
});
