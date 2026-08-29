import type { ApplicationProfile } from "@reactive-resume/schema/application-profile";
import * as pg from "drizzle-orm/pg-core";
import { defaultApplicationProfile } from "@reactive-resume/schema/application-profile";
import { user } from "./auth";

export const applicationProfile = pg.pgTable("application_profile", {
	userId: pg
		.text("user_id")
		.primaryKey()
		.references(() => user.id, { onDelete: "cascade" }),
	data: pg
		.jsonb("data")
		.notNull()
		.$type<ApplicationProfile>()
		.$defaultFn(() => defaultApplicationProfile),
	revision: pg.integer("revision").notNull().default(1),
	createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: pg
		.timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow()
		.$onUpdate(() => /* @__PURE__ */ new Date()),
});
