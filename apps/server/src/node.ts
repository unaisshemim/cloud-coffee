import { serve } from "@hono/node-server";
import { env } from "@reactive-resume/env/server";
import { createApp } from "./http/app";
import { runStartupChecks } from "./startup/checks";

export async function main() {
	await runStartupChecks();

	process.on("unhandledRejection", (reason) => {
		console.error("[unhandledRejection]", reason);
	});

	const port =
		process.env.NODE_ENV === "production" ? Number.parseInt(process.env.PORT ?? "3000", 10) : env.SERVER_PORT;
	const app = createApp();

	serve(
		{
			fetch: app.fetch,
			port,
		},
		(info) => {
			console.info(`🚀 Up and running on http://localhost:${info.port}`);
		},
	);
}
