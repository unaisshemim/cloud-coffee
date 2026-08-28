// @vitest-environment happy-dom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";

const { ProfileWorkspace } = await import("./index");

i18n.loadAndActivate({ locale: "en", messages: {} });

describe("ProfileWorkspace", () => {
	it("shows all profile destinations and switches the active editor", () => {
		render(
			<I18nProvider i18n={i18n}>
				<ProfileWorkspace
					profile={defaultApplicationProfile}
					resumes={[]}
					onChange={vi.fn()}
					onSave={vi.fn()}
					isSaving={false}
				/>
			</I18nProvider>,
		);

		expect(screen.getByRole("button", { name: /Job Preferences/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Personal info/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Skills & Languages/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Projects & Volunteer/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Certifications & Awards/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Equal Opportunity/i })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Skills & Languages/i }));
		expect(screen.getByRole("heading", { name: "Skills & Languages" })).toBeInTheDocument();
		expect(screen.getByText("Skills cloudcoffee matches against job requirements.")).toBeInTheDocument();
	});
});
