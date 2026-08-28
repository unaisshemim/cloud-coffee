// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
	React.PropsWithChildren<{
		hash?: string;
		to: string;
	}>;

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, hash, to, ...rest }: LinkProps) => (
		<a href={`${to}${hash ? `#${hash}` : ""}`} {...rest}>
			{children}
		</a>
	),
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

const { Header } = await import("./header");

const renderHeader = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Header />
		</I18nProvider>,
	);

describe("Header", () => {
	it("renders cloudcoffee navigation without display or GitHub controls", () => {
		renderHeader();

		expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "cloudcoffee - Go to homepage" })).toHaveAttribute("href", "/");
		expect(screen.getAllByText("How it works").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Career uses").length).toBeGreaterThan(0);
		expect(screen.getAllByText("ATS checker").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Resources").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Sign in").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Build career base").length).toBeGreaterThan(0);
		expect(screen.queryByLabelText("Change language")).not.toBeInTheDocument();
		expect(screen.queryByTestId("theme-toggle")).not.toBeInTheDocument();
		expect(screen.queryByText(/github/i)).not.toBeInTheDocument();
	});

	it("opens and closes mobile navigation", () => {
		renderHeader();

		fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
		expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
		expect(screen.getByText("FAQ")).toBeInTheDocument();

		fireEvent.keyDown(window, { key: "Escape" });
		expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
	});

	it("contracts into floating glass shell after scrolling", () => {
		Object.defineProperty(window, "scrollY", { configurable: true, value: 64 });
		renderHeader();
		fireEvent.scroll(window);

		expect(screen.getByTestId("landing-nav-shell")).toHaveAttribute("data-scrolled", "true");
	});
});
