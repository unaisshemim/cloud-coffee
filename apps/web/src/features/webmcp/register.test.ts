import type { WebMcpTool } from "./types";
import { describe, expect, it, vi } from "vitest";
import { hasWebMcpSupport, registerWebMcpTools } from "./register";

const tool = (name: string): WebMcpTool => ({
	name,
	description: `${name} description`,
	inputSchema: { type: "object", properties: {} },
	execute: async () => ({ content: [{ type: "text", text: name }] }),
});

describe("hasWebMcpSupport", () => {
	it("returns false when document.modelContext is absent", () => {
		expect(hasWebMcpSupport({} as Document)).toBe(false);
	});

	it("returns true when document.modelContext.registerTool is callable", () => {
		const doc = { modelContext: { registerTool: vi.fn() } } as unknown as Document;
		expect(hasWebMcpSupport(doc)).toBe(true);
	});
});

describe("registerWebMcpTools", () => {
	it("returns an inert registration when WebMCP is unsupported", () => {
		const registration = registerWebMcpTools([tool("rr.page.describe")], { document: {} as Document });

		expect(registration.supported).toBe(false);
		expect(() => registration.unregister()).not.toThrow();
	});

	it("rejects duplicate tool names before browser registration", () => {
		const registerTool = vi.fn();
		const doc = { modelContext: { registerTool } } as unknown as Document;

		expect(() => registerWebMcpTools([tool("rr.page.describe"), tool("rr.page.describe")], { document: doc })).toThrow(
			/Duplicate WebMCP tool name/,
		);
		expect(registerTool).not.toHaveBeenCalled();
	});

	it("passes a shared abort signal to registrations and aborts it on cleanup", () => {
		const signals: AbortSignal[] = [];
		const registerTool = vi.fn((_tool, options: { signal: AbortSignal }) => {
			signals.push(options.signal);
			return Promise.resolve();
		});
		const doc = { modelContext: { registerTool } } as unknown as Document;

		const registration = registerWebMcpTools([tool("a"), tool("b")], { document: doc });

		expect(registration.supported).toBe(true);
		expect(registerTool).toHaveBeenCalledTimes(2);
		expect(signals).toHaveLength(2);
		expect(signals[0]).toBe(signals[1]);
		expect(signals[0]?.aborted).toBe(false);

		registration.unregister();

		expect(signals[0]?.aborted).toBe(true);
	});
});
