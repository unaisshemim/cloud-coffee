import { expect, it, vi } from "vitest";
import { Config } from "./config";
import { apply, inject, name } from "./index";

/** Minimal stand-in for the parts of the Cordis context `apply` touches. */
function fakeContext() {
	return {
		plugin: vi.fn(async (_plugin: unknown, _config: unknown) => undefined),
		systemPrompt: { section: vi.fn(() => () => undefined) },
		logger: { warn: vi.fn() },
	};
}

it("exports the cordis plugin name", () => {
	expect(name).toBe("reactive-resume");
});

it("declares the services it needs", () => {
	expect(inject).toEqual(["systemPrompt"]);
});

it("mounts the MCP bridge with streamable-http and OAuth bearer authentication", async () => {
	const ctx = fakeContext();

	await apply(ctx as never, Config({ accessToken: "test-token" }));

	expect(ctx.plugin).toHaveBeenCalledTimes(1);
	expect(ctx.plugin.mock.calls[0]?.[1]).toEqual({
		transport: "streamable-http",
		serverName: "resume",
		url: "https://rxresu.me/mcp",
		headers: { Authorization: "Bearer test-token" },
		toolCallTimeoutMs: 60_000,
		failOnStartupError: true,
	});
});

it("strips a trailing slash from the configured url", async () => {
	const ctx = fakeContext();

	await apply(ctx as never, Config({ accessToken: "test-token", url: "http://localhost:3000/" }));

	expect(ctx.plugin.mock.calls[0]?.[1]).toMatchObject({ url: "http://localhost:3000/mcp" });
});

it("rejects a serverName the bridge would refuse at config-parse time, before apply runs", () => {
	expect(() => Config({ accessToken: "test-token", serverName: "has spaces" })).toThrow(/serverName/);
});

it("mounts nothing when no access token is configured, so an unconfigured install still boots", async () => {
	const ctx = fakeContext();

	await apply(ctx as never, Config({}));

	expect(ctx.plugin).not.toHaveBeenCalled();
	expect(ctx.systemPrompt.section).not.toHaveBeenCalled();
	expect(ctx.logger.warn).toHaveBeenCalledTimes(1);
});
