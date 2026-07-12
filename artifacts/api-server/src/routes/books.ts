import { Router } from "express";
import { db, booksTable, authorsTable, categoriesTable, publishersTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  ListBooksQueryParams,
  ListBooksResponse,
  CreateBookBody,
  CreateBookResponse,
  GetBookParams,
  GetBookResponse,
  UpdateBookParams,
  UpdateBookBody,
  UpdateBookResponse,
  DeleteBookParams,
} from "@workspace/api-zod";

const router = Router();

async function fetchBookWithRelations(id: number) {
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, id));
  if (!book) return null;

  const [author] = book.authorId
    ? await db.select().from(authorsTable).where(eq(authorsTable.id, book.authorId))
    : [null];
  const [category] = book.categoryId
    ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, book.categoryId))
    : [null];
  const [publisher] = book.publisherId
    ? await db.select().from(publishersTable).where(eq(publishersTable.id, book.publisherId))
    : [null];

  return {
    ...book,
    createdAt: book.createdAt.toISOString(),
    author: author || null,
    category: category || null,
    publisher: publisher || null,
  };
}

router.get("/books", async (req, res): Promise<void> => {
  const parsed = ListBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, categoryId, authorId, publisherId, available, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (search) conditions.push(ilike(booksTable.title, `%${search}%`));
  if (categoryId != null) conditions.push(eq(booksTable.categoryId, categoryId));
  if (authorId != null) conditions.push(eq(booksTable.authorId, authorId));
  if (publisherId != null) conditions.push(eq(booksTable.publisherId, publisherId));
  if (available === true) conditions.push(sql`${booksTable.availableCopies} > 0`);
  if (available === false) conditions.push(eq(booksTable.availableCopies, 0));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const books = await db.select().from(booksTable)
    .where(whereClause)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(booksTable).where(whereClause);

  const [allAuthors, allCategories, allPublishers] = await Promise.all([
    db.select().from(authorsTable),
    db.select().from(categoriesTable),
    db.select().from(publishersTable),
  ]);

  const authorMap = new Map(allAuthors.map(a => [a.id, a]));
  const categoryMap = new Map(allCategories.map(c => [c.id, c]));
  const publisherMap = new Map(allPublishers.map(p => [p.id, p]));

  const data = books.map(b => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
    author: b.authorId ? (authorMap.get(b.authorId) ?? null) : null,
    category: b.categoryId ? (categoryMap.get(b.categoryId) ?? null) : null,
    publisher: b.publisherId ? (publisherMap.get(b.publisherId) ?? null) : null,
  }));

  res.json(ListBooksResponse.parse({ data, total: count, page, limit }));
});

router.post("/books", async (req, res): Promise<void> => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { authorId, categoryId, publisherId, ...rest } = parsed.data;
  const [book] = await db.insert(booksTable).values({
    ...rest,
    availableCopies: rest.totalCopies,
    authorId: authorId ?? null,
    categoryId: categoryId ?? null,
    publisherId: publisherId ?? null,
  }).returning();

  const fullBook = await fetchBookWithRelations(book.id);
  res.status(201).json(CreateBookResponse.parse(fullBook));
});

router.get("/books/:id", async (req, res): Promise<void> => {
  const params = GetBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const book = await fetchBookWithRelations(params.data.id);
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.json(GetBookResponse.parse(book));
});

router.patch("/books/:id", async (req, res): Promise<void> => {
  const params = UpdateBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { authorId, categoryId, publisherId, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };
  if (authorId !== undefined) updateData.authorId = authorId;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (publisherId !== undefined) updateData.publisherId = publisherId;

  const [updated] = await db.update(booksTable)
    .set(updateData)
    .where(eq(booksTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const fullBook = await fetchBookWithRelations(updated.id);
  res.json(UpdateBookResponse.parse(fullBook));
});

router.delete("/books/:id", async (req, res): Promise<void> => {
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(booksTable).where(eq(booksTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
