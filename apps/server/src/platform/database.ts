import type { AppDatabase } from "@reactive-resume/db/runtime";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { runWithDatabase } from "@reactive-resume/db/runtime";

type DatabaseClient = {
	connect(): Promise<unknown>;
	end(): Promise<unknown>;
};

type HyperdriveDatabaseDependencies = {
	createClient(connectionString: string): DatabaseClient;
	createDatabase(client: DatabaseClient): AppDatabase;
};

const defaultDependencies: HyperdriveDatabaseDependencies = {
	createClient: (connectionString) => new Client({ connectionString }),
	createDatabase: (client) => drizzle({ client: client as Client }),
};

export async function createHyperdriveDatabase(
	connectionString: string,
	dependencies: HyperdriveDatabaseDependencies = defaultDependencies,
) {
	const client = dependencies.createClient(connectionString);
	let database: AppDatabase;
	try {
		await client.connect();
		database = dependencies.createDatabase(client);
	} catch (error) {
		try {
			await client.end();
		} catch {
			// Preserve the original initialization failure.
		}
		throw error;
	}

	let closed = false;
	return {
		database,
		async close() {
			if (closed) return;
			closed = true;
			await client.end();
		},
	};
}

export async function withHyperdriveDatabase<T>(
	connectionString: string,
	callback: () => T | Promise<T>,
	dependencies: HyperdriveDatabaseDependencies = defaultDependencies,
): Promise<T> {
	const connection = await createHyperdriveDatabase(connectionString, dependencies);
	try {
		return await runWithDatabase(connection.database, callback);
	} finally {
		await connection.close();
	}
}
