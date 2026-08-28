import * as pg from "drizzle-orm/pg-core";
import { generateId } from "@reactive-resume/utils/string";
import { user } from "./auth";

export const aiProvider = pg.pgTable(
	"ai_providers",
	{
		id: pg
			.text("id")
			.notNull()
			.primaryKey()
			.$defaultFn(() => generateId()),
		userId: pg
			.text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		label: pg.text("label").notNull(),
		provider: pg.text("provider").notNull(),
		model: pg.text("model").notNull(),
		baseUrl: pg.text("base_url"),
		encryptedApiKey: pg.text("encrypted_api_key").notNull(),
		apiKeySalt: pg.text("api_key_salt").notNull(),
		apiKeyHash: pg.text("api_key_hash").notNull(),
		apiKeyPreview: pg.text("api_key_preview").notNull(),
		testStatus: pg.text("test_status").notNull().default("untested"),
		testError: pg.text("test_error"),
		lastTestedAt: pg.timestamp("last_tested_at", { withTimezone: true }),
		lastUsedAt: pg.timestamp("last_used_at", { withTimezone: true }),
		enabled: pg.boolean("enabled").notNull().default(false),
		createdAt: pg.timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: pg
			.timestamp("updated_at", { withTimezone: true })
			.notNull()
			.defaultNow()
			.$onUpdate(() => /* @__PURE__ */ new Date()),
	},
	(t) => [
		pg.index().on(t.userId, t.enabled),
		pg.index().on(t.userId, t.lastUsedAt.desc()),
		pg.index().on(t.userId, t.createdAt.asc()),
	],
);
