import type { AppDatabase } from "./runtime";
import { describe, expect, it } from "vitest";
import { getDatabase, runWithDatabase } from "./runtime";

const fakeDatabase = (name: string) => ({ name }) as unknown as AppDatabase;

describe("database runtime", () => {
	it("throws outside a configured runtime", () => {
		expect(() => getDatabase()).toThrow("Database runtime is not configured");
	});

	it("restores the outer database after nested work", async () => {
		const first = fakeDatabase("first");
		const second = fakeDatabase("second");

		await runWithDatabase(first, async () => {
			expect(getDatabase()).toBe(first);
			await runWithDatabase(second, async () => expect(getDatabase()).toBe(second));
			expect(getDatabase()).toBe(first);
		});
	});

	it("isolates concurrent request databases", async () => {
		const first = fakeDatabase("first");
		const second = fakeDatabase("second");
		let releaseFirst!: () => void;
		let releaseSecond!: () => void;
		const firstGate = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		const secondGate = new Promise<void>((resolve) => {
			releaseSecond = resolve;
		});

		const firstRun = runWithDatabase(first, async () => {
			await firstGate;
			return getDatabase();
		});
		const secondRun = runWithDatabase(second, async () => {
			await secondGate;
			return getDatabase();
		});

		releaseSecond();
		releaseFirst();

		await expect(firstRun).resolves.toBe(first);
		await expect(secondRun).resolves.toBe(second);
	});
});
