import { describe, expect, it } from "vitest";
import { applicationProfileSchema, defaultApplicationProfile } from "./application-profile";

describe("applicationProfileSchema", () => {
	it("accepts the complete default profile", () => {
		expect(applicationProfileSchema.safeParse(defaultApplicationProfile).success).toBe(true);
	});

	it("rejects malformed nested profile values", () => {
		const result = applicationProfileSchema.safeParse({
			...defaultApplicationProfile,
			jobPreferences: {
				...defaultApplicationProfile.jobPreferences,
				openToRelocation: "sometimes",
			},
		});

		expect(result.success).toBe(false);
	});

	it("accepts persisted application data from every workspace group", () => {
		const result = applicationProfileSchema.safeParse({
			...defaultApplicationProfile,
			jobPreferences: {
				...defaultApplicationProfile.jobPreferences,
				targetRoles: ["Forward Deployed Engineer"],
			},
			personal: { ...defaultApplicationProfile.personal, firstName: "Unais" },
			skills: ["TypeScript"],
			languages: ["English"],
			experience: [
				{
					id: "experience-1",
					title: "Founding Engineer",
					company: "i47Labs",
					location: "Bengaluru",
					startDate: "2024-01",
					endDate: "",
					current: true,
					description: "Built AI workflows.",
				},
			],
			equalOpportunity: { ...defaultApplicationProfile.equalOpportunity, pronouns: "He/Him" },
		});

		expect(result.success).toBe(true);
	});
});
