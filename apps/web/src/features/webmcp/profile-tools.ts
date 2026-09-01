import type { ApplicationProfileCandidate } from "@reactive-resume/schema/application-profile";
import type { WebMcpTool, WebMcpToolResult } from "./types";
import { z } from "zod";
import { applicationProfileCandidateSchema } from "@reactive-resume/schema/application-profile";
import { client as defaultClient } from "@/libs/orpc/client";
import { errorMessage, webMcpError, webMcpJson } from "./results";

type MaybePromise<T> = T | Promise<T>;

type ProfileMergeOperation = { op: "replace"; path: string; value: unknown };

type ProfileClient = {
	applicationProfile: {
		get: () => MaybePromise<unknown>;
		previewMerge: (input: { candidate: ApplicationProfileCandidate }) => MaybePromise<unknown>;
		applyMerge: (input: {
			revision: number;
			operations: ProfileMergeOperation[];
			confirm: true;
		}) => MaybePromise<unknown>;
		createTargetedResume: (input: TargetedResumeInput) => MaybePromise<TargetedResumeResult>;
	};
};

type TargetedResumeInput = {
	jobDescription: string;
	role?: string;
	company?: string;
	baseResumeId?: string;
	name?: string;
	template?: string;
};

type TargetedResumeResult = { resumeId: string; name: string; builderUrl: string };

type CreateProfileToolsOptions = {
	client?: ProfileClient;
	navigate?: (options: { to: "/builder/$resumeId"; params: { resumeId: string } }) => unknown;
};

const operationSchema = z.object({ op: z.literal("replace"), path: z.string().startsWith("/"), value: z.unknown() });
const applySchema = z.object({
	revision: z.number().int().nonnegative(),
	operations: z.array(operationSchema).max(50),
	confirm: z.boolean().optional(),
});
const targetedResumeSchema = z.object({
	jobDescription: z.string().trim().min(1).max(20_000),
	role: z.string().trim().max(160).optional(),
	company: z.string().trim().max(160).optional(),
	baseResumeId: z.string().optional(),
	name: z.string().trim().min(1).max(60).optional(),
	template: z.string().optional(),
});

const emptyObjectSchema = { type: "object", additionalProperties: false };
const stringArraySchema = { type: "array", items: { type: "string" } };
const objectArraySchema = { type: "array", items: { type: "object", additionalProperties: true } };
const personalJsonSchema = {
	type: "object",
	description: "Canonical personal contact details. Store each detail once in its matching field.",
	properties: {
		firstName: { type: "string" },
		lastName: { type: "string" },
		email: { type: "string", description: "Single application email address." },
		phone: { type: "string", description: "Single application phone number, including country code when known." },
		country: { type: "string" },
		city: { type: "string" },
		state: { type: "string" },
		postalCode: { type: "string" },
		address: { type: "string" },
		links: {
			type: "object",
			properties: {
				linkedin: { type: "string" },
				github: { type: "string" },
				portfolio: { type: "string" },
				website: { type: "string" },
			},
			additionalProperties: false,
		},
	},
	additionalProperties: false,
};
const candidateJsonSchema = {
	type: "object",
	description: "Career facts extracted from a resume or conversation. Include only facts supported by the user.",
	properties: {
		careerSummary: { type: "string" },
		jobPreferences: { type: "object", additionalProperties: true },
		personal: personalJsonSchema,
		skills: stringArraySchema,
		languages: stringArraySchema,
		experience: objectArraySchema,
		education: objectArraySchema,
		projects: objectArraySchema,
		volunteer: objectArraySchema,
		certifications: objectArraySchema,
		awards: objectArraySchema,
		achievements: objectArraySchema,
		hackathons: objectArraySchema,
		publications: objectArraySchema,
		customFacts: objectArraySchema,
		workAuthorization: { type: "object", additionalProperties: true },
		screening: { type: "object", additionalProperties: true },
		equalOpportunity: { type: "object", additionalProperties: true },
	},
	additionalProperties: false,
};

type ToolDefinition = Omit<WebMcpTool, "execute"> & {
	execute: (input: unknown, client: ProfileClient) => Promise<WebMcpToolResult>;
};

function definitions(navigate?: CreateProfileToolsOptions["navigate"]): ToolDefinition[] {
	return [
		{
			name: "get_career_profile",
			title: "Get Career Profile",
			description: "Read the authenticated user's complete approved career knowledge base and current revision.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: true, untrustedContentHint: true },
			execute: async (_input, client) => webMcpJson(await client.applicationProfile.get()),
		},
		{
			name: "preview_profile_merge",
			title: "Preview Career Profile Changes",
			description:
				"Compare extracted career facts with the approved profile. Returns a reviewable patch without saving anything.",
			inputSchema: {
				type: "object",
				properties: { candidate: candidateJsonSchema },
				required: ["candidate"],
				additionalProperties: false,
			},
			annotations: { readOnlyHint: true, untrustedContentHint: true },
			execute: async (input, client) => {
				const parsed = z.object({ candidate: applicationProfileCandidateSchema }).parse(input);
				return webMcpJson(await client.applicationProfile.previewMerge(parsed));
			},
		},
		{
			name: "apply_profile_merge",
			title: "Apply Approved Career Profile Changes",
			description:
				"Apply an unchanged preview patch. Set confirm to true only after the user explicitly approves the proposed changes.",
			inputSchema: {
				type: "object",
				properties: {
					revision: { type: "integer", minimum: 0 },
					operations: {
						type: "array",
						maxItems: 50,
						items: {
							type: "object",
							properties: { op: { const: "replace" }, path: { type: "string" }, value: {} },
							required: ["op", "path", "value"],
							additionalProperties: false,
						},
					},
					confirm: { type: "boolean", description: "Must be true after explicit user approval." },
				},
				required: ["revision", "operations", "confirm"],
				additionalProperties: false,
			},
			execute: async (input, client) => {
				const parsed = applySchema.parse(input);
				if (parsed.confirm !== true) {
					return webMcpError("Profile changes require explicit user confirmation. Call again with confirm: true.");
				}
				return webMcpJson(await client.applicationProfile.applyMerge({ ...parsed, confirm: true }));
			},
		},
		{
			name: "create_targeted_resume",
			title: "Create Targeted Resume",
			description:
				"Create a truthful, ATS-aligned resume draft with impact-focused content tailored to a job description, using only approved career-profile facts.",
			inputSchema: {
				type: "object",
				properties: {
					jobDescription: { type: "string", minLength: 1, maxLength: 20_000 },
					role: { type: "string", maxLength: 160 },
					company: { type: "string", maxLength: 160 },
					baseResumeId: { type: "string" },
					name: { type: "string", minLength: 1, maxLength: 60 },
					template: { type: "string" },
				},
				required: ["jobDescription"],
				additionalProperties: false,
			},
			annotations: { untrustedContentHint: true },
			execute: async (input, client) => {
				const parsed = targetedResumeSchema.parse(input) as TargetedResumeInput;
				const result = await client.applicationProfile.createTargetedResume(parsed);
				navigate?.({ to: "/builder/$resumeId", params: { resumeId: result.resumeId } });
				return webMcpJson(result);
			},
		},
	];
}

export function createProfileTools(options: CreateProfileToolsOptions = {}): WebMcpTool[] {
	const client = options.client ?? (defaultClient as ProfileClient);
	return definitions(options.navigate).map((definition) => ({
		...definition,
		execute: async (input, options) => {
			const signal = options?.signal ?? new AbortController().signal;
			try {
				if (signal.aborted) throw new DOMException("WebMCP tool execution was aborted.", "AbortError");
				const result = await definition.execute(input, client);
				if (signal.aborted) throw new DOMException("WebMCP tool execution was aborted.", "AbortError");
				return result;
			} catch (error) {
				return webMcpError(errorMessage(error));
			}
		},
	}));
}
