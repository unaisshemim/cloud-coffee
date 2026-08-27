// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PageNavigator } from "./page-navigator";

describe("PageNavigator", () => {
	it("moves between pages and disables boundary controls", () => {
		const onPageChange = vi.fn();
		const view = render(<PageNavigator currentPage={1} totalPages={2} onPageChange={onPageChange} />);

		expect(screen.getByText("1 / 2")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Next page" }));
		expect(onPageChange).toHaveBeenCalledWith(2);

		view.rerender(<PageNavigator currentPage={2} totalPages={2} onPageChange={onPageChange} />);
		expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
		expect(onPageChange).toHaveBeenCalledWith(1);
	});
});
