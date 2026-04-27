import {boolean,pgEnum,pgTable,text,timestamp,uuid,varchar} from "drizzle-orm/pg-core";

export const userRoleEnum=pgEnum("users_role",[
        "teacher",
        "principal"
]);

export const usersTable = pgTable("users",{
    id: uuid().primaryKey().defaultRandom(),
    name: varchar({length:25}).notNull(),
    email: text().notNull().unique(),
    passwordhash: text().notNull(),
    role: userRoleEnum().notNull(),
    created_at:timestamp().defaultNow()
});