import type { ProfileItem } from "@reactive-resume/schema/resume/data";
import { describe, expect, it } from "vitest";
import * as treeckoPage from "./TreeckoPage";

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

describe("getTreeckoSectionIds", () => {
	it("merges main then sidebar without duplicates or body summary", () => {
		expect(treeckoPage.getTreeckoSectionIds(["summary", "experience", "skills"], ["skills", "education"])).toEqual([
			"experience",
			"skills",
			"education",
		]);
	});

	it("moves profiles out of the body while preserving other authored sections", () => {
		expect(treeckoPage.getTreeckoSectionIds(["projects", "profiles", "experience"], ["profiles", "skills"])).toEqual([
			"projects",
			"experience",
			"skills",
		]);
	});
});

describe("Treecko header profiles", () => {
	it("keeps only visible linked profiles and removes the duplicated primary website", () => {
		const getTreeckoHeaderProfiles = Reflect.get(treeckoPage, "getTreeckoHeaderProfiles") as unknown;

		expect(getTreeckoHeaderProfiles).toBeTypeOf("function");
		if (typeof getTreeckoHeaderProfiles !== "function") return;

		expect(
			getTreeckoHeaderProfiles(
				[
					profile(),
					profile({
						id: "hidden",
						hidden: true,
						website: { url: "https://github.com/hidden", label: "", inlineLink: false },
					}),
					profile({ id: "blank", website: { url: "", label: "", inlineLink: false } }),
					profile({
						id: "portfolio",
						website: { url: "https://unaiz.me/", label: "", inlineLink: false },
					}),
				],
				"https://unaiz.me",
			),
		).toEqual([profile()]);
	});

	it("renders a long readable host and path instead of the network label", () => {
		const getTreeckoProfileDisplayText = Reflect.get(treeckoPage, "getTreeckoProfileDisplayText") as unknown;

		expect(getTreeckoProfileDisplayText).toBeTypeOf("function");
		if (typeof getTreeckoProfileDisplayText !== "function") return;

		expect(getTreeckoProfileDisplayText(profile())).toBe("linkedin.com/in/unaisshemim");
		expect(
			getTreeckoProfileDisplayText(
				profile({ website: { url: "http://github.com/unaisshemim/", label: "GitHub", inlineLink: false } }),
			),
		).toBe("github.com/unaisshemim");
	});
});
