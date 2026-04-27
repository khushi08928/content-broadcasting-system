import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const contentSlotsTable = pgTable("content_slots", {
    id: uuid().primaryKey().defaultRandom(),
    subject: varchar({ length: 100 }).notNull().unique(),
    created_at: timestamp().defaultNow()
});
