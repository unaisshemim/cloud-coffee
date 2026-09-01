import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { createProfileTools } from "./profile-tools";

const createClient = () => ({
	applicationProfile: {
		get: vi.fn(async () => ({ profile: defaultApplicationProfile, revision: 2 })),
		previewMerge: vi.fn(async () => ({
			profile: { ...defaultApplicationProfile, skills: ["TypeScript"] },
			revision: 2,
			operations: [{ op: "replace" as const, path: "/skills", value: ["TypeScript"] }],
			summary: ["Add skill: TypeScript"],
		})),
		applyMerge: vi.fn(async () => ({
			profile: { ...defaultApplicationProfile, skills: ["TypeScript"] },
			revision: 3,
		})),
		createTargetedResume: vi.fn(async () => ({
			resumeId: "resume-2",
			name: "Acme — Platform Engineer",
			builderUrl: "/builder/resume-2",
		})),
	},
});

describe("createProfileTools", () => {
	let client: ReturnType<typeof createClient>;
	let navigate: (options: { to: "/builder/$resumeId"; params: { resumeId: string } }) => void;

	beforeEach(() => {
		client = createClient();
		navigate = vi.fn<(options: { to: "/builder/$resumeId"; params: { resumeId: string } }) => void>();
	});

	it("exposes only career-profile workflow tools", () => {
		expect(createProfileTools({ client, navigate }).map((tool) => tool.name)).toEqual([
			"get_career_profile",
			"preview_profile_merge",
			"apply_profile_merge",
			"create_targeted_resume",
		]);
	});

	it("publishes one canonical email and phone field in the profile merge schema", () => {
		const tool = createProfileTools({ client, navigate }).find((item) => item.name === "preview_profile_merge");
		const properties = tool?.inputSchema.properties;
		if (!properties || typeof properties !== "object") throw new Error("Preview tool candidate schema is missing.");
		const candidate = (properties as Record<string, unknown>).candidate as {
			properties: Record<string, unknown>;
		};
		const personal = candidate.properties.personal as {
			additionalProperties: boolean;
			properties: Record<string, unknown>;
		};

		expect(personal.additionalProperties).toBe(false);
		expect(Object.keys(personal.properties)).toEqual([
			"firstName",
			"lastName",
			"email",
			"phone",
			"country",
			"city",
			"state",
			"postalCode",
			"address",
			"links",
		]);
		expect(personal.properties.email).toMatchObject({ type: "string" });
		expect(personal.properties.phone).toMatchObject({ type: "string" });
	});

	it("previews extracted facts without writing them", async () => {
		const tool = createProfileTools({ client, navigate }).find((item) => item.name === "preview_profile_merge");
		const result = await tool?.execute({ candidate: { skills: ["TypeScript"] } });

		expect(client.applicationProfile.previewMerge).toHaveBeenCalledWith({ candidate: { skills: ["TypeScript"] } });
		expect(client.applicationProfile.applyMerge).not.toHaveBeenCalled();
		expect(result?.content[0]?.text).toContain("Add skill: TypeScript");
	});

	it("blocks profile changes without explicit user confirmation", async () => {
		const tool = createProfileTools({ client, navigate }).find((item) => item.name === "apply_profile_merge");
		const result = await tool?.execute({
			revision: 2,
			operations: [{ op: "replace", path: "/skills", value: ["TypeScript"] }],
		});

		expect(client.applicationProfile.applyMerge).not.toHaveBeenCalled();
		expect(result?.isError).toBe(true);
		expect(result?.content[0]?.text).toMatch(/confirm/i);
	});

	it("applies approved operations against the preview revision", async () => {
		const tool = createProfileTools({ client, navigate }).find((item) => item.name === "apply_profile_merge");
		await tool?.execute({
			revision: 2,
			operations: [{ op: "replace", path: "/skills", value: ["TypeScript"] }],
			confirm: true,
		});

		expect(client.applicationProfile.applyMerge).toHaveBeenCalledWith({
			revision: 2,
			operations: [{ op: "replace", path: "/skills", value: ["TypeScript"] }],
			confirm: true,
		});
	});

	it("creates a new targeted draft and opens its builder", async () => {
		const tool = createProfileTools({ client, navigate }).find((item) => item.name === "create_targeted_resume");
		expect(tool?.description).toMatch(/ATS/i);
		expect(tool?.description).toMatch(/impact/i);
		const result = await tool?.execute({ jobDescription: "Build a reliable TypeScript platform.", company: "Acme" });

		expect(client.applicationProfile.createTargetedResume).toHaveBeenCalledWith({
			jobDescription: "Build a reliable TypeScript platform.",
			company: "Acme",
		});
		expect(navigate).toHaveBeenCalledWith({ to: "/builder/$resumeId", params: { resumeId: "resume-2" } });
		expect(result?.content[0]?.text).toContain("resume-2");
	});
});
