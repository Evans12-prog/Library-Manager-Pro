import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const publishersTable = pgTable("publishers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  website: text("website"),
});

export const insertPublisherSchema = createInsertSchema(publishersTable).omit({ id: true });
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type Publisher = typeof publishersTable.$inferSelect;
