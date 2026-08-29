import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = vi.hoisted(() => {
	const selectQueue: unknown[][] = [];
	const updateWhere = vi.fn();
	const updateSet = vi.fn((_value: unknown) => ({ where: updateWhere }));
	const where = vi.fn(() => ({ limit: vi.fn(() => selectQueue.shift() ?? []) }));
	const from = vi.fn(() => ({ where }));
	const select = vi.fn(() => ({ from }));
	const update = vi.fn(() => ({ set: updateSet }));

	return { selectQueue, select, from, where, update, updateSet, updateWhere };
});

vi.mock("@reactive-resume/db/client", () => ({
	db: { select: dbMock.select, update: dbMock.update },
}));

const { createProfileMapper } = await import("./oauth-profile");

beforeEach(() => {
	dbMock.selectQueue.length = 0;
	dbMock.select.mockClear();
	dbMock.from.mockClear();
	dbMock.where.mockClear();
	dbMock.update.mockClear();
	dbMock.updateSet.mockClear();
	dbMock.updateWhere.mockClear();
});

describe("createProfileMapper", () => {
	it("normalizes a matched Google user's email", async () => {
		dbMock.selectQueue.push([
			{
				id: "user-1",
				email: "Legacy.User@Example.COM",
				emailVerified: false,
				username: "legacy.user",
				displayUsername: "legacy.user",
				name: "Legacy User",
				image: "https://example.com/old.png",
			},
		]);

		const mapper = createProfileMapper({
			providerName: "Google",
			getImage: (profile) => profile.picture,
		});
		const result = await mapper({
			email: "legacy.user@example.com",
			name: "Google User",
			picture: "https://example.com/new.png",
		});

		expect(dbMock.updateSet).toHaveBeenCalledWith({ email: "legacy.user@example.com" });
		expect(result).toEqual({
			name: "Legacy User",
			email: "legacy.user@example.com",
			image: "https://example.com/new.png",
			username: "legacy.user",
			displayUsername: "legacy.user",
			emailVerified: false,
		});
	});

	it("preserves an existing normalized Google user", async () => {
		dbMock.selectQueue.push([
			{
				id: "user-1",
				email: "user@example.com",
				emailVerified: true,
				username: "user",
				displayUsername: "user",
				name: "User",
				image: null,
			},
		]);

		const mapper = createProfileMapper({ providerName: "Google" });
		const result = await mapper({ email: "USER@example.com", name: "Google User" });

		expect(dbMock.update).not.toHaveBeenCalled();
		expect(result.email).toBe("user@example.com");
		expect(result.name).toBe("User");
	});

	it("allocates a username from a new Google user's email", async () => {
		dbMock.selectQueue.push([], []);

		const mapper = createProfileMapper({
			providerName: "Google",
			getName: (profile) => profile.name,
			getImage: (profile) => profile.picture,
		});
		const result = await mapper({
			email: "New.User@Example.com",
			name: "New User",
			picture: "https://example.com/avatar.png",
		});

		expect(result).toEqual({
			name: "New User",
			email: "new.user@example.com",
			image: "https://example.com/avatar.png",
			username: "new.user",
			displayUsername: "new.user",
			emailVerified: true,
		});
	});

	it("rejects Google profiles without an email address", async () => {
		const mapper = createProfileMapper({ providerName: "Google" });
		await expect(mapper({ name: "No Email" })).rejects.toThrow("Google provider did not return an email address");
	});
});
