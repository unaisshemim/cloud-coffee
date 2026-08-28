import type { TemplateSemanticManifest } from "../../semantic/template-manifest";
import { itemHeaderRowPart } from "../../semantic/shared-parts";

export const classicSemanticManifest = {
	template: "classic",
	regions: [
		{ name: "header", placement: "main", origins: [] },
		{ name: "main", placement: "main", origins: ["main", "sidebar"] },
	],
	header: { region: "header", placement: "main" },
	specialSummary: { region: "header", placement: "main", source: "always" },
	parts: [itemHeaderRowPart],
} as const satisfies TemplateSemanticManifest;
