// @vitest-environment happy-dom

import type { WebMcpTool } from "./types";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWebMcpTools } from "./use-webmcp-tools";

const tool: WebMcpTool = {
	name: "rr.page.describe",
	description: "Describe page",
	inputSchema: { type: "object", properties: {} },
	execute: async () => ({ content: [{ type: "text", text: "ok" }] }),
};

describe("useWebMcpTools", () => {
	it("registers tools and aborts them on unmount", () => {
		const signals: AbortSignal[] = [];
		const registerTool = vi.fn((_tool, options: { signal: AbortSignal }) => {
			signals.push(options.signal);
		});
		Object.defineProperty(document, "modelContext", {
			configurable: true,
			value: { registerTool },
		});

		const { unmount } = renderHook(() => useWebMcpTools([tool]));

		expect(registerTool).toHaveBeenCalledTimes(1);
		expect(signals[0]?.aborted).toBe(false);

		unmount();

		expect(signals[0]?.aborted).toBe(true);
	});

	it("does not register tools when disabled", () => {
		const registerTool = vi.fn();
		Object.defineProperty(document, "modelContext", {
			configurable: true,
			value: { registerTool },
		});

		renderHook(() => useWebMcpTools([tool], false));

		expect(registerTool).not.toHaveBeenCalled();
	});
});
