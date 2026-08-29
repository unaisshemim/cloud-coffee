import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/settings/authentication/")({
	beforeLoad: () => {
		throw redirect({ to: "/dashboard/settings/account", replace: true });
	},
});
