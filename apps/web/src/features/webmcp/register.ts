import type { WebMcpDocument, WebMcpTool } from "./types";

type RegisterWebMcpToolsOptions = {
	document?: Document;
};

type WebMcpRegistration = {
	supported: boolean;
	unregister: () => void;
};

export function hasWebMcpSupport(doc: Document = document): boolean {
	const webMcpDocument = doc as WebMcpDocument;
	return typeof webMcpDocument.modelContext?.registerTool === "function";
}

function assertUniqueToolNames(tools: WebMcpTool[]) {
	const seen = new Set<string>();

	for (const tool of tools) {
		if (seen.has(tool.name)) throw new Error(`Duplicate WebMCP tool name: ${tool.name}`);
		seen.add(tool.name);
	}
}

export function registerWebMcpTools(tools: WebMcpTool[], options: RegisterWebMcpToolsOptions = {}): WebMcpRegistration {
	assertUniqueToolNames(tools);

	const doc = options.document ?? (typeof document === "undefined" ? undefined : document);
	if (!doc || !hasWebMcpSupport(doc)) return { supported: false, unregister: () => {} };

	const controller = new AbortController();
	const modelContext = (doc as WebMcpDocument).modelContext;

	for (const tool of tools) {
		void modelContext?.registerTool(tool, { signal: controller.signal });
	}

	return {
		supported: true,
		unregister: () => controller.abort(),
	};
}
