// @vitest-environment happy-dom

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const providerQuery = vi.hoisted(() => ({
	data: { google: "Google" } as Record<string, string>,
	isLoading: false,
}));

const authMocks = vi.hoisted(() => ({
	signInWithEmail: vi.fn(),
	signInWithGoogle: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => ({
	...(await importOriginal<typeof import("@tanstack/react-query")>()),
	useQuery: () => providerQuery,
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({ children, to }: React.PropsWithChildren<{ to: string }>) => <a href={to}>{children}</a>,
	useNavigate: () => vi.fn(),
	useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/libs/auth/client", () => ({
	authClient: { signIn: { email: authMocks.signInWithEmail, social: authMocks.signInWithGoogle } },
}));

vi.mock("@/libs/orpc/client", () => ({
	orpc: { auth: { providers: { list: { queryOptions: () => ({}) } } } },
}));

const { LoginPage } = await import("./login");

beforeAll(() => {
	i18n.loadAndActivate({ locale: "en", messages: {} });
});

beforeEach(() => {
	providerQuery.data = { google: "Google" };
	providerQuery.isLoading = false;
	authMocks.signInWithEmail.mockReset();
	authMocks.signInWithEmail.mockResolvedValue({ data: {}, error: null });
});

const renderPage = () =>
	render(
		<I18nProvider i18n={i18n}>
			<LoginPage callbackURL="/dashboard/resumes" />
		</I18nProvider>,
	);

describe("LoginPage", () => {
	it("offers email, password, registration, and Google sign-in", () => {
		renderPage();

		expect(screen.getByRole("textbox", { name: /email address/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/^password$/i)).toHaveAttribute("type", "password");
		expect(screen.getByRole("button", { name: /^sign in$/i })).toBeInTheDocument();
		expect(screen.getByRole("link", { name: /create one now/i })).toHaveAttribute("href", "/auth/register");
		expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
		expect(screen.queryByText("Passkey")).not.toBeInTheDocument();
		expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
		expect(screen.queryByText("LinkedIn")).not.toBeInTheDocument();
	});

	it("submits credentials with the safe callback URL", async () => {
		const user = userEvent.setup();
		renderPage();

		await user.type(screen.getByRole("textbox", { name: /email address/i }), "person@example.com");
		await user.type(screen.getByLabelText(/^password$/i), "password123");
		await user.click(screen.getByRole("button", { name: /^sign in$/i }));

		await waitFor(() => {
			expect(authMocks.signInWithEmail).toHaveBeenCalledWith({
				email: "person@example.com",
				password: "password123",
				callbackURL: "/dashboard/resumes",
			});
		});
	});

	it("explains when Google OAuth is not configured", () => {
		providerQuery.data = {};
		renderPage();

		expect(screen.getByRole("status")).toHaveTextContent(/google sign-in is unavailable/i);
		expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
	});
});
