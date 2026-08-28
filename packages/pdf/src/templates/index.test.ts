import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const registry = readFileSync(fileURLToPath(new URL("./index.ts", import.meta.url)), "utf8");

describe("templatePages", () => {
	it("registers Classic as a renderable template page", () => {
		expect(registry).toContain('import { ClassicPage } from "./classic/ClassicPage";');
		expect(registry).toContain("classic: ClassicPage");
	});

	it("registers Treecko as a renderable template page", () => {
		expect(registry).toContain('import { TreeckoPage } from "./treecko/TreeckoPage";');
		expect(registry).toContain("treecko: TreeckoPage");
	});

	it("exports the semantic manifest registry through the template index", () => {
		expect(registry).toContain("getTemplateSemanticManifest");
		expect(registry).toContain("TemplateSemanticManifest");
	});
});
