// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Prefooter } from "./prefooter";

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: React.PropsWithChildren<{ to: string }>) => <a href={to}>{children}</a>,
}));

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

const renderPrefooter = () =>
	render(
		<I18nProvider i18n={i18n}>
			<Prefooter />
		</I18nProvider>,
	);

describe("Prefooter", () => {
	it("invites people to build their career base", () => {
		renderPrefooter();
		expect(screen.getByRole("heading", { name: "Your career already has the proof." })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /Build your career base/i })).toHaveAttribute("href", "/dashboard");
	});

	it("explains the career-memory workflow", () => {
		renderPrefooter();
		expect(screen.getByText(/Connect the work you've already done/)).toBeInTheDocument();
	});

	it("renders the decorative TextMaskEffect (svg)", () => {
		const { container } = renderPrefooter();
		expect(container.querySelector("svg")).not.toBeNull();
	});
});
