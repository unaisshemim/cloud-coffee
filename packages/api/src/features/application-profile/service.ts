import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";
import { eq } from "drizzle-orm";
import { db } from "@reactive-resume/db/client";
import * as schema from "@reactive-resume/db/schema";
import { applicationProfileSchema, defaultApplicationProfile } from "@reactive-resume/schema/application-profile";

export const applicationProfileService = {
	get: async (input: { userId: string }): Promise<ApplicationProfile> => {
		const [row] = await db
			.select({ data: schema.applicationProfile.data })
			.from(schema.applicationProfile)
			.where(eq(schema.applicationProfile.userId, input.userId))
			.limit(1);

		return row ? applicationProfileSchema.parse(row.data) : defaultApplicationProfile;
	},

	update: async (input: { userId: string; data: ApplicationProfile }): Promise<ApplicationProfile> => {
		const data = applicationProfileSchema.parse(input.data);
		const [row] = await db
			.insert(schema.applicationProfile)
			.values({ userId: input.userId, data })
			.onConflictDoUpdate({
				target: schema.applicationProfile.userId,
				set: { data, updatedAt: new Date() },
			})
			.returning({ data: schema.applicationProfile.data });

		if (!row) throw new Error("APPLICATION_PROFILE_UPDATE_FAILED");
		return applicationProfileSchema.parse(row.data);
	},
};
