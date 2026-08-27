import type { MessageDescriptor } from "@lingui/core";
import type { Template } from "@reactive-resume/schema/templates";
import { msg } from "@lingui/core/macro";

export type TemplateMetadata = {
	name: string;
	description: MessageDescriptor;
	imageUrl: string;
	tags: string[];
	sidebarPosition: "left" | "right" | "none";
};

export const templates = {
	treecko: {
		name: "Treecko",
		description: msg`Single-column with teal headings, a compact contact grid, and generous margins; optimized for ATS-friendly technical and operations resumes.`,
		imageUrl: "/templates/jpg/treecko.jpg",
		tags: ["Single-column", "ATS friendly", "Minimal", "Technical", "Operations", "Teal accent"],
		sidebarPosition: "none",
	},
} as const satisfies Record<Template, TemplateMetadata>;
