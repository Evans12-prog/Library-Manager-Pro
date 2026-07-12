import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const authorsTable = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
});

export const insertAuthorSchema = createInsertSchema(authorsTable).omit({ id: true });
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;
export type Author = typeof authorsTable.$inferSelect;
