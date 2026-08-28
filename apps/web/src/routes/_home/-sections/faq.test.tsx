// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { Faq } from "./faq";

i18n.loadAndActivate({ locale: "en", messages: {} });

describe("Faq", () => {
	it("answers career knowledge-base questions", () => {
		render(
			<I18nProvider i18n={i18n}>
				<Faq />
			</I18nProvider>,
		);

		expect(screen.getByText("What can I add to my career base?")).toBeInTheDocument();
		expect(screen.getByText("How does resume tailoring work?")).toBeInTheDocument();
		expect(screen.queryByText("Is cloudcoffee really free?")).not.toBeInTheDocument();
	});
});
