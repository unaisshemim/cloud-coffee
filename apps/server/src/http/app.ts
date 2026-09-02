import type { Http2Bindings, HttpBindings } from "@hono/node-server";
import type { Context } from "hono";
import { isIP } from "node:net";
import { getConnInfo } from "@hono/node-server/conninfo";
import { handleWebApp, serveWebDistStatic } from "../static/web";
import { createApiApp } from "./api-app";

type ServerEnvironment = { Bindings: HttpBindings | Http2Bindings };

const getTrustedClient = (context: Context<ServerEnvironment>): string => {
	try {
		const address = getConnInfo(context).remote.address?.trim();
		return address && isIP(address) ? address : "unknown";
	} catch {
		return "unknown";
	}
};

export function createApp() {
	const app = createApiApp({ getTrustedClient });

	// Must precede the static middleware: serveStatic resolves "/" to dist/index.html and would
	// return it verbatim, skipping the OpenGraph/Twitter/canonical/JSON-LD injection in handleWebApp.
	app.on(["GET", "HEAD"], "/", (c) => handleWebApp(c.req.raw));
	app.use("/*", serveWebDistStatic);
	app.on(["GET", "HEAD"], "/*", (c) => handleWebApp(c.req.raw));

	return app;
}
