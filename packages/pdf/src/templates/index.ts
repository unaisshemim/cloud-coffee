import type { Template } from "@reactive-resume/schema/templates";
import type { TemplatePage } from "../document";
import { TreeckoPage } from "./treecko/TreeckoPage";

export const templatePages: Record<Template, TemplatePage> = {
	treecko: TreeckoPage,
};

export const getTemplatePage = (template: Template): TemplatePage => templatePages[template];

export type { TemplateSemanticManifest } from "../semantic/template-manifest";
export {
	getTemplateSemanticBindingRegistry,
	getTemplateSemanticManifest,
	validateTemplateSemanticManifest,
} from "../semantic/template-manifest";
