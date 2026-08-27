import { describe, expect, it } from "vitest";
import { webMcpError, webMcpJson, webMcpText } from "./results";

describe("WebMCP result helpers", () => {
	it("creates text results", () => {
		expect(webMcpText("hello")).toEqual({ content: [{ type: "text", text: "hello" }] });
	});

	it("creates pretty JSON text results", () => {
		expect(webMcpJson({ ok: true })).toEqual({ content: [{ type: "text", text: '{\n  "ok": true\n}' }] });
	});

	it("marks error results", () => {
		expect(webMcpError("bad")).toEqual({ isError: true, content: [{ type: "text", text: "bad" }] });
	});
});
