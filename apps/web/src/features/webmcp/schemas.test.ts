import { describe, expect, it } from "vitest";
import { WEBMCP_PARITY_TOOL_NAMES } from "./parity-tool-names";
import { emptyObjectSchema, parityInputSchemas, patchInput, resumeIdInput, resumeIdInputSchema } from "./schemas";

describe("WebMCP schemas", () => {
	it("defines JSON Schema for empty object inputs", () => {
		expect(emptyObjectSchema).toEqual({ type: "object", properties: {}, additionalProperties: false });
	});

	it("defines JSON Schema and Zod validation for resume ID inputs", () => {
		expect(resumeIdInputSchema.required).toEqual(["id"]);
		expect(resumeIdInput.parse({ id: "resume-1" })).toEqual({ id: "resume-1" });
		expect(() => resumeIdInput.parse({ id: "" })).toThrow();
	});

	it("validates JSON Patch tool inputs", () => {
		expect(
			patchInput.parse({ id: "resume-1", operations: [{ op: "replace", path: "/basics/name", value: "Ada" }] }),
		).toMatchObject({ id: "resume-1" });
		expect(() => patchInput.parse({ id: "resume-1", operations: [] })).toThrow();
	});

	it("has one input schema per existing MCP parity tool", () => {
		expect(Object.keys(parityInputSchemas).sort()).toEqual([...WEBMCP_PARITY_TOOL_NAMES].sort());
	});
});
