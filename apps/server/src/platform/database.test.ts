import type { AppDatabase } from "@reactive-resume/db/runtime";
import { describe, expect, it, vi } from "vitest";
import { createHyperdriveDatabase, withHyperdriveDatabase } from "./database";

describe("createHyperdriveDatabase", () => {
	it("connects once and closes idempotently", async () => {
		const client = { connect: vi.fn(), end: vi.fn() };
		const database = {} as AppDatabase;
		const connection = await createHyperdriveDatabase("postgresql://hyperdrive", {
			createClient: () => client,
			createDatabase: () => database,
		});

		expect(client.connect).toHaveBeenCalledOnce();
		expect(connection.database).toBe(database);

		await connection.close();
		await connection.close();
		expect(client.end).toHaveBeenCalledOnce();
	});

	it("ends client when connection setup fails", async () => {
		const client = { connect: vi.fn().mockRejectedValue(new Error("connect failed")), end: vi.fn() };
		await expect(
			createHyperdriveDatabase("postgresql://hyperdrive", {
				createClient: () => client,
				createDatabase: () => ({}) as AppDatabase,
			}),
		).rejects.toThrow("connect failed");
		expect(client.end).toHaveBeenCalledOnce();
	});
});

describe("withHyperdriveDatabase", () => {
	it("closes after success and failure", async () => {
		const successClient = { connect: vi.fn(), end: vi.fn() };
		await expect(
			withHyperdriveDatabase("postgresql://hyperdrive", async () => "ok", {
				createClient: () => successClient,
				createDatabase: () => ({}) as AppDatabase,
			}),
		).resolves.toBe("ok");
		expect(successClient.end).toHaveBeenCalledOnce();

		const failureClient = { connect: vi.fn(), end: vi.fn() };
		await expect(
			withHyperdriveDatabase(
				"postgresql://hyperdrive",
				() => {
					throw new Error("boom");
				},
				{ createClient: () => failureClient, createDatabase: () => ({}) as AppDatabase },
			),
		).rejects.toThrow("boom");
		expect(failureClient.end).toHaveBeenCalledOnce();
	});
});
