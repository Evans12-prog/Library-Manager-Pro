import { Router } from "express";
import { db, reservationsTable, usersTable, booksTable, authorsTable, categoriesTable, publishersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListReservationsQueryParams,
  ListReservationsResponse,
  CreateReservationBody,
  CreateReservationResponse,
  CancelReservationParams,
  CancelReservationResponse,
} from "@workspace/api-zod";

const router = Router();

async function enrichReservation(r: typeof reservationsTable.$inferSelect) {
  const [[user], [book], allAuthors, allCategories, allPublishers] = await Promise.all([
    db.select().from(usersTable).where(eq(usersTable.id, r.userId)),
    db.select().from(booksTable).where(eq(booksTable.id, r.bookId)),
    db.select().from(authorsTable),
    db.select().from(categoriesTable),
    db.select().from(publishersTable),
  ]);

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.id, c]));
  const publisherMap = new Map(allPublishers.map(p => [p.id, p]));

  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt?.toISOString() ?? null,
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

router.get("/reservations", async (req, res): Promise<void> => {
  const parsed = ListReservationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, userId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (status) conditions.push(eq(reservationsTable.status, status));
  if (userId != null) conditions.push(eq(reservationsTable.userId, userId));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [records, [{ count }]] = await Promise.all([
    db.select().from(reservationsTable).where(whereClause).limit(limit).offset(offset).orderBy(reservationsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(reservationsTable).where(whereClause),
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
      createdAt: r.createdAt.toISOString(),
      expiresAt: r.expiresAt?.toISOString() ?? null,
      user: user ? {
        id: user.id, email: user.email, name: user.name, role: user.role,
        phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null,
        studentId: user.studentId ?? null, isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
      } : null,
      book: bookMap.get(r.bookId) ?? null,
    };
  });

  res.json(ListReservationsResponse.parse({ data, total: count, page, limit }));
});

router.post("/reservations", async (req, res): Promise<void> => {
  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, bookId } = parsed.data;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const [reservation] = await db.insert(reservationsTable).values({
    userId,
    bookId,
    status: "pending",
    expiresAt,
  }).returning();

  const enriched = await enrichReservation(reservation);
  res.status(201).json(CreateReservationResponse.parse(enriched));
});

router.post("/reservations/:id/cancel", async (req, res): Promise<void> => {
  const params = CancelReservationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [reservation] = await db.update(reservationsTable)
    .set({ status: "cancelled" })
    .where(eq(reservationsTable.id, params.data.id))
    .returning();

  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const enriched = await enrichReservation(reservation);
  res.json(CancelReservationResponse.parse(enriched));
});

export default router;
