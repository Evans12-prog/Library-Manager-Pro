import { Router } from "express";
import { db, borrowRecordsTable, booksTable, usersTable, finesTable, activityLogsTable, authorsTable, categoriesTable, publishersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListBorrowRecordsQueryParams,
  ListBorrowRecordsResponse,
  CreateBorrowRecordBody,
  CreateBorrowRecordResponse,
  ReturnBookParams,
  ReturnBookResponse,
  RenewBookParams,
  RenewBookResponse,
} from "@workspace/api-zod";

const router = Router();

async function enrichRecord(r: typeof borrowRecordsTable.$inferSelect) {
  const [[user], allBooks, allAuthors, allCategories, allPublishers] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, r.userId)),
    db.select().from(booksTable),
    db.select().from(authorsTable),
    db.select().from(categoriesTable),
    db.select().from(publishersTable),
  ]);

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.id, c]));
  const publisherMap = new Map(allPublishers.map(p => [p.id, p]));
  const book = allBooks.find(b => b.id === r.bookId);

  return {
    ...r,
    borrowedAt: r.borrowedAt.toISOString(),
    dueDate: r.dueDate.toISOString(),
    returnedAt: r.returnedAt?.toISOString() ?? null,
    user: user ? {
      id: user.id, email: user.email, name: user.name, role: user.role,
      phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
      studentId: user.studentId ?? null, isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    } : null,
    book: book ? {
      ...book,
      createdAt: book.createdAt.toISOString(),
      author: book.authorId ? (authorMap.get(book.authorId) ?? null) : null,
      category: book.categoryId ? (categoryMap.get(book.categoryId) ?? null) : null,
      publisher: book.publisherId ? (publisherMap.get(book.publisherId) ?? null) : null,
    } : null,
  };
}

router.get("/borrow-records", async (req, res): Promise<void> => {
  const parsed = ListBorrowRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, userId, bookId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  // Auto-mark overdue records
  const now = new Date();
  await db.update(borrowRecordsTable)
    .set({ status: "overdue" })
    .where(and(
      eq(borrowRecordsTable.status, "active"),
      sql`${borrowRecordsTable.dueDate} < ${now.toISOString()}`
    ));

  const conditions = [];
  if (status) conditions.push(eq(borrowRecordsTable.status, status));
  if (userId != null) conditions.push(eq(borrowRecordsTable.userId, userId));
  if (bookId != null) conditions.push(eq(borrowRecordsTable.bookId, bookId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [records, [{ count }]] = await Promise.all([
    db.select().from(borrowRecordsTable).where(whereClause).limit(limit).offset(offset).orderBy(borrowRecordsTable.borrowedAt),
    db.select({ count: sql<number>`count(*)::int` }).from(borrowRecordsTable).where(whereClause),
  ]);

  const [allUsers, allBooks, allAuthors, allCategories, allPublishers] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(booksTable),
    db.select().from(authorsTable),
    db.select().from(categoriesTable),
    db.select().from(publishersTable),
  ]);

  const userMap = new Map(allUsers.map(u => [u.id, u]));
  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.id, c]));
  const publisherMap = new Map(allPublishers.map(p => [p.id, p]));
  const bookMap = new Map(allBooks.map(b => [b.id, {
    ...b,
    createdAt: b.createdAt.toISOString(),
    author: b.authorId ? (authorMap.get(b.authorId) ?? null) : null,
    category: b.categoryId ? (categoryMap.get(b.categoryId) ?? null) : null,
    publisher: b.publisherId ? (publisherMap.get(b.publisherId) ?? null) : null,
  }]));

  const data = records.map(r => {
    const user = userMap.get(r.userId);
    return {
      ...r,
      borrowedAt: r.borrowedAt.toISOString(),
      dueDate: r.dueDate.toISOString(),
      returnedAt: r.returnedAt?.toISOString() ?? null,
      user: user ? {
        id: user.id, email: user.email, name: user.name, role: user.role,
        phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
        studentId: user.studentId ?? null, isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      } : null,
      book: bookMap.get(r.bookId) ?? null,
    };
  });

  res.json(ListBorrowRecordsResponse.parse({ data, total: count, page, limit }));
});

router.post("/borrow-records", async (req, res): Promise<void> => {
  const parsed = CreateBorrowRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, bookId, durationDays = 14 } = parsed.data;

  // Check availability
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, bookId));
  if (!book || book.availableCopies <= 0) {
    res.status(400).json({ error: "Book not available" });
    return;
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + durationDays);

  const [[record]] = await Promise.all([
    db.insert(borrowRecordsTable).values({ userId, bookId, dueDate, status: "active" }).returning(),
    db.update(booksTable).set({ availableCopies: book.availableCopies - 1 }).where(eq(booksTable.id, bookId)),
    db.insert(activityLogsTable).values({ userId, action: "book_borrowed", entityType: "book", entityId: bookId, details: `Borrowed "${book.title}"` }),
  ]);

  const enriched = await enrichRecord(record);
  res.status(201).json(CreateBorrowRecordResponse.parse(enriched));
});

router.post("/borrow-records/:id/return", async (req, res): Promise<void> => {
  const params = ReturnBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db.select().from(borrowRecordsTable).where(eq(borrowRecordsTable.id, params.data.id));
  if (!record) {
    res.status(404).json({ error: "Borrow record not found" });
    return;
  }

  const now = new Date();
  const [updated] = await db.update(borrowRecordsTable)
    .set({ status: "returned", returnedAt: now })
    .where(eq(borrowRecordsTable.id, params.data.id))
    .returning();

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, record.bookId));
  if (book) {
    await db.update(booksTable).set({ availableCopies: book.availableCopies + 1 }).where(eq(booksTable.id, book.id));
  }

  // Auto-generate fine if overdue
  if (record.dueDate < now) {
    const daysLate = Math.ceil((now.getTime() - record.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const fineAmount = (daysLate * 0.50).toFixed(2);
    await db.insert(finesTable).values({
      userId: record.userId,
      borrowRecordId: record.id,
      amount: fineAmount,
      status: "unpaid",
    });
  }

  await db.insert(activityLogsTable).values({
    userId: record.userId,
    action: "book_returned",
    entityType: "book",
    entityId: record.bookId,
    details: `Returned book`,
  });

  const enriched = await enrichRecord(updated);
  res.json(ReturnBookResponse.parse(enriched));
});

router.post("/borrow-records/:id/renew", async (req, res): Promise<void> => {
  const params = RenewBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db.select().from(borrowRecordsTable).where(eq(borrowRecordsTable.id, params.data.id));
  if (!record) {
    res.status(404).json({ error: "Borrow record not found" });
    return;
  }

  if (record.renewCount >= 2) {
    res.status(400).json({ error: "Maximum renewals reached" });
    return;
  }

  const newDueDate = new Date(record.dueDate);
  newDueDate.setDate(newDueDate.getDate() + 14);

  const [updated] = await db.update(borrowRecordsTable)
    .set({ dueDate: newDueDate, renewCount: record.renewCount + 1, status: "active" })
    .where(eq(borrowRecordsTable.id, params.data.id))
    .returning();

  const enriched = await enrichRecord(updated);
  res.json(RenewBookResponse.parse(enriched));
});

export default router;
