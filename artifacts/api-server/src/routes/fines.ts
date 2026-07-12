import { Router } from "express";
import { db, finesTable, usersTable, borrowRecordsTable, booksTable, authorsTable, categoriesTable, publishersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListFinesQueryParams,
  ListFinesResponse,
  PayFineParams,
  PayFineResponse,
} from "@workspace/api-zod";

const router = Router();

async function enrichFine(f: typeof finesTable.$inferSelect) {
  const [[user], [bRecord]] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, f.userId)),
    db.select().from(borrowRecordsTable).where(eq(borrowRecordsTable.id, f.borrowRecordId)),
  ]);

  let borrowRecord = null;
  if (bRecord) {
    const [[book], allAuthors, allCategories, allPublishers] = await Promise.all([
      db.select().from(booksTable).where(eq(booksTable.id, bRecord.bookId)),
      db.select().from(authorsTable),
      db.select().from(categoriesTable),
      db.select().from(publishersTable),
    ]);

    const authorMap = new Map(allAuthors.map(a => [a.id, a]));
    const categoryMap = new Map(allCategories.map(c => [c.id, c]));
    const publisherMap = new Map(allPublishers.map(p => [p.id, p]));

    borrowRecord = {
      ...bRecord,
      borrowedAt: bRecord.borrowedAt.toISOString(),
      dueDate: bRecord.dueDate.toISOString(),
      returnedAt: bRecord.returnedAt?.toISOString() ?? null,
      user: null,
      book: book ? {
        ...book,
        createdAt: book.createdAt.toISOString(),
        author: book.authorId ? (authorMap.get(book.authorId) ?? null) : null,
        category: book.categoryId ? (categoryMap.get(book.categoryId) ?? null) : null,
        publisher: book.publisherId ? (publisherMap.get(book.publisherId) ?? null) : null,
      } : null,
    };
  }

  return {
    ...f,
    amount: parseFloat(f.amount),
    createdAt: f.createdAt.toISOString(),
    paidAt: f.paidAt?.toISOString() ?? null,
    user: user ? {
      id: user.id, email: user.email, name: user.name, role: user.role,
      phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
      studentId: user.studentId ?? null, isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    } : null,
    borrowRecord,
  };
}

router.get("/fines", async (req, res): Promise<void> => {
  const parsed = ListFinesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, userId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(finesTable.status, status));
  if (userId != null) conditions.push(eq(finesTable.userId, userId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [fines, [{ count }]] = await Promise.all([
    db.select().from(finesTable).where(whereClause).limit(limit).offset(offset).orderBy(finesTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(finesTable).where(whereClause),
  ]);

  const [allUsers, allBorrowRecords, allBooks, allAuthors, allCategories, allPublishers] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(borrowRecordsTable),
    db.select().from(booksTable),
    db.select().from(authorsTable),
    db.select().from(categoriesTable),
    db.select().from(publishersTable),
  ]);

  const userMap = new Map(allUsers.map(u => [u.id, u]));
  const borrowMap = new Map(allBorrowRecords.map(b => [b.id, b]));
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

  const data = fines.map(f => {
    const user = userMap.get(f.userId);
    const bRecord = borrowMap.get(f.borrowRecordId);
    return {
      ...f,
      amount: parseFloat(f.amount),
      createdAt: f.createdAt.toISOString(),
      paidAt: f.paidAt?.toISOString() ?? null,
      user: user ? {
        id: user.id, email: user.email, name: user.name, role: user.role,
        phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
        studentId: user.studentId ?? null, isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      } : null,
      borrowRecord: bRecord ? {
        ...bRecord,
        borrowedAt: bRecord.borrowedAt.toISOString(),
        dueDate: bRecord.dueDate.toISOString(),
        returnedAt: bRecord.returnedAt?.toISOString() ?? null,
        user: null,
        book: bookMap.get(bRecord.bookId) ?? null,
      } : null,
    };
  });

  res.json(ListFinesResponse.parse({ data, total: count, page, limit }));
});

router.post("/fines/:id/pay", async (req, res): Promise<void> => {
  const params = PayFineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [fine] = await db.update(finesTable)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(finesTable.id, params.data.id))
    .returning();

  if (!fine) {
    res.status(404).json({ error: "Fine not found" });
    return;
  }

  const enriched = await enrichFine(fine);
  res.json(PayFineResponse.parse(enriched));
});

export default router;
