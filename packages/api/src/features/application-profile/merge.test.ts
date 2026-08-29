import { describe, expect, it } from "vitest";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { applyProfileMerge, previewProfileMerge } from "./merge";

describe("profile merge", () => {
	it("normalizes and deduplicates candidate values without mutating current profile", () => {
		const original = structuredClone(defaultApplicationProfile);
		const preview = previewProfileMerge(
			{ profile: original, revision: 3 },
			{
				skills: [" TypeScript ", "typescript", "React"],
				experience: [
					{
						title: " Engineer ",
						company: " Acme ",
						startDate: "2024-01",
						highlights: [" Cut latency by 30% ", "cut latency by 30%"],
					},
				],
			},
		);

		expect(preview.profile.skills).toEqual(["TypeScript", "React"]);
		expect(preview.profile.experience[0]).toMatchObject({
			title: "Engineer",
			company: "Acme",
			highlights: ["Cut latency by 30%"],
		});
		expect(preview.profile.experience[0]?.id).toMatch(/^experience_/);
		expect(original).toEqual(defaultApplicationProfile);
		expect(preview.revision).toBe(3);
		expect(preview.operations.every((operation) => operation.path !== "/version")).toBe(true);
	});

	it("does not erase populated values with empty candidate strings", () => {
		const profile = {
			...defaultApplicationProfile,
			careerSummary: "Experienced product engineer",
			personal: { ...defaultApplicationProfile.personal, city: "Bengaluru" },
		};

		const preview = previewProfileMerge({ profile, revision: 1 }, { careerSummary: " ", personal: { city: "" } });

		expect(preview.profile.careerSummary).toBe("Experienced product engineer");
		expect(preview.profile.personal.city).toBe("Bengaluru");
	});

	it("rejects operations outside the profile allowlist", () => {
		expect(() =>
			applyProfileMerge(defaultApplicationProfile, [{ op: "replace", path: "/version", value: 99 }]),
		).toThrow(/not allowed/i);
	});

	it("applies preview operations to produce the previewed profile", () => {
		const preview = previewProfileMerge(
			{ profile: defaultApplicationProfile, revision: 0 },
			{ careerSummary: "AI product engineer", languages: ["English"] },
		);

		expect(applyProfileMerge(defaultApplicationProfile, preview.operations)).toEqual(preview.profile);
	});
});
