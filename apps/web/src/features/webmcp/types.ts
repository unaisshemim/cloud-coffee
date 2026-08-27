export type WebMcpToolResultContent = { type: "text"; text: string };

export type WebMcpToolResult = {
	content: WebMcpToolResultContent[];
	isError?: boolean;
};

export type WebMcpToolAnnotations = {
	readOnlyHint?: boolean;
	untrustedContentHint?: boolean;
};

export type WebMcpTool = {
	name: string;
	title?: string;
	description: string;
	inputSchema: Record<string, unknown>;
	annotations?: WebMcpToolAnnotations;
	execute: (input: unknown, options?: WebMcpToolExecuteOptions) => Promise<WebMcpToolResult>;
};

export type WebMcpToolExecuteOptions = {
	signal: AbortSignal;
};

export type WebMcpRegisterToolOptions = {
	signal?: AbortSignal;
	exposedTo?: string[];
};

export type WebMcpModelContext = {
	registerTool: (tool: WebMcpTool, options?: WebMcpRegisterToolOptions) => void | Promise<void>;
};

export type WebMcpDocument = Document & {
	modelContext?: WebMcpModelContext;
};
