import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { WebMcpTool, WebMcpToolResult } from "./types";
import { getResumeExportData, resumeHasCoverLetter } from "@reactive-resume/resume/export-sections";
import { client as defaultClient } from "@/libs/orpc/client";
import { errorMessage, webMcpError, webMcpJson, webMcpText } from "./results";
import { parityInputSchemas, parityValidators } from "./schemas";

type MaybePromise<T> = T | Promise<T>;

type WebMcpClient = {
	resume: {
		list: (input: unknown) => MaybePromise<unknown>;
		tags: { list: () => MaybePromise<unknown> };
		getById: (input: { id: string }) => MaybePromise<{ data: ResumeData; name: string }>;
		create: (input: unknown) => MaybePromise<unknown>;
		import: (input: unknown) => MaybePromise<unknown>;
		duplicate: (input: unknown) => MaybePromise<unknown>;
		patch: (input: unknown) => MaybePromise<unknown>;
		update: (input: unknown) => MaybePromise<unknown>;
		delete: (input: { id: string }) => MaybePromise<unknown>;
		setLocked: (input: { id: string; isLocked: boolean }) => MaybePromise<unknown>;
		statistics: { getById: (input: { id: string }) => MaybePromise<unknown> };
	};
	applications: {
		list: (input: unknown) => MaybePromise<unknown>;
		getById: (input: { id: string }) => MaybePromise<unknown>;
		tags: () => MaybePromise<unknown>;
		stats: () => MaybePromise<unknown>;
		create: (input: unknown) => MaybePromise<unknown>;
		update: (input: unknown) => MaybePromise<unknown>;
		addNote: (input: unknown) => MaybePromise<unknown>;
		updateTimelineEntry: (input: unknown) => MaybePromise<unknown>;
		deleteTimelineEntry: (input: { id: string; entryId: string }) => MaybePromise<unknown>;
		delete: (input: { id: string }) => MaybePromise<unknown>;
		bulkUpdate: (input: unknown) => MaybePromise<unknown>;
		bulkDelete: (input: { ids: string[] }) => MaybePromise<unknown>;
		import: (input: unknown) => MaybePromise<unknown>;
		attachDocument: (input: { id: string; kind: "resume" | "cover-letter"; file: File }) => MaybePromise<unknown>;
		removeDocument: (input: unknown) => MaybePromise<unknown>;
		ai: {
			autofill: (input: unknown) => MaybePromise<unknown>;
			matchScore: (input: { id: string }) => MaybePromise<unknown>;
			tailorResume: (input: { id: string }) => MaybePromise<unknown>;
			draftMessage: (input: unknown) => MaybePromise<unknown>;
		};
	};
};

type CreateWebMcpParityToolsOptions = {
	client?: WebMcpClient;
};

type ToolDefinition = {
	title: string;
	description: string;
	readOnly?: boolean;
	untrusted?: boolean;
	execute: (input: unknown, context: { client: WebMcpClient; signal: AbortSignal }) => Promise<WebMcpToolResult>;
};

function assertNotAborted(signal: AbortSignal) {
	if (signal.aborted) throw new DOMException("WebMCP tool execution was aborted.", "AbortError");
}

function requireConfirmation(input: { confirm?: boolean }, label: string): WebMcpToolResult | null {
	if (input.confirm === true) return null;
	return webMcpError(`${label} is destructive. Call again with confirm: true after the user confirms this action.`);
}

function coerceFollowUpAt<T extends Record<string, unknown>>(input: T): T {
	if (!("followUpAt" in input) || input.followUpAt === null || input.followUpAt === undefined) return input;
	return { ...input, followUpAt: new Date(String(input.followUpAt)) } as T;
}

function coerceImportItems(input: { items: Record<string, unknown>[] }) {
	return { items: input.items.map((item) => coerceFollowUpAt(item)) };
}

function fileFromBase64(input: { fileName: string; contentType: "application/pdf"; dataBase64: string }): File {
	const binary = atob(input.dataBase64);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Decoded PDF must be 10MB or smaller.");
	return new File([bytes], input.fileName, { type: input.contentType });
}

async function buildPdfDownloadResult(client: WebMcpClient, input: { id: string; target: "resume" | "cover-letter" }) {
	const resume = await client.resume.getById({ id: input.id });
	if (input.target === "cover-letter" && !resumeHasCoverLetter(resume.data)) {
		throw new Error("Resume does not have cover letter content to export.");
	}

	const data = getResumeExportData(resume.data, input.target);
	const { createResumePdfBlob } = await import("@/features/resume/export/pdf-document");
	const blob = await createResumePdfBlob(
		data,
		undefined,
		input.target === "cover-letter" ? { includeCoverLetterHeader: true } : undefined,
	);
	const objectUrl =
		typeof URL !== "undefined" && typeof URL.createObjectURL === "function" ? URL.createObjectURL(blob) : null;

	return {
		resumeId: input.id,
		target: input.target,
		name: resume.name,
		downloadUrl: objectUrl,
		contentType: "application/pdf",
		size: blob.size,
	};
}

function defineTools(): Record<string, ToolDefinition> {
	return {
		list_resumes: {
			title: "List Resumes",
			description: "List resumes for the authenticated user.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.resume.list(parityValidators.list_resumes.parse(input))),
		},
		list_resume_tags: {
			title: "List Resume Tags",
			description: "List all resume tags for the authenticated user.",
			readOnly: true,
			untrusted: true,
			execute: async (_input, { client }) => webMcpJson(await client.resume.tags.list()),
		},
		read_resume: {
			title: "Read Resume",
			description: "Read one resume by ID.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.resume.getById(parityValidators.read_resume.parse(input))),
		},
		download_resume_pdf: {
			title: "Download Resume PDF",
			description: "Render a resume or cover letter PDF in the browser and return a local object URL when available.",
			readOnly: true,
			execute: async (input, { client }) =>
				webMcpJson(await buildPdfDownloadResult(client, parityValidators.download_resume_pdf.parse(input))),
		},
		create_resume: {
			title: "Create Resume",
			description: "Create a resume.",
			execute: async (input, { client }) =>
				webMcpJson({ id: await client.resume.create(parityValidators.create_resume.parse(input)) }),
		},
		import_resume: {
			title: "Import Resume",
			description: "Import a complete ResumeData JSON document.",
			execute: async (input, { client }) =>
				webMcpJson({ id: await client.resume.import(parityValidators.import_resume.parse(input)) }),
		},
		duplicate_resume: {
			title: "Duplicate Resume",
			description: "Duplicate an existing resume.",
			execute: async (input, { client }) =>
				webMcpJson({ id: await client.resume.duplicate(parityValidators.duplicate_resume.parse(input)) }),
		},
		apply_resume_patch: {
			title: "Apply Resume Patch",
			description: "Apply JSON Patch operations to resume data.",
			execute: async (input, { client }) =>
				webMcpJson(await client.resume.patch(parityValidators.apply_resume_patch.parse(input))),
		},
		update_resume: {
			title: "Update Resume",
			description: "Update resume metadata.",
			execute: async (input, { client }) =>
				webMcpJson(await client.resume.update(parityValidators.update_resume.parse(input))),
		},
		delete_resume: {
			title: "Delete Resume",
			description: "Delete a resume after explicit confirmation.",
			execute: async (input, { client }) => {
				const parsed = parityValidators.delete_resume.parse(input);
				const confirmationError = requireConfirmation(parsed, "delete_resume");
				if (confirmationError) return confirmationError;
				await client.resume.delete({ id: parsed.id });
				return webMcpText(`Deleted resume ${parsed.id}.`);
			},
		},
		lock_resume: {
			title: "Lock Resume",
			description: "Lock a resume.",
			execute: async (input, { client }) => {
				const { id } = parityValidators.lock_resume.parse(input);
				await client.resume.setLocked({ id, isLocked: true });
				return webMcpText(`Locked resume ${id}.`);
			},
		},
		unlock_resume: {
			title: "Unlock Resume",
			description: "Unlock a resume.",
			execute: async (input, { client }) => {
				const { id } = parityValidators.unlock_resume.parse(input);
				await client.resume.setLocked({ id, isLocked: false });
				return webMcpText(`Unlocked resume ${id}.`);
			},
		},
		get_resume_statistics: {
			title: "Get Resume Statistics",
			description: "Get resume view/download statistics.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.resume.statistics.getById(parityValidators.get_resume_statistics.parse(input))),
		},
		list_applications: {
			title: "List Applications",
			description: "List job applications.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.list(parityValidators.list_applications.parse(input))),
		},
		read_application: {
			title: "Read Application",
			description: "Read one job application by ID.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.getById(parityValidators.read_application.parse(input))),
		},
		list_application_tags: {
			title: "List Application Tags",
			description: "List all application tags.",
			readOnly: true,
			untrusted: true,
			execute: async (_input, { client }) => webMcpJson(await client.applications.tags()),
		},
		get_application_stats: {
			title: "Get Application Stats",
			description: "Get aggregate application stats.",
			readOnly: true,
			untrusted: true,
			execute: async (_input, { client }) => webMcpJson(await client.applications.stats()),
		},
		create_application: {
			title: "Create Application",
			description: "Create a job application.",
			execute: async (input, { client }) =>
				webMcpJson({
					id: await client.applications.create(
						coerceFollowUpAt(parityValidators.create_application.parse(input)) as never,
					),
				}),
		},
		update_application: {
			title: "Update Application",
			description: "Update a job application.",
			execute: async (input, { client }) =>
				webMcpJson(
					await client.applications.update(coerceFollowUpAt(parityValidators.update_application.parse(input)) as never),
				),
		},
		add_application_note: {
			title: "Add Application Note",
			description: "Add a note to an application timeline.",
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.addNote(parityValidators.add_application_note.parse(input))),
		},
		update_application_timeline_entry: {
			title: "Update Application Timeline Entry",
			description: "Update an application timeline entry.",
			execute: async (input, { client }) =>
				webMcpJson(
					await client.applications.updateTimelineEntry(
						parityValidators.update_application_timeline_entry.parse(input),
					),
				),
		},
		delete_application_timeline_entry: {
			title: "Delete Application Timeline Entry",
			description: "Delete an application timeline entry after explicit confirmation.",
			execute: async (input, { client }) => {
				const parsed = parityValidators.delete_application_timeline_entry.parse(input);
				const confirmationError = requireConfirmation(parsed, "delete_application_timeline_entry");
				if (confirmationError) return confirmationError;
				return webMcpJson(await client.applications.deleteTimelineEntry({ id: parsed.id, entryId: parsed.entryId }));
			},
		},
		delete_application: {
			title: "Delete Application",
			description: "Delete an application after explicit confirmation.",
			execute: async (input, { client }) => {
				const parsed = parityValidators.delete_application.parse(input);
				const confirmationError = requireConfirmation(parsed, "delete_application");
				if (confirmationError) return confirmationError;
				await client.applications.delete({ id: parsed.id });
				return webMcpText(`Deleted application ${parsed.id}.`);
			},
		},
		bulk_update_applications: {
			title: "Bulk Update Applications",
			description: "Bulk update job applications.",
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.bulkUpdate(parityValidators.bulk_update_applications.parse(input))),
		},
		bulk_delete_applications: {
			title: "Bulk Delete Applications",
			description: "Bulk delete applications after explicit confirmation.",
			execute: async (input, { client }) => {
				const parsed = parityValidators.bulk_delete_applications.parse(input);
				const confirmationError = requireConfirmation(parsed, "bulk_delete_applications");
				if (confirmationError) return confirmationError;
				return webMcpJson(await client.applications.bulkDelete({ ids: parsed.ids }));
			},
		},
		import_applications: {
			title: "Import Applications",
			description: "Import multiple applications.",
			execute: async (input, { client }) =>
				webMcpJson(
					await client.applications.import(
						coerceImportItems(parityValidators.import_applications.parse(input)) as never,
					),
				),
		},
		attach_application_document: {
			title: "Attach Application Document",
			description: "Attach a PDF document to an application.",
			execute: async (input, { client }) => {
				const parsed = parityValidators.attach_application_document.parse(input);
				const file = fileFromBase64(parsed);
				return webMcpJson(await client.applications.attachDocument({ id: parsed.id, kind: parsed.kind, file }));
			},
		},
		remove_application_document: {
			title: "Remove Application Document",
			description: "Remove an application document.",
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.removeDocument(parityValidators.remove_application_document.parse(input))),
		},
		autofill_application_from_job: {
			title: "Autofill Application From Job",
			description: "Extract application fields from a pasted job description.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.ai.autofill(parityValidators.autofill_application_from_job.parse(input))),
		},
		score_application_match: {
			title: "Score Application Match",
			description: "Score the linked resume against the application job description.",
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.ai.matchScore(parityValidators.score_application_match.parse(input))),
		},
		tailor_resume_for_application: {
			title: "Tailor Resume For Application",
			description:
				"Create and link a truthful, ATS-aligned resume with a job-specific professional summary for an application.",
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(
					await client.applications.ai.tailorResume(parityValidators.tailor_resume_for_application.parse(input)),
				),
		},
		draft_application_message: {
			title: "Draft Application Message",
			description: "Draft a cover letter or follow-up message for an application.",
			readOnly: true,
			untrusted: true,
			execute: async (input, { client }) =>
				webMcpJson(await client.applications.ai.draftMessage(parityValidators.draft_application_message.parse(input))),
		},
	};
}

export function createWebMcpParityTools(options: CreateWebMcpParityToolsOptions = {}): WebMcpTool[] {
	const client = options.client ?? (defaultClient as WebMcpClient);
	const definitions = defineTools();

	return Object.entries(definitions).map(([name, definition]) => ({
		name,
		title: definition.title,
		description: definition.description,
		inputSchema: parityInputSchemas[name as keyof typeof parityInputSchemas],
		annotations: {
			readOnlyHint: definition.readOnly ?? false,
			untrustedContentHint: definition.untrusted ?? false,
		},
		execute: async (input, options) => {
			const signal = options?.signal ?? new AbortController().signal;
			try {
				assertNotAborted(signal);
				const result = await definition.execute(input, { client, signal });
				assertNotAborted(signal);
				return result;
			} catch (error) {
				return webMcpError(errorMessage(error));
			}
		},
	}));
}
