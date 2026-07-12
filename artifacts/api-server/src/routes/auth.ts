import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { LoginBody, LoginResponse, GetMeResponse } from "@workspace/api-zod";
import { hashPassword, verifyPassword } from "../lib/auth";

const router = Router();

// Simple in-memory session store (keyed by session token)
const sessions = new Map<string, number>();

export function getSessionUserId(token: string | undefined): number | null {
  if (!token) return null;
  return sessions.get(token) ?? null;
}

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = verifyPassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken();
  sessions.set(token, user.id);

  res.cookie("session_token", token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });

  const responseUser = {
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

  res.json(LoginResponse.parse({ user: responseUser }));
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.session_token;
  if (token) sessions.delete(token);
  res.clearCookie("session_token");
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.session_token;
  const userId = getSessionUserId(token);
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const responseUser = {
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

  res.json(GetMeResponse.parse(responseUser));
});

export default router;
