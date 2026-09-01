import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { parseResumeData } from "@reactive-resume/schema/resume/data";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";

const mocks = vi.hoisted(() => ({
	generateJson: vi.fn(),
	getModel: vi.fn(() => ({})),
	getDefaultRunnable: vi.fn(),
	getProfileDocument: vi.fn(),
	createResume: vi.fn(),
}));

vi.mock("../ai/generate-json", () => ({ generateJson: mocks.generateJson }));
vi.mock("../ai/service", () => ({ getModel: mocks.getModel }));
vi.mock("../ai-providers/service", () => ({
	aiProvidersService: { getDefaultRunnable: mocks.getDefaultRunnable },
}));
vi.mock("../resume/service", () => ({ resumeService: { create: mocks.createResume } }));
vi.mock("./service", () => ({
	applicationProfileService: { getDocument: mocks.getProfileDocument },
}));

const { assembleTargetedResume, createTargetedResume, targetedResumePlanSchema } = await import("./targeted-resume");

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
	beforeEach(() => {
		vi.clearAllMocks();
	});

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

	it("instructs the model to produce truthful, ATS-aligned, impact-focused content", async () => {
		mocks.getProfileDocument.mockResolvedValue({ profile, revision: 1 });
		mocks.getDefaultRunnable.mockResolvedValue({ provider: "openai", model: "gpt-test", apiKey: "test" });
		mocks.generateJson.mockResolvedValue(plan);
		mocks.createResume.mockResolvedValue("resume-targeted");

		await createTargetedResume({
			userId: "user-1",
			locale: "en-US",
			data: {
				role: "Forward Deployed Engineer",
				company: "OpenAI",
				jobDescription: "Own customer deployments of production LLM systems.",
			},
		});

		const generationOptions = mocks.generateJson.mock.calls[0]?.[1];
		if (!generationOptions || typeof generationOptions !== "object" || !("prompt" in generationOptions)) {
			throw new Error("Targeted resume prompt was not generated.");
		}
		const prompt = generationOptions.prompt as string;
		expect(prompt).toMatch(/measurable accomplishments/i);
		expect(prompt).toMatch(/ATS/i);
		expect(prompt).toMatch(/keywords.*naturally/i);
		expect(prompt).toMatch(/transferable skills/i);
		expect(prompt).toMatch(/hiring manager/i);
		expect(prompt).toMatch(/do not invent.*metrics/i);
	});
});
