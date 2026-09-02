import type { SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { BetterAuthError } from "better-auth";
import { eq, or, sql } from "drizzle-orm";
import { getDatabase } from "@reactive-resume/db/runtime";
import * as schema from "@reactive-resume/db/schema";
import { generateId, toUsername } from "@reactive-resume/utils/string";

interface ExistingOAuthUser {
	id: string;
	email: string;
	emailVerified: boolean;
	username: string;
	displayUsername: string;
	name: string;
	image: string | null;
}

function lower<T extends AnyPgColumn>(column: T): SQL<T> {
	return sql`lower(${column})`;
}

async function findExistingUserByEmail(email: string): Promise<ExistingOAuthUser | undefined> {
	const normalizedEmail = email.trim().toLowerCase();

	const [existingUser] = await getDatabase()
		.select({
			id: schema.user.id,
			email: schema.user.email,
			emailVerified: schema.user.emailVerified,
			username: schema.user.username,
			displayUsername: schema.user.displayUsername,
			name: schema.user.name,
			image: schema.user.image,
		})
		.from(schema.user)
		.where(eq(lower(schema.user.email), normalizedEmail))
		.limit(1);

	return existingUser;
}

async function normalizeExistingUserEmail(userId: string, currentEmail: string, normalizedEmail: string) {
	if (currentEmail === normalizedEmail) return;

	await getDatabase().update(schema.user).set({ email: normalizedEmail }).where(eq(schema.user.id, userId));
}

function getEmailLocalPart(email: string): string {
	return email.split("@", 1)[0] ?? "";
}

function appendUsernameSuffix(base: string, suffix: string): string {
	const maxBaseLength = 64 - suffix.length;
	return `${base.slice(0, maxBaseLength)}${suffix}`;
}

async function isUsernameTaken(candidate: string): Promise<boolean> {
	const normalizedCandidate = candidate.trim().toLowerCase();

	const [existingUser] = await getDatabase()
		.select({ id: schema.user.id })
		.from(schema.user)
		.where(
			or(
				eq(lower(schema.user.username), normalizedCandidate),
				eq(lower(schema.user.displayUsername), normalizedCandidate),
			),
		)
		.limit(1);

	return Boolean(existingUser);
}

async function allocateUniqueUsername(email: string, preferredUsername?: string | null): Promise<string> {
	const emailLocalPart = getEmailLocalPart(email);
	const preferred = preferredUsername ? toUsername(preferredUsername) : "";
	const normalizedEmailLocalPart = toUsername(emailLocalPart);
	const baseUsername = preferred || normalizedEmailLocalPart || "user";

	if (!(await isUsernameTaken(baseUsername))) return baseUsername;

	const suffixedUsername = await findAvailableUsernameSuffix(baseUsername);
	if (suffixedUsername) return suffixedUsername;

	return appendUsernameSuffix(baseUsername, `-${generateId().slice(0, 8).toLowerCase()}`);
}

async function findAvailableUsernameSuffix(baseUsername: string, index = 1): Promise<string | null> {
	if (index > 999) return null;

	const candidate = appendUsernameSuffix(baseUsername, `-${index}`);
	if (!(await isUsernameTaken(candidate))) return candidate;

	return findAvailableUsernameSuffix(baseUsername, index + 1);
}

interface OAuthProfile {
	email?: string | null | undefined;
	name?: string | null | undefined;
	picture?: string | null | undefined;
}

interface OAuthMapperContext {
	email: string;
	emailLocalPart: string;
}

interface OAuthMapperOptions<TProfile extends OAuthProfile> {
	providerName: string;
	getName?: (profile: TProfile, context: OAuthMapperContext) => string | undefined | null;
	getImage?: (profile: TProfile) => string | undefined | null;
}

export function createProfileMapper<TProfile extends OAuthProfile>({
	providerName,
	getName,
	getImage,
}: OAuthMapperOptions<TProfile>) {
	return async (profile: TProfile) => {
		if (!profile.email) {
			throw new BetterAuthError(
				`${providerName} provider did not return an email address. This is required for user creation.`,
				{ cause: "EMAIL_REQUIRED" },
			);
		}

		const email = profile.email.trim().toLowerCase();
		const emailLocalPart = getEmailLocalPart(email);
		const context = { email, emailLocalPart };
		const existingUser = await findExistingUserByEmail(email);
		const image = getImage?.(profile) ?? undefined;

		if (existingUser) {
			const existingEmail = existingUser.email.trim().toLowerCase();
			await normalizeExistingUserEmail(existingUser.id, existingUser.email, existingEmail);

			// Better Auth 1.7 forbids `mapProfileToUser` from returning `id`; provider identity is
			// resolved by `accountSubject` and existing local users are matched by `account.accountLinking`.
			const existingImage = image ?? existingUser.image;

			return {
				name: existingUser.name,
				email: existingEmail,
				...(existingImage ? { image: existingImage } : {}),
				username: existingUser.username,
				displayUsername: existingUser.displayUsername,
				emailVerified: existingUser.emailVerified,
			};
		}

		const username = await allocateUniqueUsername(email);
		const mappedName = getName?.(profile, context)?.trim();

		return {
			name: mappedName || username || emailLocalPart,
			email,
			...(image ? { image } : {}),
			username,
			displayUsername: username,
			emailVerified: true,
		};
	};
}
