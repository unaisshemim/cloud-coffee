import type { WebMcpToolResult } from "./types";

export const webMcpText = (text: string): WebMcpToolResult => ({ content: [{ type: "text", text }] });

export const webMcpJson = (value: unknown): WebMcpToolResult => webMcpText(JSON.stringify(value, null, 2));

export const webMcpError = (message: string): WebMcpToolResult => ({ ...webMcpText(message), isError: true });

export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}
