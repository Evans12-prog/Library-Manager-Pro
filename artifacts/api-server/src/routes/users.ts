import { Router } from "express";
import { db, usersTable, borrowRecordsTable, booksTable, authorsTable, categoriesTable, publishersTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  CreateUserBody,
  CreateUserResponse,
  GetUserParams,
  GetUserResponse,
  UpdateUserParams,
  UpdateUserBody,
  UpdateUserResponse,
  DeleteUserParams,
  GetUserBorrowHistoryParams,
  GetUserBorrowHistoryResponse,
} from "@workspace/api-zod";
import { hashPassword } from "../lib/auth";

const router = Router();

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    avatarUrl: user.avatarUrl ?? null,
    studentId: user.studentId ?? null,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { role, search, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (search) conditions.push(ilike(usersTable.name, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [users, [{ count }]] = await Promise.all([
    db.select().from(usersTable).where(whereClause).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(whereClause),
  ]);

  res.json(ListUsersResponse.parse({ data: users.map(formatUser), total: count, page, limit }));
});

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { password, ...rest } = parsed.data;
  const passwordHash = hashPassword(password);

  const [user] = await db.insert(usersTable).values({
    ...rest,
    passwordHash,
    phone: rest.phone ?? null,
    studentId: rest.studentId ?? null,
  }).returning();

  res.status(201).json(CreateUserResponse.parse(formatUser(user)));
});

router.get("/users/:id", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(GetUserResponse.parse(formatUser(user)));
});

router.patch("/users/:id", async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(UpdateUserResponse.parse(formatUser(user)));
});

router.delete("/users/:id", async (req, res): Promise<void> => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/users/:id/borrow-history", async (req, res): Promise<void> => {
  const params = GetUserBorrowHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const records = await db.select().from(borrowRecordsTable)
    .where(eq(borrowRecordsTable.userId, params.data.id))
    .orderBy(borrowRecordsTable.borrowedAt);

  const allBooks = await db.select().from(booksTable);
  const allAuthors = await db.select().from(authorsTable);
  const allCategories = await db.select().from(categoriesTable);
  const allPublishers = await db.select().from(publishersTable);

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

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));

  const data = records.map(r => ({
    ...r,
    borrowedAt: r.borrowedAt.toISOString(),
    dueDate: r.dueDate.toISOString(),
    returnedAt: r.returnedAt?.toISOString() ?? null,
    user: user ? formatUser(user) : null,
    book: bookMap.get(r.bookId) ?? null,
  }));

  res.json(GetUserBorrowHistoryResponse.parse(data));
});

export default router;
