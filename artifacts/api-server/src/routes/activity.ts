import { Router } from "express";
import { db, activityLogsTable, usersTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  ListActivityLogsQueryParams,
  ListActivityLogsResponse,
} from "@workspace/api-zod";

const router = Router();

router.get("/activity-logs", async (req, res): Promise<void> => {
  const parsed = ListActivityLogsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { userId, action, page = 1, limit = 50 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (userId != null) conditions.push(eq(activityLogsTable.userId, userId));
  if (action) conditions.push(eq(activityLogsTable.action, action));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, [{ count }]] = await Promise.all([
    db.select().from(activityLogsTable).where(whereClause).orderBy(desc(activityLogsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(activityLogsTable).where(whereClause),
  ]);

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

  res.json(ListActivityLogsResponse.parse({ data, total: count, page, limit }));
});

export default router;
