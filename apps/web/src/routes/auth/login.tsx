import { createFileRoute, redirect } from "@tanstack/react-router";
import z from "zod";
import { LoginPage } from "@/features/auth/pages/login";
import { resolveAuthRedirect } from "@/features/auth/redirect";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth/login")({
	component: RouteComponent,
	validateSearch: searchSchema,
	beforeLoad: ({ context }) => {
		if (context.session) throw redirect({ to: "/dashboard", replace: true });
		return { session: null };
	},
});

function RouteComponent() {
	const { redirect } = Route.useSearch();

	return <LoginPage callbackURL={resolveAuthRedirect(redirect)} />;
}
