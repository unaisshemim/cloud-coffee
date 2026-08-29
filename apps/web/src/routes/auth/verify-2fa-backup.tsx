import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth/verify-2fa-backup")({
	beforeLoad: () => {
		throw redirect({ to: "/auth/login", replace: true });
	},
});
