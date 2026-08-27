// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SMALL_SCREEN_MEDIA_QUERY, SmallScreenNotice } from "./small-screen-notice";

describe("SmallScreenNotice", () => {
	it("covers mobile and tablet widths", () => {
		expect(SMALL_SCREEN_MEDIA_QUERY).toBe("(max-width: 1023px)");
	});

	it("blocks the builder with the requested desktop-only message", () => {
		render(<SmallScreenNotice />);

		expect(screen.getByText("Resume Builder | Dashboard - Wobo AI")).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Screen Size Too Small" })).toBeInTheDocument();
		expect(
			screen.getByText(
				"The resume builder requires a larger screen for the best experience. Please use a laptop or desktop to access all features.",
			),
		).toBeInTheDocument();
	});
});
