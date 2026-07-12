import { createHash, randomBytes, pbkdf2Sync } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const verify = pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === verify;
}

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}
