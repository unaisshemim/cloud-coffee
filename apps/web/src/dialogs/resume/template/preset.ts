import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";

export function applyTemplatePreset(data: ResumeData, template: Template): void {
	data.metadata.template = template;
	data.metadata.page.marginX = 36;
	data.metadata.page.marginY = 36;
	data.metadata.design.colors.primary = "rgba(0, 150, 137, 1)";

	Object.assign(data.metadata.typography.body, {
		fontFamily: "Roboto",
		fontWeights: ["400", "600"],
		fontSize: 10,
		lineHeight: 1.45,
	});

	Object.assign(data.metadata.typography.heading, {
		fontFamily: "Roboto",
		fontWeights: ["600"],
	});
}
