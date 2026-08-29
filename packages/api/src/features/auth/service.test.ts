import { describe, expect, it, vi } from "vitest";

const envMock = vi.hoisted(() => ({
	GOOGLE_CLIENT_ID: undefined as string | undefined,
	GOOGLE_CLIENT_SECRET: undefined as string | undefined,
}));

vi.mock("@reactive-resume/env/server", () => ({ env: envMock }));
// auth.ts also imports db client and storage; stub them with no-op surfaces.
vi.mock("@reactive-resume/db/client", () => ({ db: { delete: vi.fn() } }));
vi.mock("@reactive-resume/db/schema", () => ({ user: {} }));
vi.mock("../storage/service", () => ({ getStorageService: () => ({ delete: vi.fn() }) }));

const { authService } = await import("./service");

const resetEnv = () => {
	envMock.GOOGLE_CLIENT_ID = undefined;
	envMock.GOOGLE_CLIENT_SECRET = undefined;
};

describe("authService.providers.list", () => {
	it("returns no provider when Google credentials are incomplete", () => {
		resetEnv();
		expect(authService.providers.list()).toEqual({});

		envMock.GOOGLE_CLIENT_ID = "id";
		expect(authService.providers.list()).toEqual({});
	});

	it("returns only Google when both credentials are configured", () => {
		resetEnv();
		envMock.GOOGLE_CLIENT_ID = "id";
		envMock.GOOGLE_CLIENT_SECRET = "secret";
		expect(authService.providers.list()).toEqual({ google: "Google" });
	});
});
