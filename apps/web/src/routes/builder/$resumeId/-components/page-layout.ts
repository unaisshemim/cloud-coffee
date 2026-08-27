export type BuilderPreviewPageLayout = "horizontal" | "vertical";

export const DEFAULT_BUILDER_PREVIEW_PAGE_LAYOUT: BuilderPreviewPageLayout = "horizontal";

const BUILDER_PREVIEW_SIDE_CLEARANCE = 48;

export const getBuilderPreviewPageScale = (viewportWidth: number, pageWidth: number) => {
	const widthScale = Math.max(1, viewportWidth - BUILDER_PREVIEW_SIDE_CLEARANCE) / pageWidth;
	return Math.max(0.35, Math.min(widthScale, 1));
};

export const getNextBuilderPreviewPageLayout = (pageLayout: BuilderPreviewPageLayout): BuilderPreviewPageLayout =>
	pageLayout === "horizontal" ? "vertical" : "horizontal";
