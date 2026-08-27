import type { WebMcpTool } from "./types";
import { webMcpError, webMcpJson, webMcpText } from "./results";
import { emptyObjectSchema, resumeIdInput, resumeIdInputSchema } from "./schemas";

type ApplicationRow = {
	id: string;
	[key: string]: unknown;
};

type NavigateSearch = (options: {
	search: (previous: Record<string, unknown>) => Record<string, unknown>;
}) => void | Promise<void>;

type CreateApplicationToolsInput = {
	applications: ApplicationRow[];
	navigate: NavigateSearch;
	openCreate: () => void;
};

export function createApplicationTools({
	applications,
	navigate,
	openCreate,
}: CreateApplicationToolsInput): WebMcpTool[] {
	return [
		{
			name: "rr.applications.list_visible",
			title: "List Visible Applications",
			description: "List application rows visible on the current dashboard page.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: true, untrustedContentHint: true },
			execute: async () => webMcpJson(applications),
		},
		{
			name: "rr.applications.open",
			title: "Open Application",
			description: "Open a visible application in the dashboard detail sheet.",
			inputSchema: resumeIdInputSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: async (input) => {
				const { id } = resumeIdInput.parse(input);
				if (!applications.some((application) => application.id === id))
					return webMcpError(`Application ${id} is not visible on this page.`);
				await navigate({ search: (previous) => ({ ...previous, applicationId: id }) });
				return webMcpText(`Opened application ${id}.`);
			},
		},
		{
			name: "rr.applications.start_create",
			title: "Start Create Application",
			description: "Open the existing create-application flow.",
			inputSchema: emptyObjectSchema,
			annotations: { readOnlyHint: false, untrustedContentHint: false },
			execute: () => {
				openCreate();
				return Promise.resolve(webMcpText("Opened create application flow."));
			},
		},
	];
}
