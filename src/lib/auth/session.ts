import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db/client";
import { normalizeRole } from "./roles";

// plog src/lib/auth.ts 와 같은 포맷: base64url(JSON).hmac-sha256-hex, 쿠키명 session, 7일.
// SESSION_SECRET 을 plog 와 같게 두면 두 앱의 쿠키가 서로 검증된다(도메인은 각자).
const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

const sign = (value: string) => createHmac("sha256", getSecret()).update(value).digest("hex");

function verify(value: string, sig: string): boolean {
  const expected = Buffer.from(sign(value), "hex");
  const got = Buffer.from(sig, "hex");
  return expected.length === got.length && timingSafeEqual(expected, got);
}

export type Session = { name: string; role: string; plant: string | null; department: string | null; iat: number };

function encode(s: Session): string {
  const body = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string): Session | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    if (!verify(body, sig)) return null;
    const obj = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
    if (typeof obj.name !== "string" || typeof obj.iat !== "number") return null;
    if (Date.now() / 1000 - obj.iat > COOKIE_MAX_AGE) return null;
    return { ...obj, role: normalizeRole(obj.role) };
  } catch {
    return null;
  }
}

const devSession = (): Session | null =>
  process.env.DEV_BYPASS_AUTH === "1" && process.env.NODE_ENV !== "production"
    ? { name: "DEV", role: "전체관리자", plant: null, department: null, iat: Math.floor(Date.now() / 1000) }
    : null;

export async function getSession(): Promise<Session | null> {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return (t ? decode(t) : null) ?? devSession();
}

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

export async function setSession(user: { name: string; role: string; plant: string | null; department: string | null }) {
  const token = encode({
    name: user.name,
    role: normalizeRole(user.role),
    plant: user.plant ?? null,
    department: user.department ?? null,
    iat: Math.floor(Date.now() / 1000),
  });
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}

/** plog users 테이블의 이름 + 6자리 PIN 으로 검증 — plog verifyPin 과 같은 규칙 */
export async function verifyPin(name: string, pin: string) {
  if (!/^\d{6}$/.test(pin)) return null;
  const rows = await db.select().from(schema.users).where(eq(schema.users.name, name)).limit(1);
  const user = rows[0];
  return user && user.pin === pin ? user : null;
}

export async function listUserNames(): Promise<string[]> {
  const rows = await db.select({ name: schema.users.name }).from(schema.users);
  return rows.map((r) => r.name).sort((a, b) => a.localeCompare(b, "ko-KR"));
}
