// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const updateResumeData = vi.fn((callback: (draft: typeof data) => void) => callback(data));
const data = {
	metadata: {
		template: "treecko",
		page: { format: "a4", marginX: 36, marginY: 36 },
		typography: { body: { fontFamily: "Roboto", fontSize: 10, lineHeight: 1.45 } },
		design: { colors: { primary: "rgba(0, 150, 137, 1)" } },
	},
};

vi.mock("@/features/resume/builder/draft", () => ({
	useCurrentResume: () => ({ data }),
	useUpdateResumeData: () => updateResumeData,
}));

const { WoboDesignPanel } = await import("./wobo-design-panel");

describe("WoboDesignPanel", () => {
	it("renders the approved layout and typography controls", () => {
		render(<WoboDesignPanel />);

		expect(screen.getByRole("heading", { name: "Layout" })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Classic template Classic/ })).toHaveAttribute("aria-pressed", "false");
		expect(screen.getByRole("button", { name: /Treecko template Treecko/ })).toHaveAttribute("aria-pressed", "true");
		expect(screen.getByLabelText("Page Size")).toHaveValue("a4");
		expect(screen.getByLabelText("Top & Bottom Margin")).toHaveValue("36");
		expect(screen.getByLabelText("Side Margins")).toHaveValue("36");
		expect(screen.getByLabelText("Font Family")).toHaveValue("Roboto");
		expect(screen.getByLabelText("Line Height")).toHaveValue("1.45");
		expect(screen.getByLabelText("Date Format")).toHaveValue("01/2014");
	});

	it("applies the selected template preset", () => {
		render(<WoboDesignPanel />);
		fireEvent.click(screen.getByRole("button", { name: /Classic template Classic/ }));

		expect(updateResumeData).toHaveBeenCalled();
		expect(data.metadata.template).toBe("classic");
		expect(data.metadata.page).toMatchObject({ marginX: 32, marginY: 32 });
	});

	it("writes margin changes through the resume update hook", () => {
		render(<WoboDesignPanel />);
		fireEvent.change(screen.getByLabelText("Side Margins"), { target: { value: "42" } });
		expect(updateResumeData).toHaveBeenCalled();
		expect(data.metadata.page.marginX).toBe(42);
	});
});
