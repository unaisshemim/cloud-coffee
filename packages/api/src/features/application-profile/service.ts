import type { ApplicationProfile, ApplicationProfileCandidate } from "@reactive-resume/schema/application-profile";
import type { ProfileMergeOperation, ProfileMergePreview } from "./merge";
import { ORPCError } from "@orpc/client";
import { eq, sql } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import {
	applicationProfileSchema,
	defaultApplicationProfile,
	parseApplicationProfile,
} from "@reactive-resume/schema/application-profile";
import { applyProfileMerge, previewProfileMerge } from "./merge";

export type ApplicationProfileDocument = {
	profile: ApplicationProfile;
	revision: number;
};

function conflict(): never {
	throw new ORPCError("CONFLICT", {
		message: "Your profile changed after it was loaded. Refresh and try again.",
	});
}

export const applicationProfileService = {
	getDocument: async (input: { userId: string }): Promise<ApplicationProfileDocument> => {
		const [row] = await db
			.select({ data: schema.applicationProfile.data, revision: schema.applicationProfile.revision })
			.from(schema.applicationProfile)
			.where(eq(schema.applicationProfile.userId, input.userId))
			.limit(1);

		return row
			? { profile: parseApplicationProfile(row.data), revision: row.revision }
			: { profile: defaultApplicationProfile, revision: 0 };
	},

	get: async (input: { userId: string }): Promise<ApplicationProfile> => {
		const document = await applicationProfileService.getDocument(input);
		return document.profile;
	},

	update: async (input: {
		userId: string;
		profile: ApplicationProfile;
		revision: number;
	}): Promise<ApplicationProfileDocument> => {
		const current = await applicationProfileService.getDocument({ userId: input.userId });
		if (current.revision !== input.revision) conflict();

		const data = applicationProfileSchema.parse(input.profile);
		const [row] = await db
			.insert(schema.applicationProfile)
			.values({ userId: input.userId, data, revision: 1 })
			.onConflictDoUpdate({
				target: schema.applicationProfile.userId,
				set: {
					data,
					revision: sql`${schema.applicationProfile.revision} + 1`,
					updatedAt: new Date(),
				},
				setWhere: eq(schema.applicationProfile.revision, input.revision),
			})
			.returning({ data: schema.applicationProfile.data, revision: schema.applicationProfile.revision });

		if (!row) conflict();
		return { profile: parseApplicationProfile(row.data), revision: row.revision };
	},

	previewMerge: async (input: {
		userId: string;
		candidate: ApplicationProfileCandidate;
	}): Promise<ProfileMergePreview> => {
		const document = await applicationProfileService.getDocument({ userId: input.userId });
		return previewProfileMerge(document, input.candidate);
	},

	applyMerge: async (input: {
		userId: string;
		revision: number;
		operations: ProfileMergeOperation[];
		confirm: boolean;
	}): Promise<ApplicationProfileDocument> => {
		if (!input.confirm)
			throw new ORPCError("BAD_REQUEST", { message: "Confirm profile changes before applying them." });
		const document = await applicationProfileService.getDocument({ userId: input.userId });
		if (document.revision !== input.revision) conflict();
		const profile = applyProfileMerge(document.profile, input.operations);
		return applicationProfileService.update({ userId: input.userId, profile, revision: input.revision });
	},
};
