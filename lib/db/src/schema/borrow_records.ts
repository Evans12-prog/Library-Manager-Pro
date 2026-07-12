import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { booksTable } from "./books";

export const borrowRecordsTable = pgTable("borrow_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  bookId: integer("book_id").notNull().references(() => booksTable.id),
  borrowedAt: timestamp("borrowed_at", { withTimezone: true }).notNull().defaultNow(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  returnedAt: timestamp("returned_at", { withTimezone: true }),
  renewCount: integer("renew_count").notNull().default(0),
  status: text("status").notNull().default("active"),
});

export const insertBorrowRecordSchema = createInsertSchema(borrowRecordsTable).omit({ id: true, borrowedAt: true });
export type InsertBorrowRecord = z.infer<typeof insertBorrowRecordSchema>;
export type BorrowRecord = typeof borrowRecordsTable.$inferSelect;
