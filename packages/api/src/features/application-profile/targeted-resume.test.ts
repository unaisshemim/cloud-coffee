import { describe, expect, it, vi } from "vitest";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { parseResumeData } from "@reactive-resume/schema/resume/data";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

vi.mock("../ai/service", () => ({ getModel: vi.fn() }));
vi.mock("../ai-providers/service", () => ({ aiProvidersService: {} }));
vi.mock("../resume/service", () => ({ resumeService: {} }));
vi.mock("./service", () => ({ applicationProfileService: {} }));

const { assembleTargetedResume, targetedResumePlanSchema } = await import("./targeted-resume");

const profile = {
	...defaultApplicationProfile,
	personal: { ...defaultApplicationProfile.personal, firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
	skills: ["TypeScript", "React"],
	experience: [
		{
			id: "experience-1",
			title: "Engineer",
			company: "Acme",
			location: "Remote",
			startDate: "2024-01",
			endDate: "",
			current: true,
			description: "Built workflow systems.",
			highlights: ["Reduced latency by 30%."],
		},
	],
};

const plan = targetedResumePlanSchema.parse({
	headline: "Product Engineer",
	summary: "Engineer building reliable workflow systems.",
	experience: [{ id: "experience-1", highlights: ["Reduced latency by 30%."] }],
	educationIds: [],
	projectIds: [],
	volunteerIds: [],
	certificationIds: [],
	awardIds: [],
	publicationIds: [],
	achievementIds: [],
	skills: ["TypeScript"],
	languages: [],
});

describe("targeted resume assembly", () => {
	it("builds valid resume data and copies only base design metadata", () => {
		const base = structuredClone(defaultResumeData);
		base.metadata.design.colors.primary = "rgba(1, 2, 3, 1)";
		base.basics.name = "Unapproved Name";

		const data = assembleTargetedResume({ profile, plan, baseData: base });

		expect(parseResumeData(data)).toEqual(data);
		expect(data.basics.name).toBe("Ada Lovelace");
		expect(data.metadata.design.colors.primary).toBe("rgba(1, 2, 3, 1)");
		expect(data.sections.experience.items[0]?.company).toBe("Acme");
	});

	it("rejects unknown source IDs", () => {
		expect(() =>
			assembleTargetedResume({
				profile,
				plan: { ...plan, experience: [{ id: "missing", highlights: [] }] },
			}),
		).toThrow(/unknown profile entry/i);
	});

	it("rejects metrics invented by rewritten content", () => {
		expect(() =>
			assembleTargetedResume({
				profile,
				plan: { ...plan, experience: [{ id: "experience-1", highlights: ["Reduced latency by 90%."] }] },
			}),
		).toThrow(/metric/i);
	});
});
