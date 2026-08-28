import type { ApplicationProfile, ApplicationProfileCandidate } from "@reactive-resume/schema/application-profile";
import { createHash } from "node:crypto";
import { z } from "zod";
import { applicationProfileSchema } from "@reactive-resume/schema/application-profile";

export const profileMergeOperationSchema = z.object({
	op: z.literal("replace"),
	path: z.string(),
	value: z.unknown(),
});
export const profileMergeOperationsSchema = z.array(profileMergeOperationSchema).max(50);
export type ProfileMergeOperation = z.infer<typeof profileMergeOperationSchema>;

export type ProfileMergePreview = {
	revision: number;
	operations: ProfileMergeOperation[];
	summary: string[];
	profile: ApplicationProfile;
};

const allowedRoots = [
	"careerSummary",
	"jobPreferences",
	"personal",
	"skills",
	"languages",
	"experience",
	"education",
	"projects",
	"volunteer",
	"certifications",
	"awards",
	"achievements",
	"hackathons",
	"publications",
	"customFacts",
	"workAuthorization",
	"screening",
	"equalOpportunity",
] as const satisfies readonly (keyof ApplicationProfile)[];

const allowedRootSet = new Set<string>(allowedRoots);
type JsonRecord = Record<string, unknown>;

function normalizeString(value: string): string {
	return value.trim().replace(/\s+/g, " ");
}

function uniqueStrings(values: string[]): string[] {
	const seen = new Set<string>();
	return values.flatMap((value) => {
		const normalized = normalizeString(value);
		const key = normalized.toLocaleLowerCase();
		if (!normalized || seen.has(key)) return [];
		seen.add(key);
		return [normalized];
	});
}

function normalizeValue(value: unknown): unknown {
	if (typeof value === "string") return normalizeString(value);
	if (Array.isArray(value)) {
		return value.every((item) => typeof item === "string")
			? uniqueStrings(value as string[])
			: value.map(normalizeValue);
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeValue(nested)]));
	}
	return value;
}

function mergeRecord(current: JsonRecord, candidate: JsonRecord): JsonRecord {
	const merged = structuredClone(current);
	for (const [key, rawValue] of Object.entries(candidate)) {
		if (rawValue === undefined) continue;
		const value = normalizeValue(rawValue);
		if (typeof value === "string" && !value) continue;
		if (Array.isArray(value)) {
			merged[key] = value.every((item) => typeof item === "string")
				? uniqueStrings([...(Array.isArray(merged[key]) ? (merged[key] as string[]) : []), ...value])
				: value;
			continue;
		}
		if (value && typeof value === "object" && merged[key] && typeof merged[key] === "object") {
			merged[key] = mergeRecord(merged[key] as JsonRecord, value as JsonRecord);
			continue;
		}
		merged[key] = value;
	}
	return merged;
}

function stableId(kind: string, candidate: JsonRecord): string {
	const value = JSON.stringify(
		Object.fromEntries(
			Object.entries(candidate).filter(([key, item]) => key !== "id" && item !== "" && item !== undefined),
		),
	);
	return `${kind}_${createHash("sha256").update(`${kind}:${value}`).digest("hex").slice(0, 16)}`;
}

type MergeCollectionOptions = {
	kind: string;
	identity: (item: JsonRecord) => string;
	defaults: JsonRecord;
};

function mergeCollection(
	currentItems: readonly JsonRecord[],
	candidateItems: readonly JsonRecord[] | undefined,
	options: MergeCollectionOptions,
): JsonRecord[] {
	const result = structuredClone(currentItems) as JsonRecord[];
	for (const rawCandidate of candidateItems ?? []) {
		const candidate = normalizeValue(rawCandidate) as JsonRecord;
		const explicitId = typeof candidate.id === "string" ? candidate.id : "";
		const identity = options.identity(candidate);
		const index = result.findIndex((item) =>
			explicitId ? item.id === explicitId : Boolean(identity) && options.identity(item) === identity,
		);

		if (index >= 0) {
			result[index] = mergeRecord(result[index] ?? {}, candidate);
			continue;
		}

		result.push(
			mergeRecord(options.defaults, {
				...candidate,
				id: explicitId || stableId(options.kind, candidate),
			}),
		);
	}
	return result;
}

const datedDefaults = { startDate: "", endDate: "", current: false, description: "" };
const identity =
	(...keys: string[]) =>
	(item: JsonRecord) =>
		keys
			.map((key) => (typeof item[key] === "string" ? normalizeString(item[key] as string).toLocaleLowerCase() : ""))
			.join("|")
			.replace(/^\|+|\|+$/g, "");

export function previewProfileMerge(
	document: { profile: ApplicationProfile; revision: number },
	candidateInput: ApplicationProfileCandidate,
): ProfileMergePreview {
	const candidate = normalizeValue(candidateInput) as ApplicationProfileCandidate;
	const profile = structuredClone(document.profile);

	for (const key of ["careerSummary"] as const) {
		const value = candidate[key];
		if (typeof value === "string" && value) profile[key] = value;
	}
	for (const key of ["jobPreferences", "personal", "workAuthorization", "screening", "equalOpportunity"] as const) {
		const value = candidate[key];
		if (value) profile[key] = mergeRecord(profile[key] as JsonRecord, value as JsonRecord) as never;
	}
	for (const key of ["skills", "languages"] as const) {
		const values = candidate[key];
		if (values) profile[key] = uniqueStrings([...profile[key], ...values]);
	}

	profile.experience = mergeCollection(
		profile.experience as JsonRecord[],
		candidate.experience as JsonRecord[] | undefined,
		{
			kind: "experience",
			identity: identity("company", "title", "startDate"),
			defaults: { id: "", ...datedDefaults, title: "", company: "", location: "", highlights: [] },
		},
	) as ApplicationProfile["experience"];
	profile.education = mergeCollection(
		profile.education as JsonRecord[],
		candidate.education as JsonRecord[] | undefined,
		{
			kind: "education",
			identity: identity("institution", "degree", "startDate"),
			defaults: { id: "", ...datedDefaults, institution: "", degree: "", field: "", location: "" },
		},
	) as ApplicationProfile["education"];
	profile.projects = mergeCollection(profile.projects as JsonRecord[], candidate.projects as JsonRecord[] | undefined, {
		kind: "project",
		identity: identity("name", "startDate"),
		defaults: { id: "", ...datedDefaults, name: "", url: "", highlights: [] },
	}) as ApplicationProfile["projects"];
	profile.volunteer = mergeCollection(
		profile.volunteer as JsonRecord[],
		candidate.volunteer as JsonRecord[] | undefined,
		{
			kind: "volunteer",
			identity: identity("organization", "role", "startDate"),
			defaults: { id: "", ...datedDefaults, role: "", organization: "" },
		},
	) as ApplicationProfile["volunteer"];

	const credentialDefaults = { id: "", name: "", organization: "", issueDate: "", expiryDate: "", description: "" };
	for (const key of ["certifications", "awards"] as const) {
		profile[key] = mergeCollection(profile[key] as JsonRecord[], candidate[key] as JsonRecord[] | undefined, {
			kind: key.slice(0, -1),
			identity: identity("name", "organization", "issueDate"),
			defaults: credentialDefaults,
		}) as never;
	}
	profile.achievements = mergeCollection(
		profile.achievements as JsonRecord[],
		candidate.achievements as JsonRecord[] | undefined,
		{
			kind: "achievement",
			identity: identity("title"),
			defaults: {
				id: "",
				title: "",
				description: "",
				metrics: [],
				skills: [],
				relatedExperienceId: null,
				relatedProjectId: null,
			},
		},
	) as ApplicationProfile["achievements"];
	profile.hackathons = mergeCollection(
		profile.hackathons as JsonRecord[],
		candidate.hackathons as JsonRecord[] | undefined,
		{
			kind: "hackathon",
			identity: identity("event", "project", "date"),
			defaults: { id: "", event: "", project: "", date: "", placement: "", url: "", description: "", highlights: [] },
		},
	) as ApplicationProfile["hackathons"];
	profile.publications = mergeCollection(
		profile.publications as JsonRecord[],
		candidate.publications as JsonRecord[] | undefined,
		{
			kind: "publication",
			identity: identity("title", "publisher", "publicationDate"),
			defaults: { id: "", title: "", publisher: "", publicationDate: "", url: "", description: "" },
		},
	) as ApplicationProfile["publications"];
	profile.customFacts = mergeCollection(
		profile.customFacts as JsonRecord[],
		candidate.customFacts as JsonRecord[] | undefined,
		{
			kind: "fact",
			identity: identity("category", "label"),
			defaults: { id: "", category: "", label: "", value: "" },
		},
	) as ApplicationProfile["customFacts"];

	const parsed = applicationProfileSchema.parse(profile);
	const operations = allowedRoots.flatMap((key): ProfileMergeOperation[] =>
		JSON.stringify(document.profile[key]) === JSON.stringify(parsed[key])
			? []
			: [{ op: "replace", path: `/${key}`, value: parsed[key] }],
	);

	return {
		revision: document.revision,
		operations,
		summary: operations.map((operation) => `Update ${operation.path.slice(1)}`),
		profile: parsed,
	};
}

export function applyProfileMerge(
	profile: ApplicationProfile,
	operationsInput: ProfileMergeOperation[],
): ApplicationProfile {
	const operations = profileMergeOperationsSchema.parse(operationsInput);
	const next = structuredClone(profile) as ApplicationProfile;
	for (const operation of operations) {
		if (!operation.path.startsWith("/") || operation.path.includes("~") || operation.path.split("/").length !== 2) {
			throw new Error(`Profile merge path is not allowed: ${operation.path}`);
		}
		const root = operation.path.slice(1);
		if (!allowedRootSet.has(root)) throw new Error(`Profile merge path is not allowed: ${operation.path}`);
		(next as unknown as JsonRecord)[root] = structuredClone(operation.value);
	}
	return applicationProfileSchema.parse(next);
}
