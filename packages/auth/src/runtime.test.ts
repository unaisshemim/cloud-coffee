import type { AuthRuntime } from "./runtime";
import { describe, expect, it, vi } from "vitest";
import { getAuth, runWithAuthRuntime, setDefaultAuthRuntime, verifyOAuthToken } from "./runtime";

function runtime(name: string): AuthRuntime {
	return {
		auth: { name } as never,
		verifyOAuthToken: vi.fn(async () => ({ sub: name })),
	};
}

describe("auth runtime", () => {
	it("fails clearly before runtime is configured", () => {
		expect(() => getAuth()).toThrow("Auth runtime is not configured");
	});

	it("supports defaults and nested request scopes", async () => {
		const fallback = runtime("fallback");
		const first = runtime("first");
		const second = runtime("second");
		setDefaultAuthRuntime(fallback);

		expect(getAuth()).toBe(fallback.auth);
		await runWithAuthRuntime(first, async () => {
			expect(getAuth()).toBe(first.auth);
			await runWithAuthRuntime(second, async () => expect(getAuth()).toBe(second.auth));
			expect(getAuth()).toBe(first.auth);
		});
		expect(getAuth()).toBe(fallback.auth);
	});

	it("isolates concurrent request scopes", async () => {
		const first = runtime("first");
		const second = runtime("second");
		let releaseFirst!: () => void;
		const gate = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		const firstRequest = runWithAuthRuntime(first, async () => {
			await gate;
			expect(getAuth()).toBe(first.auth);
		});
		await runWithAuthRuntime(second, async () => {
			expect(getAuth()).toBe(second.auth);
			releaseFirst();
			await firstRequest;
			expect(getAuth()).toBe(second.auth);
		});
	});

	it("delegates token verification to current runtime", async () => {
		const scoped = runtime("user-1");
		await runWithAuthRuntime(scoped, async () => {
			await expect(verifyOAuthToken("token")).resolves.toMatchObject({ sub: "user-1" });
			expect(scoped.verifyOAuthToken).toHaveBeenCalledWith("token");
		});
	});
});
