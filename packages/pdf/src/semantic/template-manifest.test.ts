import type { TemplateSemanticManifest } from "./template-manifest";
import { describe, expect, it } from "vitest";
import { TEMPLATE_PART_CHILD_KINDS_V1 } from "@reactive-resume/resume/stylesheet";
import { templateSchema } from "@reactive-resume/schema/templates";
import {
	getTemplateSemanticBindingRegistry,
	getTemplateSemanticManifest,
	validateTemplateSemanticManifest,
} from "./template-manifest";

describe("Treecko semantic manifest", () => {
	it("is the only registered template contract", () => {
		expect(templateSchema.options).toEqual(["treecko"]);
		expect(getTemplateSemanticManifest("treecko")).toEqual({
			template: "treecko",
			regions: [
				{ name: "header", placement: "main", origins: [] },
				{ name: "main", placement: "main", origins: ["main", "sidebar"] },
			],
			header: { region: "header", placement: "main" },
			specialSummary: { region: "header", placement: "main", source: "always" },
			parts: [
				expect.objectContaining({
					name: "item-header-row",
					key: "item-header-row",
					binding: { type: "primitive", primitive: "View", source: "existing" },
				}),
			],
		});
	});

	it("registers every primitive template part", () => {
		for (const part of getTemplateSemanticManifest("treecko").parts) {
			if (part.binding.type === "primitive") {
				expect(TEMPLATE_PART_CHILD_KINDS_V1).toHaveProperty(part.name);
			}
		}
	});

	it("publishes existing renderer bindings", () => {
		const registry = getTemplateSemanticBindingRegistry("treecko");
		const binding = registry["template-part"];
		expect(typeof binding).toBe("function");
	});

	it("freezes the renderer contract", () => {
		expect(Object.isFrozen(getTemplateSemanticManifest("treecko"))).toBe(true);
	});

	it("rejects mutations from the renderer contract", () => {
		const mutation = structuredClone(getTemplateSemanticManifest("treecko")) as TemplateSemanticManifest;
		(mutation.regions[1]?.origins as string[])[0] = "sidebar";
		expect(() => validateTemplateSemanticManifest(mutation)).toThrow(/frozen renderer contract/);
	});
});
