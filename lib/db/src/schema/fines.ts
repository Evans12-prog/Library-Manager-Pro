import { pgTable, serial, timestamp, integer, text, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { borrowRecordsTable } from "./borrow_records";

export const finesTable = pgTable("fines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  borrowRecordId: integer("borrow_record_id").notNull().references(() => borrowRecordsTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFineSchema = createInsertSchema(finesTable).omit({ id: true, createdAt: true });
export type InsertFine = z.infer<typeof insertFineSchema>;
export type Fine = typeof finesTable.$inferSelect;
