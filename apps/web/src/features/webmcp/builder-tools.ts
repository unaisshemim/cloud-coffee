import type { WebMcpTool } from "./types";
import { applyResumePatches } from "@reactive-resume/resume/patch";
import { useResumeStore } from "@/features/resume/builder/draft";
import { webMcpError, webMcpJson, webMcpText } from "./results";
import { emptyObjectSchema, patchInput } from "./schemas";

const currentResumeMissing = "No builder resume is loaded.";

export function createBuilderTools(): WebMcpTool[] {
	return [
		{
			name: "rr.builder.read_current_resume",
			title: "Read Current Builder Resume",
			description: "Read the resume currently loaded in the builder.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: true, untrustedContentHint: true },
			execute: () => {
				const resume = useResumeStore.getState().resume;
				if (!resume) return Promise.resolve(webMcpError(currentResumeMissing));
				return Promise.resolve(webMcpJson(resume));
			},
		},
		{
			name: "rr.builder.apply_patch",
			title: "Apply Patch To Current Builder Resume",
			description: "Apply JSON Patch operations to the current builder resume using the normal autosave path.",
			inputSchema: {
				type: "object",
				properties: { operations: { type: "array" } },
				required: ["operations"],
				additionalProperties: false,
			},
			annotations: { readOnlyHint: false, untrustedContentHint: true },
			execute: (input) => {
				const resume = useResumeStore.getState().resume;
				if (!resume) return Promise.resolve(webMcpError(currentResumeMissing));
				if (resume.isLocked) return Promise.resolve(webMcpError("This resume is locked and cannot be updated."));

				const parsed = patchInput.omit({ id: true, expectedUpdatedAt: true }).parse(input);
				const nextData = applyResumePatches(resume.data, parsed.operations);
				useResumeStore.getState().updateResumeData((draft) => Object.assign(draft, nextData));

				return Promise.resolve(webMcpJson(useResumeStore.getState().resume));
			},
		},
		{
			name: "rr.builder.undo",
			title: "Undo Builder Edit",
			description: "Undo the latest builder edit.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: () => {
				const { canUndo, undo } = useResumeStore.getState();
				if (!canUndo) return Promise.resolve(webMcpError("Nothing to undo."));
				undo();
				return Promise.resolve(webMcpText("Undid latest builder edit."));
			},
		},
		{
			name: "rr.builder.redo",
			title: "Redo Builder Edit",
			description: "Redo the latest undone builder edit.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: () => {
				const { canRedo, redo } = useResumeStore.getState();
				if (!canRedo) return Promise.resolve(webMcpError("Nothing to redo."));
				redo();
				return Promise.resolve(webMcpText("Redid builder edit."));
			},
		},
	];
}
