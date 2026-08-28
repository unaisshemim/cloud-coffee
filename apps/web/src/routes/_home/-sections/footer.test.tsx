// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

vi.stubGlobal("__APP_VERSION__", "9.9.9");

// The footer module evaluates `socialLinks = [{ label: t`...`, ... }]` at module
// scope. That `t` call needs an activated locale BEFORE the import, so do that
// here instead of in beforeAll.
i18n.loadAndActivate({ locale: "en", messages: {} });

const { Footer } = await import("./footer");

const renderFooter = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Footer />
		</I18nProvider>,
	);

describe("Footer", () => {
	it("renders career product navigation", () => {
		renderFooter();
		expect(screen.getAllByText("Career base").length).toBeGreaterThan(0);
		expect(screen.getByText("Product")).toBeInTheDocument();
	});

	it("removes GitHub and support links", () => {
		const { container } = renderFooter();
		const hrefs = Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).map((a) => a.href);
		expect(hrefs.some((href) => href.includes("github.com"))).toBe(false);
		expect(container).not.toHaveTextContent(/sponsor|support cloudcoffee|source code/i);
	});

	it("includes cloudcoffee version copy via Copyright", () => {
		renderFooter();
		// The version is wrapped in <bdi> for RTL isolation, so it is its own text node.
		expect(screen.getByText("9.9.9")).toBeInTheDocument();
	});
});
