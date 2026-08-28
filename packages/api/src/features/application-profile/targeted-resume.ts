import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";
import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Locale } from "@reactive-resume/utils/locale";
import { createHash } from "node:crypto";
import { ORPCError } from "@orpc/client";
import { z } from "zod";
import { parseResumeData } from "@reactive-resume/schema/resume/data";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { templateSchema } from "@reactive-resume/schema/templates";
import { slugify } from "@reactive-resume/utils/string";
import { generateJson } from "../ai/generate-json";
import { getModel } from "../ai/service";
import { aiProvidersService } from "../ai-providers/service";
import { resumeService } from "../resume/service";
import { buildResumeSafeProfileContext } from "./resume-context";
import { applicationProfileService } from "./service";

const selectionSchema = z.object({ id: z.string(), highlights: z.array(z.string().max(500)).max(12) });

export const targetedResumePlanSchema = z.object({
	headline: z.string().max(240),
	summary: z.string().max(2_000),
	experience: z.array(selectionSchema).max(20),
	educationIds: z.array(z.string()).max(20),
	projectIds: z.array(z.string()).max(30),
	volunteerIds: z.array(z.string()).max(20),
	certificationIds: z.array(z.string()).max(30),
	awardIds: z.array(z.string()).max(30),
	publicationIds: z.array(z.string()).max(30),
	achievementIds: z.array(z.string()).max(30),
	skills: z.array(z.string()).max(50),
	languages: z.array(z.string()).max(20),
});
export type TargetedResumePlan = z.infer<typeof targetedResumePlanSchema>;

export const targetedResumeInputSchema = z.object({
	jobDescription: z.string().trim().min(1).max(20_000),
	role: z.string().trim().max(160).optional(),
	company: z.string().trim().max(160).optional(),
	baseResumeId: z.string().optional(),
	name: z.string().trim().min(1).max(60).optional(),
	template: templateSchema.optional(),
});
export type TargetedResumeInput = z.infer<typeof targetedResumeInputSchema>;

function stableId(kind: string, value: string): string {
	return `${kind}_${createHash("sha256").update(`${kind}:${value}`).digest("hex").slice(0, 16)}`;
}

function escapeHtml(value: string): string {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function richText(lines: string[], fallback = ""): string {
	const values = lines.map((line) => line.trim()).filter(Boolean);
	if (values.length > 0) return `<ul>${values.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
	return fallback.trim() ? `<p>${escapeHtml(fallback.trim())}</p>` : "";
}

function website(url: string) {
	return { url, label: "", inlineLink: false };
}

function period(startDate: string, endDate: string, current: boolean): string {
	return [startDate, current ? "Present" : endDate].filter(Boolean).join(" – ");
}

function selectByIds<T extends { id: string }>(items: T[], ids: string[], kind: string): T[] {
	const map = new Map(items.map((item) => [item.id, item]));
	return ids.map((id) => {
		const item = map.get(id);
		if (!item) throw new Error(`Unknown profile entry for ${kind}: ${id}`);
		return item;
	});
}

function numericClaims(value: string): string[] {
	return value.match(/\b\d+(?:[.,]\d+)?%?\b/g) ?? [];
}

function assertNoInventedMetrics(profile: ApplicationProfile, plan: TargetedResumePlan): void {
	const allowed = new Set(numericClaims(JSON.stringify(buildResumeSafeProfileContext(profile))));
	const generated = [plan.headline, plan.summary, ...plan.experience.flatMap((item) => item.highlights)];
	for (const claim of generated.flatMap(numericClaims)) {
		if (!allowed.has(claim)) throw new Error(`Generated resume contains a metric absent from the profile: ${claim}`);
	}
}

function resolveSelectedStrings(available: string[], selected: string[], kind: string): string[] {
	const lookup = new Map(available.map((value) => [value.toLocaleLowerCase(), value]));
	return selected.map((value) => {
		const canonical = lookup.get(value.toLocaleLowerCase());
		if (!canonical) throw new Error(`Unknown profile entry for ${kind}: ${value}`);
		return canonical;
	});
}

type AssembleTargetedResumeInput = {
	profile: ApplicationProfile;
	plan: TargetedResumePlan;
	baseData?: ResumeData;
	template?: z.infer<typeof templateSchema>;
};

export function assembleTargetedResume({ profile, plan, baseData, template }: AssembleTargetedResumeInput): ResumeData {
	assertNoInventedMetrics(profile, plan);
	const data = structuredClone(defaultResumeData);
	if (baseData) data.metadata = structuredClone(baseData.metadata);
	if (template) data.metadata.template = template;

	const fullName = [profile.personal.firstName, profile.personal.lastName].filter(Boolean).join(" ");
	data.basics = {
		...data.basics,
		name: fullName,
		headline: plan.headline,
		email: profile.personal.email,
		phone: profile.personal.phone,
		location: [profile.personal.city, profile.personal.state, profile.personal.country].filter(Boolean).join(", "),
		website: { url: profile.personal.links.portfolio || profile.personal.links.website, label: "" },
	};
	data.summary.content = richText([], plan.summary);

	data.sections.profiles.items = Object.entries(profile.personal.links).flatMap(([network, url]) =>
		url
			? [
					{
						id: stableId("profile", network),
						hidden: false,
						icon: "",
						iconColor: "",
						network,
						username: "",
						website: website(url),
					},
				]
			: [],
	);

	const experienceMap = new Map(profile.experience.map((item) => [item.id, item]));
	data.sections.experience.items = plan.experience.map((selection) => {
		const item = experienceMap.get(selection.id);
		if (!item) throw new Error(`Unknown profile entry for experience: ${selection.id}`);
		return {
			id: item.id,
			hidden: false,
			company: item.company,
			position: item.title,
			location: item.location,
			period: period(item.startDate, item.endDate, item.current),
			website: website(""),
			description: richText(selection.highlights.length ? selection.highlights : item.highlights, item.description),
			roles: [],
		};
	});
	data.sections.education.items = selectByIds(profile.education, plan.educationIds, "education").map((item) => ({
		id: item.id,
		hidden: false,
		school: item.institution,
		degree: item.degree,
		area: item.field,
		grade: "",
		location: item.location,
		period: period(item.startDate, item.endDate, item.current),
		website: website(""),
		description: richText([], item.description),
	}));
	data.sections.projects.items = selectByIds(profile.projects, plan.projectIds, "project").map((item) => ({
		id: item.id,
		hidden: false,
		name: item.name,
		period: period(item.startDate, item.endDate, item.current),
		website: website(item.url),
		description: richText(item.highlights, item.description),
	}));
	data.sections.volunteer.items = selectByIds(profile.volunteer, plan.volunteerIds, "volunteer").map((item) => ({
		id: item.id,
		hidden: false,
		organization: item.organization,
		location: "",
		period: period(item.startDate, item.endDate, item.current),
		website: website(""),
		description: richText([], [item.role, item.description].filter(Boolean).join(" — ")),
	}));
	data.sections.certifications.items = selectByIds(profile.certifications, plan.certificationIds, "certification").map(
		(item) => ({
			id: item.id,
			hidden: false,
			title: item.name,
			issuer: item.organization,
			date: item.issueDate,
			website: website(""),
			description: richText([], item.description),
		}),
	);
	data.sections.awards.items = selectByIds(profile.awards, plan.awardIds, "award").map((item) => ({
		id: item.id,
		hidden: false,
		title: item.name,
		awarder: item.organization,
		date: item.issueDate,
		website: website(""),
		description: richText([], item.description),
	}));
	data.sections.publications.items = selectByIds(profile.publications, plan.publicationIds, "publication").map(
		(item) => ({
			id: item.id,
			hidden: false,
			title: item.title,
			publisher: item.publisher,
			date: item.publicationDate,
			website: website(item.url),
			description: richText([], item.description),
		}),
	);
	data.sections.skills.items = resolveSelectedStrings(profile.skills, plan.skills, "skill").map((name) => ({
		id: stableId("skill", name),
		hidden: false,
		icon: "",
		iconColor: "",
		name,
		proficiency: "",
		level: 0,
		keywords: [],
	}));
	data.sections.languages.items = resolveSelectedStrings(profile.languages, plan.languages, "language").map(
		(language) => ({
			id: stableId("language", language),
			hidden: false,
			language,
			fluency: "",
			level: 0,
		}),
	);

	const achievements = selectByIds(profile.achievements, plan.achievementIds, "achievement");
	if (achievements.length > 0) {
		const sectionId = stableId("section", "key-achievements");
		data.customSections.push({
			id: sectionId,
			type: "summary",
			title: "Key Achievements",
			icon: "trophy",
			columns: 1,
			hidden: false,
			keepTogether: false,
			startOnNewPage: false,
			items: achievements.map((item) => ({ id: item.id, hidden: false, content: richText([], item.description) })),
		});
		data.metadata.layout.pages[0]?.main.push(sectionId);
	}

	return parseResumeData(data);
}

function hasCareerContent(profile: ApplicationProfile): boolean {
	return Boolean(
		profile.careerSummary ||
			profile.experience.length ||
			profile.education.length ||
			profile.projects.length ||
			profile.achievements.length,
	);
}

export async function createTargetedResume(input: {
	userId: string;
	locale: Locale;
	data: TargetedResumeInput;
}): Promise<{ resumeId: string; name: string; builderUrl: string }> {
	const { profile } = await applicationProfileService.getDocument({ userId: input.userId });
	if (!hasCareerContent(profile)) {
		throw new ORPCError("BAD_REQUEST", { message: "Add career experience or achievements before creating a resume." });
	}

	const provider = await aiProvidersService.getDefaultRunnable({ userId: input.userId });
	if (!provider) throw new ORPCError("BAD_REQUEST", { message: "No tested AI provider is available." });
	const model = getModel({
		provider: provider.provider,
		model: provider.model,
		apiKey: provider.apiKey,
		...(provider.baseURL ? { baseURL: provider.baseURL } : {}),
	});
	const baseResume = input.data.baseResumeId
		? await resumeService.getById({ id: input.data.baseResumeId, userId: input.userId })
		: undefined;
	const context = buildResumeSafeProfileContext(profile);
	const plan = await generateJson(
		model,
		{
			prompt: [
				"Create a job-targeted resume content plan using only the supplied career profile.",
				"Reference only IDs and exact skill/language names present in the profile.",
				"Do not invent employers, dates, credentials, education, metrics, or achievements.",
				`TARGET ROLE: ${input.data.role ?? ""}`,
				`TARGET COMPANY: ${input.data.company ?? ""}`,
				`JOB DESCRIPTION:\n${input.data.jobDescription}`,
				`CAREER PROFILE:\n${JSON.stringify(context)}`,
			].join("\n\n"),
		},
		targetedResumePlanSchema,
	);
	const resumeData = assembleTargetedResume({
		profile,
		plan,
		...(baseResume ? { baseData: baseResume.data } : {}),
		...(input.data.template ? { template: input.data.template } : {}),
	});
	const fallbackName =
		input.data.company && input.data.role
			? `Tailored — ${input.data.company} · ${input.data.role}`
			: input.data.role
				? `Tailored — ${input.data.role}`
				: "Targeted Resume";
	const name = (input.data.name ?? fallbackName).slice(0, 60);
	const resumeId = await resumeService.create({
		userId: input.userId,
		name,
		slug: `${slugify(name)}-${stableId("resume", `${Date.now()}`).slice(-6)}`,
		tags: ["tailored"],
		data: resumeData,
		locale: input.locale,
	});
	return { resumeId, name, builderUrl: `/builder/${resumeId}` };
}
