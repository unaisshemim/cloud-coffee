import { createFileRoute } from "@tanstack/react-router";
import { ApplicationProfileSettingsPage } from "@/features/settings/profile";

export const Route = createFileRoute("/dashboard/profile")({
	component: RouteComponent,
});

function RouteComponent() {
	const { session } = Route.useRouteContext();

	return <ApplicationProfileSettingsPage session={session} />;
}
