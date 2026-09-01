import type { ProfileItem } from "@reactive-resume/schema/resume/data";
import { describe, expect, it } from "vitest";
import * as classicPage from "./ClassicPage";

const profile = (overrides: Partial<ProfileItem> = {}): ProfileItem => ({
	id: "profile-1",
	hidden: false,
	icon: "",
	iconColor: "",
	network: "LinkedIn",
	username: "",
	website: { url: "https://linkedin.com/in/unaisshemim", label: "", inlineLink: false },
	...overrides,
});

describe("getClassicSectionIds", () => {
	it("merges authored columns into one ordered body and keeps summary in the header", () => {
		expect(classicPage.getClassicSectionIds(["summary", "experience", "skills"], ["skills", "education"])).toEqual([
			"experience",
			"skills",
			"education",
		]);
	});

	it("moves profiles out of the body", () => {
		expect(classicPage.getClassicSectionIds(["profiles", "experience"], ["profiles", "skills"])).toEqual([
			"experience",
			"skills",
		]);
	});
});

describe("Classic header profiles", () => {
	it("keeps linked profiles and renders their readable host and path", () => {
		const getClassicHeaderProfiles = Reflect.get(classicPage, "getClassicHeaderProfiles") as unknown;
		const getClassicProfileDisplayText = Reflect.get(classicPage, "getClassicProfileDisplayText") as unknown;

		expect(getClassicHeaderProfiles).toBeTypeOf("function");
		expect(getClassicProfileDisplayText).toBeTypeOf("function");
		if (typeof getClassicHeaderProfiles !== "function" || typeof getClassicProfileDisplayText !== "function") return;

		expect(
			getClassicHeaderProfiles(
				[
					profile(),
					profile({ id: "hidden", hidden: true }),
					profile({ id: "blank", website: { url: "", label: "", inlineLink: false } }),
					profile({ id: "portfolio", website: { url: "https://unaiz.me/", label: "", inlineLink: false } }),
				],
				"https://unaiz.me",
			),
		).toEqual([profile()]);
		expect(getClassicProfileDisplayText(profile())).toBe("linkedin.com/in/unaisshemim");
	});
});
