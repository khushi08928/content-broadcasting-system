import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./auth.model";

export const contentStatusEnum = pgEnum("content_status", [
    "pending",
    "approved",
    "rejected"
]);

export const contentTable = pgTable("content", {
    id: uuid().primaryKey().defaultRandom(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),
    subject: varchar({ length: 100 }).notNull(),
    file_url: text().notNull(),
    file_path: text(),
    file_type: varchar({ length: 50 }).notNull(),
    file_size: integer().notNull(),
    uploaded_by: uuid().notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    status: contentStatusEnum().notNull().default("pending"),
    rejection_reason: text(),
    approved_by: uuid().references(() => usersTable.id, { onDelete: "set null" }),
    approved_at: timestamp(),
    start_time: timestamp(),
    end_time: timestamp(),
    rotation_duration: integer().default(300),
    rotation_order: integer().default(0),
    created_at: timestamp().defaultNow()
});
