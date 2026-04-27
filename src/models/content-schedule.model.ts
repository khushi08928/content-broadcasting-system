import { integer, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { contentTable } from "./content.model";
import { contentSlotsTable } from "./content-slot.model";

export const contentScheduleTable = pgTable("content_schedule", {
    id: uuid().primaryKey().defaultRandom(),
    content_id: uuid().notNull().references(() => contentTable.id, { onDelete: "cascade" }),
    slot_id: uuid().notNull().references(() => contentSlotsTable.id, { onDelete: "cascade" }),
    rotation_order: integer().notNull().default(0),
    duration: integer().notNull().default(300),
    created_at: timestamp().defaultNow()
});
