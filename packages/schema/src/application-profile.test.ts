import { describe, expect, it } from "vitest";
import {
	applicationProfileCandidateSchema,
	applicationProfileSchema,
	defaultApplicationProfile,
	parseApplicationProfile,
} from "./application-profile";

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
					highlights: ["Shipped reliable agent workflows."],
				},
			],
			equalOpportunity: { ...defaultApplicationProfile.equalOpportunity, pronouns: "He/Him" },
		});

		expect(result.success).toBe(true);
	});

	it("migrates version 1 profiles without losing existing career data", () => {
		const version1 = {
			...defaultApplicationProfile,
			version: 1,
			experience: [
				{
					id: "experience-1",
					title: "Engineer",
					company: "Acme",
					location: "Remote",
					startDate: "2024-01",
					endDate: "",
					current: true,
					description: "Built reliable systems.",
				},
			],
			projects: [],
		};

		const migrated = parseApplicationProfile(version1);

		expect(migrated.version).toBe(2);
		expect(migrated.experience[0]).toMatchObject({
			id: "experience-1",
			description: "Built reliable systems.",
			highlights: [],
		});
		expect(migrated.achievements).toEqual([]);
		expect(migrated.hackathons).toEqual([]);
	});

	it("accepts partial extracted candidates without collection IDs", () => {
		const result = applicationProfileCandidateSchema.safeParse({
			careerSummary: "Product engineer focused on AI workflows.",
			skills: ["TypeScript"],
			experience: [{ title: "Engineer", company: "Acme", highlights: ["Cut latency by 30%"] }],
			hackathons: [{ event: "HackX", project: "Career Copilot" }],
		});

		expect(result.success).toBe(true);
	});
});
