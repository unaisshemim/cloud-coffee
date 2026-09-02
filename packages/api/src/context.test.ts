import { describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => ({
	api: {
		getSession: vi.fn(),
	},
}));
const verifyOAuthTokenMock = vi.hoisted(() => vi.fn());

const dbMock = vi.hoisted(() => ({
	select: vi.fn(),
}));

vi.mock("@reactive-resume/auth/runtime", () => ({
	getAuth: () => authMock,
	verifyOAuthToken: verifyOAuthTokenMock,
}));
vi.mock("@reactive-resume/db/runtime", () => ({ getDatabase: () => dbMock }));
vi.mock("@reactive-resume/db/schema", () => ({ user: { __table: "user" } }));
vi.mock("drizzle-orm", () => ({ eq: () => "EQ" }));

const { resolveUserFromRequestHeaders } = await import("./context");

const setupDbResolves = (userResult: unknown) => {
	dbMock.select.mockReturnValueOnce({
		from: () => ({
			where: () => ({
				limit: () => Promise.resolve(userResult ? [userResult] : []),
			}),
		}),
	});
};

const reset = () => {
	authMock.api.getSession.mockReset();
	verifyOAuthTokenMock.mockReset();
	dbMock.select.mockReset();
};

describe("resolveUserFromRequestHeaders", () => {
	it("does not resolve users from x-api-key", async () => {
		reset();
		authMock.api.getSession.mockResolvedValueOnce(null);

		const headers = new Headers({ "x-api-key": "abc123" });
		const user = await resolveUserFromRequestHeaders(headers);

		expect(user).toBeNull();
		expect(dbMock.select).not.toHaveBeenCalled();
	});

	it("uses Bearer token even when x-api-key is present", async () => {
		reset();
		verifyOAuthTokenMock.mockResolvedValueOnce({ sub: "user-bearer" });
		setupDbResolves({ id: "user-bearer", name: "Bob" });

		const headers = new Headers({ authorization: "Bearer xxx.yyy.zzz", "x-api-key": "ignored" });
		const user = await resolveUserFromRequestHeaders(headers);

		expect(user).toMatchObject({ id: "user-bearer", name: "Bob" });
	});

	it("uses Bearer token when present and no api key", async () => {
		reset();
		verifyOAuthTokenMock.mockResolvedValueOnce({ sub: "user-bearer" });
		setupDbResolves({ id: "user-bearer", name: "Bob" });

		const headers = new Headers({ authorization: "Bearer xxx.yyy.zzz" });
		const user = await resolveUserFromRequestHeaders(headers);

		expect(verifyOAuthTokenMock).toHaveBeenCalledWith("xxx.yyy.zzz");
		expect(user).toMatchObject({ id: "user-bearer", name: "Bob" });
	});

	it("falls back to session when Bearer verification fails", async () => {
		reset();
		verifyOAuthTokenMock.mockResolvedValueOnce(null);
		authMock.api.getSession.mockResolvedValueOnce({ user: { id: "session-user" } });

		const headers = new Headers({ authorization: "Bearer bad" });
		const user = await resolveUserFromRequestHeaders(headers);

		expect(user).toMatchObject({ id: "session-user" });
	});

	it("returns null when no auth method succeeds", async () => {
		reset();
		authMock.api.getSession.mockResolvedValueOnce(null);

		const user = await resolveUserFromRequestHeaders(new Headers());
		expect(user).toBeNull();
	});

	it("does not throw when verifyOAuthToken throws (logs and continues)", async () => {
		reset();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		verifyOAuthTokenMock.mockRejectedValueOnce(new Error("bad token"));
		authMock.api.getSession.mockResolvedValueOnce({ user: { id: "fallback" } });

		const headers = new Headers({ authorization: "Bearer xxx" });
		const user = await resolveUserFromRequestHeaders(headers);

		expect(user).toMatchObject({ id: "fallback" });
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it("returns null if Bearer header does not start with 'Bearer '", async () => {
		reset();
		authMock.api.getSession.mockResolvedValueOnce(null);

		const headers = new Headers({ authorization: "Basic abc" });
		const user = await resolveUserFromRequestHeaders(headers);

		expect(user).toBeNull();
		expect(verifyOAuthTokenMock).not.toHaveBeenCalled();
	});
});
