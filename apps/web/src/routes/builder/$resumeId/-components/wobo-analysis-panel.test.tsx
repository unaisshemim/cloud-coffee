// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WoboAnalysisPanel } from "./wobo-analysis-panel";

describe("WoboAnalysisPanel", () => {
	it("renders the approved static score presentation", () => {
		render(<WoboAnalysisPanel onOpenSection={vi.fn()} />);

		expect(screen.getByText("86")).toBeInTheDocument();
		expect(screen.getByText((_, element) => element?.textContent === "+2 pts recoverable")).toBeInTheDocument();
		for (const category of ["Content Quality", "Completeness", "Structure", "Language", "ATS"]) {
			expect(screen.getAllByText(category).length).toBeGreaterThan(0);
		}
	});

	it("opens a suggestion in its matching editor", () => {
		const onOpenSection = vi.fn();
		render(<WoboAnalysisPanel onOpenSection={onOpenSection} />);

		fireEvent.click(screen.getAllByRole("button", { name: "Open in editor" })[0]);
		expect(onOpenSection).toHaveBeenCalledWith("publications");
	});
});
