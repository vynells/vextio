// Team logins for the Vextio Orders desktop app. Passwords are hashed with scrypt and
// the app gets a signed token that stops working when that person's password changes.
import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { q } from "./db";

const scrypt = promisify(_scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

function secret() {
  const s = process.env.AUTH_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s) throw new Error("Set AUTH_SECRET (or ADMIN_SESSION_SECRET) to sign app logins");
  return s;
}
const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const hmac = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  return `s1$${b64(salt)}$${b64(await scrypt(pw, salt, 64))}`;
}

export async function verifyPassword(pw: string, stored: string) {
  const [, salt, key] = stored.split("$");
  if (!salt || !key) return false;
  const want = Buffer.from(key, "base64url");
  const got = await scrypt(pw, Buffer.from(salt, "base64url"), want.length);
  return got.length === want.length && timingSafeEqual(got, want);
}

export const passwordProblem = (pw: string) =>
  pw.length < 8 ? "Use at least 8 characters." : pw.length > 200 ? "That’s too long." : "";

// ---- App tokens ----

export type Staff = { id: number; login: string; name: string; role: "owner" | "staff" };

// A fingerprint of the password hash: changing the password invalidates old tokens.
const fp = (hash: string) => hmac(hash).slice(0, 10);

export function appToken(user: { id: number; password_hash: string }) {
  const body = b64(JSON.stringify({ id: user.id, v: fp(user.password_hash), exp: Date.now() + 30 * 864e5 }));
  return `${body}.${hmac(body)}`;
}

export async function staffFromRequest(req: Request): Promise<Staff | null> {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const [body, sig] = token.split(".");
  if (!body || !sig || !safeEqual(hmac(body), sig)) return null;
  let p: { id: number; v: string; exp: number };
  try {
    p = JSON.parse(Buffer.from(body, "base64url").toString());
  } catch {
    return null;
  }
  if (!p.exp || p.exp < Date.now()) return null;
  const [row] = await q<Staff & { password_hash: string }>(
    "SELECT id, login, name, role, password_hash FROM staff WHERE id = $1",
    [p.id]
  );
  if (!row || fp(row.password_hash) !== p.v) return null;
  return { id: row.id, login: row.login, name: row.name, role: row.role };
}

/** The first owner comes from ADMIN_USERNAME and ADMIN_PASSWORD. After that, the team is managed in the app. */
export async function bootstrapOwner(login: string, password: string) {
  const envUser = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const envPass = process.env.ADMIN_PASSWORD;
  if (!envUser || !envPass || login !== envUser || !safeEqual(password, envPass)) return null;
  const [existing] = await q("SELECT id FROM staff WHERE login = $1", [envUser]);
  if (existing) return null;
  const [row] = await q<{ id: number; password_hash: string }>(
    "INSERT INTO staff (login, name, password_hash, role) VALUES ($1, $2, $3, 'owner') RETURNING id, password_hash",
    [envUser, process.env.ADMIN_NAME || "", await hashPassword(envPass)]
  );
  return row;
}

// ---- Abuse protection ----

export function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

/** Allows `max` attempts per `minutes` for a key. Returns false once the limit is hit. */
export async function rateLimit(key: string, max: number, minutes: number) {
  const [{ n }] = await q<{ n: number }>(
    "SELECT COUNT(*)::int AS n FROM login_attempts WHERE key = $1 AND at > NOW() - ($2 || ' minutes')::interval",
    [key, String(minutes)]
  );
  if (n >= max) return false;
  await q("INSERT INTO login_attempts (key) VALUES ($1)", [key]);
  if (Math.random() < 0.05) await q("DELETE FROM login_attempts WHERE at < NOW() - interval '1 day'");
  return true;
}
