import { describe, expect, it } from "vitest";
import {
	DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT,
	getBuilderPreviewPageScale,
	getNextBuilderPreviewPageLayout,
} from "./page-layout";

describe("DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT", () => {
	it("defaults to horizontal", () => {
		expect(DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT).toBe("horizontal");
	});
});

describe("getNextBuilderPreviewPageLayout", () => {
	it("returns vertical when given horizontal", () => {
		expect(getNextBuilderPreviewPageLayout("horizontal")).toBe("vertical");
	});

	it("returns horizontal when given vertical", () => {
		expect(getNextBuilderPreviewPageLayout("vertical")).toBe("horizontal");
	});

	it("is its own inverse", () => {
		const start: "horizontal" | "vertical" = "horizontal";
		const back = getNextBuilderPreviewPageLayout(getNextBuilderPreviewPageLayout(start));
		expect(back).toBe(start);
	});
});

describe("getBuilderPreviewPageScale", () => {
	it("fits the resume page to the preview width with compact side clearance", () => {
		expect(getBuilderPreviewPageScale(576, 595)).toBeCloseTo(528 / 595, 5);
	});

	it("does not upscale the resume beyond its natural size", () => {
		expect(getBuilderPreviewPageScale(900, 595)).toBe(1);
	});

	it("keeps a readable minimum scale in narrow containers", () => {
		expect(getBuilderPreviewPageScale(200, 595)).toBe(0.35);
	});
});
