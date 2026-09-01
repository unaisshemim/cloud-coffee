import type { ResumeData } from "@reactive-resume/schema/resume/data";
import type { Template } from "@reactive-resume/schema/templates";

export function applyTemplatePreset(data: ResumeData, template: Template): void {
	data.metadata.template = template;

	if (template === "classic") {
		data.metadata.page.marginX = 32;
		data.metadata.page.marginY = 32;
		data.metadata.page.hideSectionIcons = true;
		data.metadata.design.colors.primary = "rgba(24, 24, 27, 1)";

		Object.assign(data.metadata.typography.body, {
			fontFamily: "Roboto",
			fontWeights: ["500", "600"],
			fontSize: 11,
			lineHeight: 1.5,
		});

		Object.assign(data.metadata.typography.heading, {
			fontFamily: "Roboto",
			fontWeights: ["600"],
		});

		return;
	}

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
