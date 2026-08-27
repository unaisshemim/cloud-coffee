import type { WebMcpTool } from "./types";
import { webMcpError, webMcpJson, webMcpText } from "./results";
import { emptyObjectSchema, resumeIdInput, resumeIdInputSchema } from "./schemas";

type ResumeRow = {
	id: string;
	name: string;
	slug: string;
	tags: string[];
	isPublic: boolean;
	isLocked: boolean;
	updatedAt: Date | string;
};

type CreateResumeDashboardToolsInput = {
	resumes: ResumeRow[];
	navigate: (options: { to: "/builder/$resumeId"; params: { resumeId: string } }) => void | Promise<void>;
	openDialog: (type: "resume.create", data: undefined) => void;
};

function serializeResumeRow(resume: ResumeRow) {
	return {
		id: resume.id,
		name: resume.name,
		slug: resume.slug,
		tags: resume.tags,
		isPublic: resume.isPublic,
		isLocked: resume.isLocked,
		updatedAt: resume.updatedAt instanceof Date ? resume.updatedAt.toISOString() : resume.updatedAt,
	};
}

export function createResumeDashboardTools({
	resumes,
	navigate,
	openDialog,
}: CreateResumeDashboardToolsInput): WebMcpTool[] {
	return [
		{
			name: "rr.resumes.list_visible",
			title: "List Visible Resumes",
			description: "List resume rows visible on the current dashboard page.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: true, untrustedContentHint: true },
			execute: async () => webMcpJson(resumes.map(serializeResumeRow)),
		},
		{
			name: "rr.resumes.open",
			title: "Open Resume",
			description: "Open a visible resume in the builder.",
			inputSchema: resumeIdInputSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (input) => {
				const { id } = resumeIdInput.parse(input);
				if (!resumes.some((resume) => resume.id === id))
					return webMcpError(`Resume ${id} is not visible on this page.`);
				await navigate({ to: "/builder/$resumeId", params: { resumeId: id } });
				return webMcpText(`Opened resume ${id}.`);
			},
		},
		{
			name: "rr.resumes.start_create",
			title: "Start Create Resume",
			description: "Open the existing create-resume dialog.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: () => {
				openDialog("resume.create", undefined);
				return Promise.resolve(webMcpText("Opened create resume dialog."));
			},
		},
	];
}
