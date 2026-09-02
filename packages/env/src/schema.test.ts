import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./schema";

const minimumEnv = {
	APP_URL: "https://resume.example",
	DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres",
	AUTH_SECRET: "secret",
};

describe("parseServerEnv", () => {
	it("parses minimum configuration and applies defaults", () => {
		expect(parseServerEnv(minimumEnv)).toMatchObject({
			APP_URL: "https://resume.example",
			SERVER_PORT: 3001,
			FLAG_DISABLE_IMAGE_PROCESSING: false,
			SMTP_PORT: 587,
		});
	});

	it("coerces string booleans used by process and Worker variables", () => {
		expect(
			parseServerEnv({
				...minimumEnv,
				FLAG_DISABLE_IMAGE_PROCESSING: "true",
				S3_DISABLE_ACL: "1",
			}),
		).toMatchObject({ FLAG_DISABLE_IMAGE_PROCESSING: true, S3_DISABLE_ACL: true });
	});

	it("treats empty optional bindings as absent", () => {
		expect(parseServerEnv({ ...minimumEnv, GOOGLE_CLIENT_ID: "" }).GOOGLE_CLIENT_ID).toBeUndefined();
	});

	it("rejects invalid application URLs", () => {
		expect(() => parseServerEnv({ ...minimumEnv, APP_URL: "not-a-url" })).toThrow();
	});

	it("does not apply Node filesystem policy to local-storage values", () => {
		expect(parseServerEnv({ ...minimumEnv, LOCAL_STORAGE_PATH: "relative/data" }).LOCAL_STORAGE_PATH).toBe(
			"relative/data",
		);
	});
});
