// @vitest-environment happy-dom

import type { ComponentType, PropsWithChildren } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const authMocks = vi.hoisted(() => ({
	invalidateRouter: vi.fn(),
	navigate: vi.fn(),
	signUpWithEmail: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-query")>()),
	useQuery: () => ({ data: { google: "Google" }, isLoading: false }),
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-router")>()),
	Link: ({ children, to }: PropsWithChildren<{ to: string }>) => <a href={to}>{children}</a>,
	useNavigate: () => authMocks.navigate,
	useRouter: () => ({ invalidate: authMocks.invalidateRouter }),
}));

vi.mock("@/libs/auth/client", () => ({
	authClient: {
		signIn: { social: vi.fn() },
		signUp: { email: authMocks.signUpWithEmail },
	},
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: { auth: { providers: { list: { queryOptions: () => ({}) } } } },
}));

const { Route } = await import("./register");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	authMocks.signUpWithEmail.mockReset();
	authMocks.signUpWithEmail.mockResolvedValue({ data: {}, error: null });
	authMocks.navigate.mockReset();
	authMocks.invalidateRouter.mockReset();
	authMocks.invalidateRouter.mockResolvedValue(undefined);
});

const renderRoute = () => {
	const Component = Route.options.component as ComponentType;
	return render(
		<I18nProvider i18n={i18n}>
			<Component />
		</I18nProvider>,
	);
};

describe("registration route", () => {
	it("allows signed-out users to register when signups are enabled", () => {
		expect(Route.options.beforeLoad).toBeTypeOf("function");

		const result = Route.options.beforeLoad?.({
			context: { session: null, flags: { disableSignups: false } },
		} as never);

		expect(result).toEqual({ session: null });
	});

	it("offers name, username, email, password, and Google signup", () => {
		renderRoute();

		expect(screen.getByRole("textbox", { name: /^name$/i })).toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: /^username$/i })).toBeInTheDocument();
		expect(screen.getByRole("textbox", { name: /email address/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
		expect(screen.getByRole("button", { name: /^sign up$/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /sign in now/i })).toHaveAttribute("href", "/auth/login");
	});

	it("creates an account and requests automatic dashboard login", async () => {
		const user = userEvent.setup();
		renderRoute();

		await user.type(screen.getByRole("textbox", { name: /^name$/i }), "Coffee User");
		await user.type(screen.getByRole("textbox", { name: /^username$/i }), "coffee.user");
		await user.type(screen.getByRole("textbox", { name: /email address/i }), "coffee@example.com");
		await user.type(screen.getByLabelText(/^password$/i), "password123");
		await user.click(screen.getByRole("button", { name: /^sign up$/i }));

		await waitFor(() => {
			expect(authMocks.signUpWithEmail).toHaveBeenCalledWith({
				name: "Coffee User",
				username: "coffee.user",
				displayUsername: "coffee.user",
				email: "coffee@example.com",
				password: "password123",
				callbackURL: "/dashboard",
			});
			expect(authMocks.invalidateRouter).toHaveBeenCalledOnce();
			expect(authMocks.navigate).toHaveBeenCalledWith({ to: "/dashboard", replace: true });
		});
	});
});
