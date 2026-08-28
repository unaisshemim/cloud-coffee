// @vitest-environment happy-dom

import type { PropsWithChildren } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

type LinkProps = PropsWithChildren<{ to: string }>;

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: LinkProps) => <a href={to}>{children}</a>,
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

const { Features } = await import("./features");

describe("Features", () => {
	it("presents career-memory capabilities without repository or template promotion", () => {
		render(
			<I18nProvider i18n={i18n}>
				<Features />
			</I18nProvider>,
		);

		expect(screen.getByRole("heading", { name: "Remember every career win." })).toBeInTheDocument();
		expect(screen.getByText("Connect your tools")).toBeInTheDocument();
		expect(screen.getByText("Tailor to any role")).toBeInTheDocument();
		expect(screen.getAllByText("WEBMCP.CONNECT").length).toBeGreaterThan(0);
		expect(screen.queryByText("MCP.CONNECT")).not.toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Career timeline" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "WebMCP connections" })).toBeInTheDocument();
		expect(screen.getByRole("heading", { name: "Resume matching" })).toBeInTheDocument();
		expect(screen.getAllByTestId("product-ui-card")).toHaveLength(3);
		expect(screen.queryByText("Open Source")).not.toBeInTheDocument();
		expect(screen.queryByText("12+ Templates")).not.toBeInTheDocument();
	});
});
