import { Router } from "express";
import { db, authorsTable, categoriesTable, publishersTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import {
  ListAuthorsQueryParams,
  ListAuthorsResponse,
  CreateAuthorBody,
  CreateAuthorResponse,
  UpdateAuthorParams,
  UpdateAuthorBody,
  UpdateAuthorResponse,
  DeleteAuthorParams,
  ListCategoriesResponse,
  CreateCategoryBody,
  CreateCategoryResponse,
  UpdateCategoryParams,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  DeleteCategoryParams,
  ListPublishersResponse,
  CreatePublisherBody,
  CreatePublisherResponse,
  UpdatePublisherParams,
  UpdatePublisherBody,
  UpdatePublisherResponse,
  DeletePublisherParams,
} from "@workspace/api-zod";

const router = Router();

// Authors
router.get("/authors", async (req, res): Promise<void> => {
  const parsed = ListAuthorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search } = parsed.data;
  const authors = search
    ? await db.select().from(authorsTable).where(ilike(authorsTable.name, `%${search}%`))
    : await db.select().from(authorsTable);
  res.json(ListAuthorsResponse.parse(authors));
});

router.post("/authors", async (req, res): Promise<void> => {
  const parsed = CreateAuthorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [author] = await db.insert(authorsTable).values(parsed.data).returning();
  res.status(201).json(CreateAuthorResponse.parse(author));
});

router.patch("/authors/:id", async (req, res): Promise<void> => {
  const params = UpdateAuthorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateAuthorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [author] = await db.update(authorsTable).set(parsed.data).where(eq(authorsTable.id, params.data.id)).returning();
  if (!author) {
    res.status(404).json({ error: "Author not found" });
    return;
  }
  res.json(UpdateAuthorResponse.parse(author));
});

router.delete("/authors/:id", async (req, res): Promise<void> => {
  const params = DeleteAuthorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(authorsTable).where(eq(authorsTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Author not found" });
    return;
  }
  res.sendStatus(204);
});

// Categories
router.get("/categories", async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable);
  res.json(ListCategoriesResponse.parse(cats));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
  res.status(201).json(CreateCategoryResponse.parse(cat));
});

router.patch("/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [cat] = await db.update(categoriesTable).set(parsed.data).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(UpdateCategoryResponse.parse(cat));
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

// Publishers
router.get("/publishers", async (_req, res): Promise<void> => {
  const publishers = await db.select().from(publishersTable);
  res.json(ListPublishersResponse.parse(publishers));
});

router.post("/publishers", async (req, res): Promise<void> => {
  const parsed = CreatePublisherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [pub] = await db.insert(publishersTable).values(parsed.data).returning();
  res.status(201).json(CreatePublisherResponse.parse(pub));
});

router.patch("/publishers/:id", async (req, res): Promise<void> => {
  const params = UpdatePublisherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePublisherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [pub] = await db.update(publishersTable).set(parsed.data).where(eq(publishersTable.id, params.data.id)).returning();
  if (!pub) {
    res.status(404).json({ error: "Publisher not found" });
    return;
  }
  res.json(UpdatePublisherResponse.parse(pub));
});

router.delete("/publishers/:id", async (req, res): Promise<void> => {
  const params = DeletePublisherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db.delete(publishersTable).where(eq(publishersTable.id, params.data.id)).returning();
  if (!deleted) {
    res.status(404).json({ error: "Publisher not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
