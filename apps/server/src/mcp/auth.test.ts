import { describe, expect, it, vi } from "vitest";

const verifyOAuthTokenMock = vi.hoisted(() => vi.fn());

vi.mock("@reactive-resume/auth/config", () => ({
	verifyOAuthToken: verifyOAuthTokenMock,
}));

const { AuthError, authenticateRequest } = await import("./auth");

describe("authenticateRequest", () => {
	it("accepts an OAuth bearer token with a subject", async () => {
		verifyOAuthTokenMock.mockResolvedValueOnce({ sub: "user-1" });

		await expect(
			authenticateRequest(new Request("https://example.com/mcp", { headers: { authorization: "Bearer token" } })),
		).resolves.toBeUndefined();
	});

	it("rejects x-api-key authentication", async () => {
		await expect(
			authenticateRequest(new Request("https://example.com/mcp", { headers: { "x-api-key": "legacy-key" } })),
		).rejects.toBeInstanceOf(AuthError);
	});
});
