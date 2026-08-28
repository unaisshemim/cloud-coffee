// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("./profile", () => ({
	AccountIdentityForm: () => <div>Identity form</div>,
}));
vi.mock("@/features/settings/integrations", () => ({
	IntegrationsSettingsPage: () => <div>AI provider form</div>,
}));
vi.mock("@/features/locale/combobox", () => ({ LocaleCombobox: () => <div>Locale control</div> }));
vi.mock("@/features/theme/combobox", () => ({ ThemeCombobox: () => <div>Theme control</div> }));
vi.mock("@/hooks/use-confirm", () => ({ useConfirm: () => vi.fn() }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/libs/orpc/client", () => ({
	orpc: {
		auth: {
			deleteAccount: { mutationOptions: () => ({ mutationFn: vi.fn() }) },
			exportData: { mutationOptions: () => ({ mutationFn: vi.fn() }) },
		},
	},
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

const { AccountSettingsPage } = await import("./account");

describe("AccountSettingsPage", () => {
	it("consolidates identity, preferences, AI providers, and account lifecycle controls", () => {
		render(
			<I18nProvider i18n={i18n}>
				<QueryClientProvider client={new QueryClient()}>
					<AccountSettingsPage session={{ user: {} } as never} />
				</QueryClientProvider>
			</I18nProvider>,
		);

		expect(screen.getByText("Personal details")).toBeInTheDocument();
		expect(screen.getByText("Appearance & language")).toBeInTheDocument();
		expect(screen.getByText("AI providers")).toBeInTheDocument();
		expect(screen.getByText("Data & account")).toBeInTheDocument();
	});
});
