import type { WebMcpTool } from "./types";
import { webMcpJson } from "./results";
import { emptyObjectSchema } from "./schemas";

type PageDescriptionInput = {
	page: string;
	route: string;
	params?: Record<string, unknown>;
	search?: Record<string, unknown>;
	capabilities?: string[];
};

export function createPageDescriptionTool(input: PageDescriptionInput): WebMcpTool {
	return {
		name: "rr.page.describe",
		title: "Describe Current Page",
		description: "Describe the current cloudcoffee page and available page-context capabilities.",
		inputSchema: emptyObjectSchema,
		annotations: { readOnlyHint: true, untrustedContentHint: false },
		execute: async () =>
			webMcpJson({
				page: input.page,
				route: input.route,
				params: input.params ?? {},
				search: input.search ?? {},
				capabilities: input.capabilities ?? [],
			}),
	};
}
