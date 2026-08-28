import { describe, expect, it } from "vitest";
import { defaultResumeData } from "@reactive-resume/schema/resume/default";
import { applyTemplatePreset } from "./preset";

describe("applyTemplatePreset", () => {
	it("applies the monochrome Classic preset", () => {
		const data = structuredClone(defaultResumeData);
		data.metadata.page.hideSectionIcons = false;

		applyTemplatePreset(data, "classic");

		expect(data.metadata.template).toBe("classic");
		expect(data.metadata.page).toMatchObject({ marginX: 32, marginY: 32, hideSectionIcons: true });
		expect(data.metadata.design.colors.primary).toBe("rgba(24, 24, 27, 1)");
		expect(data.metadata.typography.body).toMatchObject({
			fontFamily: "Roboto",
			fontWeights: ["400", "600"],
			fontSize: 9,
			lineHeight: 1.35,
		});
	});

	it("applies the editable Treecko preset", () => {
		const data = structuredClone(defaultResumeData);
		const headingSize = data.metadata.typography.heading.fontSize;
		const headingLineHeight = data.metadata.typography.heading.lineHeight;

		applyTemplatePreset(data, "treecko");

		expect(data.metadata.template).toBe("treecko");
		expect(data.metadata.page).toMatchObject({ marginX: 36, marginY: 36 });
		expect(data.metadata.design.colors.primary).toBe("rgba(0, 150, 137, 1)");
		expect(data.metadata.typography.body).toMatchObject({
			fontFamily: "Roboto",
			fontWeights: ["400", "600"],
			fontSize: 10,
			lineHeight: 1.45,
		});
		expect(data.metadata.typography.heading).toMatchObject({
			fontFamily: "Roboto",
			fontWeights: ["600"],
			fontSize: headingSize,
			lineHeight: headingLineHeight,
		});
	});
});
