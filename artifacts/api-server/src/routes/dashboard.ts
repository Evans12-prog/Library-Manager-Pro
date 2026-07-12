import { Router } from "express";
import { db, booksTable, usersTable, borrowRecordsTable, finesTable, reservationsTable, activityLogsTable, categoriesTable, authorsTable, publishersTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";
import {
  GetDashboardStatsResponse,
  GetOverdueBooksQueryParams,
  GetOverdueBooksResponse,
  GetPopularBooksQueryParams,
  GetPopularBooksResponse,
  GetRecentActivityQueryParams,
  GetRecentActivityResponse,
  GetBorrowTrendResponse,
  GetCategoryDistributionResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [
    [{ totalBooks }],
    [{ availableBooks }],
    [{ totalUsers }],
    [{ activeBorrows }],
    [{ overdueBooks }],
    fineStats,
    [{ totalReservations }],
  ] = await Promise.all([
    db.select({ totalBooks: sql<number>`count(*)::int` }).from(booksTable),
    db.select({ availableBooks: sql<number>`sum(${booksTable.availableCopies})::int` }).from(booksTable),
    db.select({ totalUsers: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ activeBorrows: sql<number>`count(*)::int` }).from(borrowRecordsTable).where(eq(borrowRecordsTable.status, "active")),
    db.select({ overdueBooks: sql<number>`count(*)::int` }).from(borrowRecordsTable).where(eq(borrowRecordsTable.status, "overdue")),
    db.select({ totalFines: sql<number>`coalesce(sum(amount::numeric), 0)`, unpaidFines: sql<number>`coalesce(sum(case when status = 'unpaid' then amount::numeric else 0 end), 0)` }).from(finesTable),
    db.select({ totalReservations: sql<number>`count(*)::int` }).from(reservationsTable),
  ]);

  res.json(GetDashboardStatsResponse.parse({
    totalBooks: totalBooks ?? 0,
    availableBooks: availableBooks ?? 0,
    totalUsers: totalUsers ?? 0,
    activeBorrows: activeBorrows ?? 0,
    overdueBooks: overdueBooks ?? 0,
    totalFines: Number(fineStats[0]?.totalFines ?? 0),
    unpaidFines: Number(fineStats[0]?.unpaidFines ?? 0),
    totalReservations: totalReservations ?? 0,
  }));
});

router.get("/dashboard/overdue", async (req, res): Promise<void> => {
  const parsed = GetOverdueBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 10;

  const records = await db.select().from(borrowRecordsTable)
    .where(eq(borrowRecordsTable.status, "overdue"))
    .limit(limit)
    .orderBy(borrowRecordsTable.dueDate);

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
      returnedAt: null,
      user: user ? {
        id: user.id, email: user.email, name: user.name, role: user.role,
        phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
        studentId: user.studentId ?? null, isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      } : null,
      book: bookMap.get(r.bookId) ?? null,
    };
  });

  res.json(GetOverdueBooksResponse.parse(data));
});

router.get("/dashboard/popular-books", async (req, res): Promise<void> => {
  const parsed = GetPopularBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 10;

  const results = await db.select({
    bookId: borrowRecordsTable.bookId,
    borrowCount: sql<number>`count(*)::int`,
  }).from(borrowRecordsTable)
    .groupBy(borrowRecordsTable.bookId)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);

  const allBooks = await db.select().from(booksTable);
  const allAuthors = await db.select().from(authorsTable);

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const bookMap = new Map(allBooks.map(b => [b.id, b]));

  const data = results.map(r => {
    const book = bookMap.get(r.bookId);
    const author = book?.authorId ? authorMap.get(book.authorId) : null;
    return {
      bookId: r.bookId,
      title: book?.title ?? "Unknown",
      coverUrl: book?.coverUrl ?? null,
      borrowCount: r.borrowCount,
      authorName: author?.name ?? null,
    };
  });

  res.json(GetPopularBooksResponse.parse(data));
});

router.get("/dashboard/recent-activity", async (req, res): Promise<void> => {
  const parsed = GetRecentActivityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = parsed.data.limit ?? 20;

  const logs = await db.select().from(activityLogsTable)
    .orderBy(desc(activityLogsTable.createdAt))
    .limit(limit);

  const allUsers = await db.select().from(usersTable);
  const userMap = new Map(allUsers.map(u => [u.id, u]));

  const data = logs.map(l => {
    const user = l.userId ? userMap.get(l.userId) : null;
    return {
      ...l,
      createdAt: l.createdAt.toISOString(),
      user: user ? {
        id: user.id, email: user.email, name: user.name, role: user.role,
        phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
        studentId: user.studentId ?? null, isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      } : null,
    };
  });

  res.json(GetRecentActivityResponse.parse(data));
});

router.get("/dashboard/borrow-trend", async (_req, res): Promise<void> => {
  const rows = await db.select({
    date: sql<string>`date_trunc('day', ${borrowRecordsTable.borrowedAt})::date::text`,
    count: sql<number>`count(*)::int`,
  }).from(borrowRecordsTable)
    .where(sql`${borrowRecordsTable.borrowedAt} >= now() - interval '30 days'`)
    .groupBy(sql`date_trunc('day', ${borrowRecordsTable.borrowedAt})`)
    .orderBy(sql`date_trunc('day', ${borrowRecordsTable.borrowedAt})`);

  res.json(GetBorrowTrendResponse.parse(rows));
});

router.get("/dashboard/category-distribution", async (_req, res): Promise<void> => {
  const categories = await db.select().from(categoriesTable);
  const books = await db.select().from(booksTable);

  const data = categories.map(c => ({
    categoryName: c.name,
    bookCount: books.filter(b => b.categoryId === c.id).length,
    color: c.color ?? null,
  }));

  res.json(GetCategoryDistributionResponse.parse(data));
});

export default router;
