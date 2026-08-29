import { describe, expect, it } from "vitest";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { buildResumeSafeProfileContext } from "./resume-context";

describe("resume-safe profile context", () => {
	it("excludes sensitive application data while retaining career evidence", () => {
		const profile = {
			...defaultApplicationProfile,
			careerSummary: "AI product engineer",
			eachievements: [
				{
					id: "achievement-1",
					title: "Latency reduction",
					description: "Reduced latency by 30%.",
					metrics: ["30%"],
					skills: ["TypeScript"],
					relatedExperienceId: null,
					relatedProjectId: null,
				},
			],
			jobPreferences: {
				...defaultApplicationProfile.jobPreferences,
				minimumSalary: { currency: "USD", amount: "200000", period: "year" },
			},
			equalOpportunity: { ...defaultApplicationProfile.equalOpportunity, veteranStatus: "Veteran" },
		};

		const context = buildResumeSafeProfileContext(profile);
		const serialized = JSON.stringify(context);

		expect(serialized).not.toContain("minimumSalary");
		expect(serialized).not.toContain("veteranStatus");
		expect(serialized).not.toContain("screening");
		expect(context.achievements).toEqual(profile.achievements);
	});
});
