// @vitest-environment happy-dom

import type { PropsWithChildren } from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

type LinkProps = PropsWithChildren<{
	to: string;
}>;

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to, ...rest }: LinkProps) => (
		<a href={to} {...rest}>
			{children}
		</a>
	),
}));

vi.mock("@/components/animation/comet-card", () => ({
	CometCard: ({ children }: PropsWithChildren) => <div>{children}</div>,
}));

vi.mock("@/components/animation/spotlight", () => ({
	Spotlight: () => <div data-testid="spotlight" />,
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

const { Hero } = await import("./hero");

describe("Hero", () => {
	it("shows the editorial career collage with animated ASCII details", () => {
		const { container, getAllByTestId, getByRole } = render(
			<I18nProvider i18n={i18n}>
				<Hero />
			</I18nProvider>,
		);

		const artwork = getByRole("img", {
			name: "An editorial career collage with a data crystal and a flying laptop",
		});

		expect(artwork).toHaveAttribute("src", "/images/landing/career-collage-hero-v2.webp");
		expect(artwork).toHaveClass("w-[210%]", "object-contain", "lg:w-[86%]");
		expect(artwork.parentElement).toHaveClass("top-12", "bottom-0", "sm:top-16");
		expect(getByRole("heading", { level: 1 })).toHaveTextContent("Career intelligence at the speed of opportunity.");
		const asciiDetails = getAllByTestId("career-ascii");
		expect(asciiDetails).toHaveLength(3);
		expect(asciiDetails.some((detail) => detail.textContent?.includes("WEBMCP.CONNECTED"))).toBe(true);
		expect(getByRole("button", { name: /Build your career base/i })).toHaveAttribute("href", "/dashboard");
		expect(container.querySelector("video")).not.toBeInTheDocument();
	});
});
