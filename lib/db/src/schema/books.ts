import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { authorsTable } from "./authors";
import { categoriesTable } from "./categories";
import { publishersTable } from "./publishers";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  isbn: text("isbn").notNull().unique(),
  description: text("description"),
  coverUrl: text("cover_url"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  publishedYear: integer("published_year"),
  language: text("language").notNull().default("English"),
  shelfLocation: text("shelf_location"),
  authorId: integer("author_id").references(() => authorsTable.id),
  categoryId: integer("category_id").references(() => categoriesTable.id),
  publisherId: integer("publisher_id").references(() => publishersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
