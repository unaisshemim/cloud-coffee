// @vitest-environment happy-dom

import type { AuthSession } from "@reactive-resume/auth/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";

vi.mock("@tanstack/react-query", () => ({
	useMutation: vi.fn(),
	useQuery: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/features/webmcp/use-webmcp-tools", () => ({ useWebMcpTools: vi.fn() }));
vi.mock("@/libs/orpc/client", () => ({
	client: {},
	orpc: {
		applicationProfile: {
			get: { queryOptions: () => ({ queryKey: ["application-profile"] }) },
			update: { mutationOptions: (options: unknown) => options },
		},
		resume: { list: { queryOptions: () => ({ queryKey: ["resumes"] }) } },
	},
}));

const { ApplicationProfileSettingsPage, ProfileWorkspace } = await import("./index");

i18n.loadAndActivate({ locale: "en", messages: {} });

beforeEach(() => {
	vi.mocked(useMutation).mockReturnValue({ isPending: false, mutate: vi.fn() } as never);
	vi.mocked(useQuery).mockReset();
});

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

		expect(screen.getByRole("heading", { name: "Career Knowledge" })).toBeInTheDocument();
		expect(screen.getByText("Achievements")).toBeInTheDocument();
		expect(screen.getByText("Hackathons")).toBeInTheDocument();
		expect(screen.getByText("Publications")).toBeInTheDocument();
		expect(screen.getByText("Custom facts")).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Job Preferences/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Career Knowledge/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Personal info/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Skills & Languages/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Projects & Volunteer/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Certifications & Awards/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /Equal Opportunity/i })).toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: /Skills & Languages/i }));
		expect(screen.getByRole("heading", { name: "Skills & Languages" })).toBeInTheDocument();
		expect(screen.getByText("Skills cloudcoffee matches against job requirements.")).toBeInTheDocument();
	});

	it("backfills a missing application email without replacing stored personal fields", () => {
		const storedProfile = {
			...defaultApplicationProfile,
			personal: {
				...defaultApplicationProfile.personal,
				firstName: "Unaiz",
				lastName: "K Shemim",
				city: "Bengaluru",
				email: "",
			},
		};
		const profileQuery = { data: { profile: storedProfile, revision: 1 }, isLoading: false };
		const resumesQuery = { data: [], isLoading: false };

		vi.mocked(useQuery).mockImplementation(
			(options: { queryKey?: readonly unknown[] }) =>
				(options.queryKey?.[0] === "application-profile" ? profileQuery : resumesQuery) as never,
		);

		const session = {
			session: {},
			user: { email: "unaisshemim@gmail.com", name: "Unaiz K Shemim" },
		} as AuthSession;

		const { container } = render(
			<I18nProvider i18n={i18n}>
				<ApplicationProfileSettingsPage session={session} />
			</I18nProvider>,
		);

		fireEvent.click(screen.getByRole("button", { name: /Personal info/i }));

		expect(container.querySelector<HTMLInputElement>('input[type="email"]')).toHaveValue("unaisshemim@gmail.com");
		expect(container.querySelectorAll<HTMLInputElement>('input[type="text"]')[0]).toHaveValue("Unaiz");
	});
});
