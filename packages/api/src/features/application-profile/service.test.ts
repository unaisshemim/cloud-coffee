import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";

const { dbMock, state } = vi.hoisted(() => {
	const state = {
		selectedRows: [] as unknown[],
		whereArg: undefined as unknown,
		insertValues: undefined as unknown,
		conflictConfig: undefined as unknown,
		returningRows: [] as unknown[],
	};

	const selectQuery = {
		from: vi.fn(() => selectQuery),
		where: vi.fn((arg: unknown) => {
			state.whereArg = arg;
			return selectQuery;
		}),
		limit: vi.fn(async () => state.selectedRows),
	};

	const insertQuery = {
		values: vi.fn((values: unknown) => {
			state.insertValues = values;
			return insertQuery;
		}),
		onConflictDoUpdate: vi.fn((config: unknown) => {
			state.conflictConfig = config;
			return insertQuery;
		}),
		returning: vi.fn(async () => state.returningRows),
	};

	return {
		state,
		dbMock: {
			select: vi.fn(() => selectQuery),
			insert: vi.fn(() => insertQuery),
		},
	};
});

vi.mock("@reactive-resume/db/client", () => ({ db: dbMock }));
vi.mock("@reactive-resume/db/schema", () => ({
	applicationProfile: {
		userId: "application_profile.user_id",
		data: "application_profile.data",
		updatedAt: "application_profile.updated_at",
	},
}));
vi.mock("drizzle-orm", () => ({
	eq: (left: unknown, right: unknown) => ({ type: "eq", left, right }),
}));

const { applicationProfileService } = await import("./service");

describe("applicationProfileService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		state.selectedRows = [];
		state.returningRows = [];
		state.whereArg = undefined;
		state.insertValues = undefined;
		state.conflictConfig = undefined;
	});

	it("returns defaults when the user has no saved profile", async () => {
		await expect(applicationProfileService.get({ userId: "user-1" })).resolves.toEqual(defaultApplicationProfile);
		expect(state.whereArg).toEqual({
			type: "eq",
			left: "application_profile.user_id",
			right: "user-1",
		});
	});

	it("upserts profile data under the authenticated user", async () => {
		const data = {
			...defaultApplicationProfile,
			skills: ["TypeScript"],
		};
		state.returningRows = [{ data }];

		await expect(applicationProfileService.update({ userId: "user-1", data })).resolves.toEqual(data);
		expect(state.insertValues).toEqual({ userId: "user-1", data });
		expect(state.conflictConfig).toMatchObject({ target: "application_profile.user_id" });
	});
});
