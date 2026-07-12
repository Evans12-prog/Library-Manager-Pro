import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  ListNotificationsQueryParams,
  ListNotificationsResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
} from "@workspace/api-zod";

const router = Router();

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
  };
}

router.get("/notifications", async (req, res): Promise<void> => {
  const parsed = ListNotificationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { unreadOnly } = parsed.data;

  // For demo: return notifications for all users (in production would filter by session user)
  const conditions = [];
  if (unreadOnly === true) conditions.push(eq(notificationsTable.isRead, false));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const notifications = await db.select().from(notificationsTable)
    .where(whereClause)
    .orderBy(notificationsTable.createdAt);

  res.json(ListNotificationsResponse.parse(notifications.map(formatNotification)));
});

router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const params = MarkNotificationReadParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [notification] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, params.data.id))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(MarkNotificationReadResponse.parse(formatNotification(notification)));
});

router.post("/notifications/read-all", async (_req, res): Promise<void> => {
  await db.update(notificationsTable).set({ isRead: true });
  res.json({ ok: true });
});

export default router;
