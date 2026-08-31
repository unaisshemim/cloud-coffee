// @vitest-environment happy-dom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import { SidebarProvider } from "@reactive-resume/ui/components/sidebar";

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
	React.PropsWithChildren<{ activeProps?: { className?: string }; to: string }>;

vi.mock("@tanstack/react-router", () => ({
	Link: ({ activeProps: _activeProps, children, to, ...rest }: LinkProps) => (
		<a href={to} {...rest}>
			{children}
		</a>
	),
}));

vi.mock("@/features/user/dropdown-menu", () => ({
	UserDropdownMenu: ({ children }: { children: (input: { session: never }) => React.ReactNode }) =>
		children({
			session: { user: { email: "user@example.com", image: null, name: "Test User" } },
		} as never),
}));

i18n.loadAndActivate({ locale: "en", messages: {} });

const { DashboardSidebar } = await import("./sidebar");

describe("DashboardSidebar", () => {
	it("groups Profile with App navigation instead of Settings", () => {
		render(
			<I18nProvider i18n={i18n}>
				<SidebarProvider>
					<DashboardSidebar />
				</SidebarProvider>
			</I18nProvider>,
		);

		const appGroup = screen.getByText("App").closest('[data-slot="sidebar-group"]');
		const settingsGroup = screen.getByText("Settings").closest('[data-slot="sidebar-group"]');

		expect(appGroup).not.toBeNull();
		expect(settingsGroup).not.toBeNull();
		expect(within(appGroup as HTMLElement).getByRole("link", { name: "Profile" })).toHaveAttribute(
			"href",
			"/dashboard/profile",
		);
		expect(within(settingsGroup as HTMLElement).queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
	});
});
