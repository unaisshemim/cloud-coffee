import type { WebMcpParityToolName } from "./parity-tool-names";
import z from "zod";
import { resumePatchOperationsSchema } from "@reactive-resume/ai/tools/resume-tool-contracts";
import { applicationStatusSchema, contactSchema } from "@reactive-resume/schema/applications/data";
import { resumeDataSchema } from "@reactive-resume/schema/resume/data";
import { WEBMCP_PARITY_TOOL_NAMES } from "./parity-tool-names";

const statuses = ["saved", "applied", "screening", "interview", "offer", "rejected"] as const;
const documentKinds = ["resume", "cover-letter"] as const;
const sortKeys = ["lastUpdatedAt", "createdAt", "name"] as const;
const messageKinds = ["cover-letter", "follow-up"] as const;

const stringSchema = (description?: string) => ({
	type: "string",
	...(description ? { description } : {}),
});

const stringArraySchema = { type: "array", items: { type: "string" } };

const optionalNullableString = z.string().nullable().optional();
const httpUrl = z.string().trim().url().nullable().optional();
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const emptyObjectSchema = { type: "object", properties: {}, additionalProperties: false } as const;

export const resumeIdInputSchema = {
	type: "object",
	properties: { id: stringSchema("Resume ID.") },
	required: ["id"],
	additionalProperties: false,
} as const;

export const confirmableIdInputSchema = {
	type: "object",
	properties: { id: stringSchema("ID."), confirm: { type: "boolean" } },
	required: ["id"],
	additionalProperties: false,
} as const;

export const resumeIdInput = z.object({ id: z.string().min(1) }).strict();
export const confirmableIdInput = resumeIdInput.extend({ confirm: z.boolean().optional() }).strict();

export const patchInput = z
	.object({
		id: z.string().min(1),
		expectedUpdatedAt: z.string().datetime({ offset: true }).optional(),
		operations: resumePatchOperationsSchema,
	})
	.strict();

const resumeListInput = z
	.object({
		tags: z.array(z.string()).optional().default([]),
		sort: z.enum(sortKeys).optional().default("lastUpdatedAt"),
	})
	.optional()
	.default({ tags: [], sort: "lastUpdatedAt" });

const createResumeInput = z
	.object({
		name: z.string().min(1).max(64),
		slug: z.string().min(1).max(64),
		tags: z.array(z.string()).optional().default([]),
		withSampleData: z.boolean().optional().default(false),
	})
	.strict();

const updateResumeInput = z
	.object({
		id: z.string().min(1),
		name: z.string().min(1).max(64).optional(),
		slug: z.string().min(1).max(64).optional(),
		tags: z.array(z.string()).optional(),
		isPublic: z.boolean().optional(),
	})
	.strict();

const duplicateResumeInput = z
	.object({
		id: z.string().min(1),
		name: z.string().min(1).max(64),
		slug: z.string().min(1).max(64),
		tags: z.array(z.string()).optional().default([]),
	})
	.strict();

const downloadResumePdfInput = z
	.object({
		id: z.string().min(1),
		target: z.enum(documentKinds).optional().default("resume"),
	})
	.strict();

const setLockedInput = z.object({ id: z.string().min(1) }).strict();

const applicationMutableFields = {
	location: optionalNullableString,
	salary: optionalNullableString,
	source: optionalNullableString,
	sourceUrl: httpUrl,
	jobDescription: z.string().max(20_000).nullable().optional(),
	notes: z.string().nullable().optional(),
	resumeId: z.string().nullable().optional(),
	resumeFileUrl: z.string().nullable().optional(),
	resumeFileName: z.string().nullable().optional(),
	coverLetterUrl: z.string().nullable().optional(),
	coverLetterName: z.string().nullable().optional(),
	followUpAt: z.string().datetime({ offset: true }).nullable().optional(),
	followUpNote: z.string().nullable().optional(),
	contacts: z.array(contactSchema).optional(),
	tags: z.array(z.string()).optional(),
};

const applicationListInput = z
	.object({
		status: applicationStatusSchema.optional(),
		tags: z.array(z.string()).optional(),
		includeArchived: z.boolean().optional().default(false),
	})
	.optional()
	.default({ includeArchived: false });

const createApplicationInput = z
	.object({
		...applicationMutableFields,
		company: z.string().min(1),
		role: z.string().min(1),
		status: applicationStatusSchema.optional(),
		stageEnteredAt: dateString.optional(),
	})
	.strict();

const updateApplicationInput = z
	.object({
		...applicationMutableFields,
		id: z.string().min(1),
		company: z.string().min(1).optional(),
		role: z.string().min(1).optional(),
		status: applicationStatusSchema.optional(),
		archived: z.boolean().optional(),
	})
	.strict();

const addApplicationNoteInput = z
	.object({ id: z.string().min(1), text: z.string().trim().min(1), date: dateString.optional() })
	.strict();

const updateTimelineEntryInput = z
	.object({
		id: z.string().min(1),
		entryId: z.string().min(1),
		date: dateString.optional(),
		text: z.string().trim().min(1).optional(),
	})
	.refine((value) => value.date !== undefined || value.text !== undefined, "Provide date or text to update.");

const bulkUpdateApplicationsInput = z
	.object({
		ids: z.array(z.string()).min(1).max(200),
		status: applicationStatusSchema.optional(),
		archived: z.boolean().optional(),
		addTags: z.array(z.string()).optional(),
	})
	.strict();

const bulkDeleteApplicationsInput = z.object({
	ids: z.array(z.string()).min(1).max(200),
	confirm: z.boolean().optional(),
});

const attachApplicationDocumentInput = z
	.object({
		id: z.string().min(1),
		kind: z.enum(documentKinds),
		fileName: z.string().min(1),
		contentType: z.literal("application/pdf"),
		dataBase64: z.string().min(1),
	})
	.strict();

const draftApplicationMessageInput = z.object({ id: z.string().min(1), kind: z.enum(messageKinds) }).strict();

export const parityValidators = {
	list_resumes: resumeListInput,
	list_resume_tags: z.object({}).optional().default({}),
	read_resume: resumeIdInput,
	download_resume_pdf: downloadResumePdfInput,
	create_resume: createResumeInput,
	import_resume: z.object({ data: resumeDataSchema }).strict(),
	duplicate_resume: duplicateResumeInput,
	apply_resume_patch: patchInput,
	update_resume: updateResumeInput,
	delete_resume: confirmableIdInput,
	lock_resume: setLockedInput,
	unlock_resume: setLockedInput,
	get_resume_statistics: resumeIdInput,
	list_applications: applicationListInput,
	read_application: resumeIdInput,
	list_application_tags: z.object({}).optional().default({}),
	get_application_stats: z.object({}).optional().default({}),
	create_application: createApplicationInput,
	update_application: updateApplicationInput,
	add_application_note: addApplicationNoteInput,
	update_application_timeline_entry: updateTimelineEntryInput,
	delete_application_timeline_entry: confirmableIdInput.extend({ entryId: z.string().min(1) }).strict(),
	delete_application: confirmableIdInput,
	bulk_update_applications: bulkUpdateApplicationsInput,
	bulk_delete_applications: bulkDeleteApplicationsInput,
	import_applications: z.object({ items: z.array(createApplicationInput).min(1).max(500) }).strict(),
	attach_application_document: attachApplicationDocumentInput,
	remove_application_document: z.object({ id: z.string().min(1), kind: z.enum(documentKinds) }).strict(),
	autofill_application_from_job: z.object({ jobDescription: z.string().trim().min(1).max(20_000) }).strict(),
	score_application_match: resumeIdInput,
	tailor_resume_for_application: resumeIdInput,
	draft_application_message: draftApplicationMessageInput,
} satisfies Record<WebMcpParityToolName, z.ZodType>;

const enumSchema = (values: readonly string[]) => ({ type: "string", enum: [...values] });

const applicationFieldsSchema = {
	location: { ...stringSchema(), nullable: true },
	salary: { ...stringSchema(), nullable: true },
	source: { ...stringSchema(), nullable: true },
	sourceUrl: { ...stringSchema(), nullable: true },
	jobDescription: { ...stringSchema(), maxLength: 20_000, nullable: true },
	notes: { ...stringSchema(), nullable: true },
	resumeId: { ...stringSchema(), nullable: true },
	followUpAt: { ...stringSchema(), nullable: true },
	followUpNote: { ...stringSchema(), nullable: true },
	contacts: {
		type: "array",
		items: {
			type: "object",
			properties: { name: stringSchema(), role: stringSchema(), type: stringSchema() },
			required: ["name"],
		},
	},
	tags: stringArraySchema,
};

export const parityInputSchemas = {
	list_resumes: {
		type: "object",
		properties: { tags: stringArraySchema, sort: enumSchema(sortKeys) },
		additionalProperties: false,
	},
	list_resume_tags: emptyObjectSchema,
	read_resume: resumeIdInputSchema,
	download_resume_pdf: {
		type: "object",
		properties: { id: stringSchema(), target: enumSchema(documentKinds) },
		required: ["id"],
		additionalProperties: false,
	},
	create_resume: {
		type: "object",
		properties: {
			name: stringSchema(),
			slug: stringSchema(),
			tags: stringArraySchema,
			withSampleData: { type: "boolean" },
		},
		required: ["name", "slug"],
		additionalProperties: false,
	},
	import_resume: {
		type: "object",
		properties: { data: { type: "object" } },
		required: ["data"],
		additionalProperties: false,
	},
	duplicate_resume: {
		type: "object",
		properties: { id: stringSchema(), name: stringSchema(), slug: stringSchema(), tags: stringArraySchema },
		required: ["id", "name", "slug"],
		additionalProperties: false,
	},
	apply_resume_patch: {
		type: "object",
		properties: { id: stringSchema(), expectedUpdatedAt: stringSchema(), operations: { type: "array" } },
		required: ["id", "operations"],
		additionalProperties: false,
	},
	update_resume: {
		type: "object",
		properties: {
			id: stringSchema(),
			name: stringSchema(),
			slug: stringSchema(),
			tags: stringArraySchema,
			isPublic: { type: "boolean" },
		},
		required: ["id"],
		additionalProperties: false,
	},
	delete_resume: confirmableIdInputSchema,
	lock_resume: resumeIdInputSchema,
	unlock_resume: resumeIdInputSchema,
	get_resume_statistics: resumeIdInputSchema,
	list_applications: {
		type: "object",
		properties: { status: enumSchema(statuses), tags: stringArraySchema, includeArchived: { type: "boolean" } },
		additionalProperties: false,
	},
	read_application: resumeIdInputSchema,
	list_application_tags: emptyObjectSchema,
	get_application_stats: emptyObjectSchema,
	create_application: {
		type: "object",
		properties: {
			...applicationFieldsSchema,
			company: stringSchema(),
			role: stringSchema(),
			status: enumSchema(statuses),
			stageEnteredAt: stringSchema(),
		},
		required: ["company", "role"],
		additionalProperties: false,
	},
	update_application: {
		type: "object",
		properties: {
			...applicationFieldsSchema,
			id: stringSchema(),
			company: stringSchema(),
			role: stringSchema(),
			status: enumSchema(statuses),
			archived: { type: "boolean" },
		},
		required: ["id"],
		additionalProperties: false,
	},
	add_application_note: {
		type: "object",
		properties: { id: stringSchema(), text: stringSchema(), date: stringSchema() },
		required: ["id", "text"],
		additionalProperties: false,
	},
	update_application_timeline_entry: {
		type: "object",
		properties: { id: stringSchema(), entryId: stringSchema(), date: stringSchema(), text: stringSchema() },
		required: ["id", "entryId"],
		additionalProperties: false,
	},
	delete_application_timeline_entry: {
		type: "object",
		properties: { id: stringSchema(), entryId: stringSchema(), confirm: { type: "boolean" } },
		required: ["id", "entryId"],
		additionalProperties: false,
	},
	delete_application: confirmableIdInputSchema,
	bulk_update_applications: {
		type: "object",
		properties: {
			ids: stringArraySchema,
			status: enumSchema(statuses),
			archived: { type: "boolean" },
			addTags: stringArraySchema,
		},
		required: ["ids"],
		additionalProperties: false,
	},
	bulk_delete_applications: {
		type: "object",
		properties: { ids: stringArraySchema, confirm: { type: "boolean" } },
		required: ["ids"],
		additionalProperties: false,
	},
	import_applications: {
		type: "object",
		properties: { items: { type: "array" } },
		required: ["items"],
		additionalProperties: false,
	},
	attach_application_document: {
		type: "object",
		properties: {
			id: stringSchema(),
			kind: enumSchema(documentKinds),
			fileName: stringSchema(),
			contentType: { type: "string", const: "application/pdf" },
			dataBase64: stringSchema(),
		},
		required: ["id", "kind", "fileName", "contentType", "dataBase64"],
		additionalProperties: false,
	},
	remove_application_document: {
		type: "object",
		properties: { id: stringSchema(), kind: enumSchema(documentKinds) },
		required: ["id", "kind"],
		additionalProperties: false,
	},
	autofill_application_from_job: {
		type: "object",
		properties: { jobDescription: { ...stringSchema(), maxLength: 20_000 } },
		required: ["jobDescription"],
		additionalProperties: false,
	},
	score_application_match: resumeIdInputSchema,
	tailor_resume_for_application: resumeIdInputSchema,
	draft_application_message: {
		type: "object",
		properties: { id: stringSchema(), kind: enumSchema(messageKinds) },
		required: ["id", "kind"],
		additionalProperties: false,
	},
} satisfies Record<WebMcpParityToolName, Record<string, unknown>>;

if (Object.keys(parityInputSchemas).length !== WEBMCP_PARITY_TOOL_NAMES.length) {
	throw new Error("WebMCP parity schema count does not match parity tool names.");
}
