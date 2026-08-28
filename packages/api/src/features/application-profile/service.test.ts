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
		revision: "application_profile.revision",
		updatedAt: "application_profile.updated_at",
	},
}));
vi.mock("drizzle-orm", () => ({
	eq: (left: unknown, right: unknown) => ({ type: "eq", left, right }),
	sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ type: "sql", strings: [...strings], values }),
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

	it("returns default document at revision zero when the user has no saved profile", async () => {
		await expect(applicationProfileService.getDocument({ userId: "user-1" })).resolves.toEqual({
			profile: defaultApplicationProfile,
			revision: 0,
		});
		expect(state.whereArg).toEqual({
			type: "eq",
			left: "application_profile.user_id",
			right: "user-1",
		});
	});

	it("upserts profile data at the expected revision", async () => {
		const profile = {
			...defaultApplicationProfile,
			skills: ["TypeScript"],
		};
		state.selectedRows = [{ data: defaultApplicationProfile, revision: 2 }];
		state.returningRows = [{ data: profile, revision: 3 }];

		await expect(applicationProfileService.update({ userId: "user-1", profile, revision: 2 })).resolves.toEqual({
			profile,
			revision: 3,
		});
		expect(state.insertValues).toMatchObject({ userId: "user-1", data: profile, revision: 1 });
		expect(state.conflictConfig).toMatchObject({
			target: "application_profile.user_id",
			setWhere: { type: "eq", left: "application_profile.revision", right: 2 },
		});
	});

	it("rejects a stale revision without writing", async () => {
		state.selectedRows = [{ data: defaultApplicationProfile, revision: 4 }];

		await expect(
			applicationProfileService.update({ userId: "user-1", profile: defaultApplicationProfile, revision: 3 }),
		).rejects.toMatchObject({ code: "CONFLICT" });
		expect(dbMock.insert).not.toHaveBeenCalled();
	});
});
