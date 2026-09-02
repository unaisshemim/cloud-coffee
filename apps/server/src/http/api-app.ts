import type { ApiAppOptions } from "../platform/types";
import { Hono } from "hono";
import { handleOpenApi } from "../openapi/handler";
import {
	handleOAuthAuthorizationServer,
	handleOAuthProtectedResource,
	handleOpenIdConfiguration,
	handleWellKnownFallback,
} from "../openapi/metadata";
import { handleRpc } from "../rpc/handler";
import { handleSchemaJson } from "../static/schema";
import { handleLlms, handleRobots, handleSitemap } from "../static/seo";
import { handleUpload } from "../static/uploads";
import { handleAuth, handleOAuth } from "./auth";
import { handleHealth } from "./health";
import { handlePublicResumePdf } from "./public-resume-pdf";
import { handleResumePdfDownload } from "./resume-pdf";

export function createApiApp({ getTrustedClient }: ApiAppOptions) {
	const app = new Hono();

	app.all("/api/rpc", (c) => handleRpc(c.req.raw, getTrustedClient(c)));
	app.all("/api/rpc/*", (c) => handleRpc(c.req.raw, getTrustedClient(c)));
	app.all("/api/openapi", (c) => handleOpenApi(c.req.raw, getTrustedClient(c)));
	app.all("/api/openapi/*", (c) => handleOpenApi(c.req.raw, getTrustedClient(c)));
	app.get("/api/auth/oauth", (c) => handleOAuth(c.req.raw));
	app.all("/api/auth/*", (c) => handleAuth(c.req.raw));
	app.get("/api/health", () => handleHealth());
	app.get("/api/resumes/:username/:slug/pdf", (c) =>
		handlePublicResumePdf(c.req.raw, c.req.param("username"), c.req.param("slug"), getTrustedClient(c)),
	);
	app.get("/api/resumes/:id/pdf", (c) => handleResumePdfDownload(c.req.raw, c.req.param("id")));
	app.get("/api/uploads/*", (c) => handleUpload(c.req.raw));
	app.get("/uploads/*", (c) => handleUpload(c.req.raw));
	app.get("/schema.json", () => handleSchemaJson());
	app.get("/.well-known/oauth-authorization-server", (c) => handleOAuthAuthorizationServer(c.req.raw));
	app.get("/.well-known/oauth-authorization-server/*", (c) => handleOAuthAuthorizationServer(c.req.raw));
	app.get("/.well-known/openid-configuration", (c) => handleOpenIdConfiguration(c.req.raw));
	app.get("/.well-known/oauth-protected-resource", () => handleOAuthProtectedResource());
	app.get("/.well-known/oauth-protected-resource/*", () => handleOAuthProtectedResource());
	app.all("/.well-known/*", () => handleWellKnownFallback());

	app.on(["GET", "HEAD"], "/robots.txt", (c) => handleRobots({ head: c.req.method === "HEAD" }));
	app.on(["GET", "HEAD"], "/sitemap.xml", (c) => handleSitemap({ head: c.req.method === "HEAD" }));
	app.on(["GET", "HEAD"], "/llms.txt", (c) => handleLlms({ head: c.req.method === "HEAD" }));

	return app;
}
