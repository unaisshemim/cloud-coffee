import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { AsyncLocalStorage } from "node:async_hooks";

export type AppDatabase = NodePgDatabase;

const databaseRuntime = new AsyncLocalStorage<AppDatabase>();
let defaultDatabase: AppDatabase | undefined;

export function setDefaultDatabase(database: AppDatabase): void {
	defaultDatabase = database;
}

export function getDatabase(): AppDatabase {
	const database = databaseRuntime.getStore() ?? defaultDatabase;
	if (!database) throw new Error("Database runtime is not configured");
	return database;
}

export function runWithDatabase<T>(database: AppDatabase, callback: () => T): T {
	return databaseRuntime.run(database, callback);
}
