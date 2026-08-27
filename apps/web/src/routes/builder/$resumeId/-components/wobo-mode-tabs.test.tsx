// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({}),
	useResumeStore: () => "saved",
}));
vi.mock("@/features/resume/export/download-dialog", () => ({
	ResumeDownloadDialog: () => null,
}));
vi.mock("@/features/theme/toggle-button", () => ({
	ThemeToggleButton: () => null,
}));

const { WoboModeTabs } = await import("./wobo-builder-header");

describe("WoboModeTabs", () => {
	it("renders three workspace modes and reports selection", () => {
		const onModeChange = vi.fn();
		render(<WoboModeTabs mode="content" onModeChange={onModeChange} />);

		expect(screen.getByRole("tab", { name: "Content" })).toHaveAttribute("aria-selected", "true");
		expect(screen.getByRole("tab", { name: "Design" })).toHaveAttribute("aria-selected", "false");
		expect(screen.getByRole("tab", { name: "Analysis" })).toHaveAttribute("aria-selected", "false");

		fireEvent.click(screen.getByRole("tab", { name: "Design" }));
		expect(onModeChange).toHaveBeenCalledWith("design");
	});
});
