import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	handleAuth: vi.fn(),
	handleOAuth: vi.fn(),
	handleRpc: vi.fn(),
	handleOpenApi: vi.fn(),
	handleHealth: vi.fn(),
	handleUpload: vi.fn(),
	handleResumePdfDownload: vi.fn(),
	handlePublicResumePdf: vi.fn(),
	handleOAuthAuthorizationServer: vi.fn(),
	handleOAuthProtectedResource: vi.fn(),
	handleOpenIdConfiguration: vi.fn(),
	handleWellKnownFallback: vi.fn(),
	handleRobots: vi.fn(),
	handleSitemap: vi.fn(),
	handleLlms: vi.fn(),
}));

vi.mock("./auth", () => ({ handleAuth: mocks.handleAuth, handleOAuth: mocks.handleOAuth }));
vi.mock("./health", () => ({ handleHealth: mocks.handleHealth }));
vi.mock("../rpc/handler", () => ({ handleRpc: mocks.handleRpc }));
vi.mock("../openapi/handler", () => ({ handleOpenApi: mocks.handleOpenApi }));
vi.mock("../openapi/metadata", () => ({
	handleOAuthAuthorizationServer: mocks.handleOAuthAuthorizationServer,
	handleOAuthProtectedResource: mocks.handleOAuthProtectedResource,
	handleOpenIdConfiguration: mocks.handleOpenIdConfiguration,
	handleWellKnownFallback: mocks.handleWellKnownFallback,
}));
vi.mock("../static/uploads", () => ({ handleUpload: mocks.handleUpload }));
vi.mock("../static/seo", () => ({
	handleRobots: mocks.handleRobots,
	handleSitemap: mocks.handleSitemap,
	handleLlms: mocks.handleLlms,
}));
vi.mock("./resume-pdf", () => ({ handleResumePdfDownload: mocks.handleResumePdfDownload }));
vi.mock("./public-resume-pdf", () => ({ handlePublicResumePdf: mocks.handlePublicResumePdf }));

beforeEach(() => {
	vi.clearAllMocks();
	mocks.handleAuth.mockResolvedValue(new Response("auth"));
	mocks.handleOAuth.mockResolvedValue(new Response("oauth"));
	mocks.handleRpc.mockResolvedValue(new Response("rpc"));
	mocks.handleOpenApi.mockResolvedValue(new Response("openapi"));
	mocks.handleHealth.mockReturnValue(new Response("health"));
	mocks.handleUpload.mockResolvedValue(new Response("upload"));
	mocks.handleResumePdfDownload.mockResolvedValue(new Response("pdf"));
	mocks.handlePublicResumePdf.mockResolvedValue(new Response("public-pdf"));
	mocks.handleOAuthAuthorizationServer.mockReturnValue(new Response("oauth-authorization-server"));
	mocks.handleOAuthProtectedResource.mockReturnValue(new Response("oauth-protected-resource"));
	mocks.handleOpenIdConfiguration.mockReturnValue(new Response("openid-configuration"));
	mocks.handleWellKnownFallback.mockReturnValue(new Response("well-known"));
	mocks.handleRobots.mockReturnValue(new Response("robots"));
	mocks.handleSitemap.mockReturnValue(new Response("sitemap"));
	mocks.handleLlms.mockReturnValue(new Response("llms"));
});

describe("createApiApp", () => {
	it("routes API requests with the supplied trusted-client resolver", async () => {
		const { createApiApp } = await import("./api-app");
		const getTrustedClient = vi.fn(() => "203.0.113.9");
		const app = createApiApp({ getTrustedClient });
		const request = new Request("http://localhost:3001/api/rpc");

		const response = await app.fetch(request);

		await expect(response.text()).resolves.toBe("rpc");
		expect(getTrustedClient).toHaveBeenCalledOnce();
		expect(mocks.handleRpc).toHaveBeenCalledWith(request, "203.0.113.9");
	});

	it.each([
		["/", 404],
		["/assets", 404],
		["/assets/app/app.js", 404],
	])("does not own web route %s", async (path, status) => {
		const { createApiApp } = await import("./api-app");
		const app = createApiApp({ getTrustedClient: () => "unknown" });

		const response = await app.request(path);

		expect(response.status).toBe(status);
	});

	it("keeps API, upload, metadata, and SEO endpoints in the portable app", async () => {
		const { createApiApp } = await import("./api-app");
		const app = createApiApp({ getTrustedClient: () => "unknown" });

		const cases = [
			["/api/health", "health"],
			["/api/uploads/user/picture.png", "upload"],
			["/.well-known/openid-configuration", "openid-configuration"],
			["/robots.txt", "robots"],
			["/sitemap.xml", "sitemap"],
			["/llms.txt", "llms"],
		] as const;

		for (const [path, body] of cases) {
			const response = await app.request(path);
			await expect(response.text()).resolves.toBe(body);
		}
	});
});
