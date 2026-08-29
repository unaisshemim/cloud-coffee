// @vitest-environment happy-dom

import { render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { i18n } from "@lingui/core";
import { I18nProvider } from "@lingui/react";

const providerQuery = vi.hoisted(() => ({
	data: { google: "Google" } as Record<string, string>,
	isLoading: false,
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
	authClient: { signIn: { social: vi.fn() } },
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
});

const renderPage = () =>
	render(
		<I18nProvider i18n={i18n}>
			<LoginPage callbackURL="/dashboard/resumes" />
		</I18nProvider>,
	);

describe("LoginPage", () => {
	it("offers Google as the only sign-in method", () => {
		renderPage();

		expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
		expect(screen.queryByText("Password")).not.toBeInTheDocument();
		expect(screen.queryByText("Passkey")).not.toBeInTheDocument();
		expect(screen.queryByText("GitHub")).not.toBeInTheDocument();
		expect(screen.queryByText("LinkedIn")).not.toBeInTheDocument();
		expect(screen.queryByText(/create one now/i)).not.toBeInTheDocument();
	});

	it("explains when Google OAuth is not configured", () => {
		providerQuery.data = {};
		renderPage();

		expect(screen.getByRole("status")).toHaveTextContent(/google sign-in is unavailable/i);
		expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
	});
});
