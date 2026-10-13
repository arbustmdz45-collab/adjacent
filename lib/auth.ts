// The admin area is for you, the operator: one password (ADMIN_PASSWORD), sessions that expire.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "adj_admin";
const SESSION_HOURS = 12;

// Sessions are signed with ADMIN_SESSION_SECRET, or a key derived from the password,
// so changing either one signs everybody out.
function key() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET || pw).update("adjacent-admin-session-v2").digest();
}

function sign(payload: string) {
  const k = key();
  return k ? createHmac("sha256", k).update(payload).digest("base64url") : "";
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function passwordMatches(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < 12) return false; // refuse weak or missing passwords outright
  return safeEqual(input, pw);
}

export async function setAdminCookie() {
  if (!key()) return;
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIES,
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  if (!key()) return false;
  const raw = (await cookies()).get(COOKIE)?.value || "";
  const [payload, mac] = raw.split(".");
  if (!payload || !mac || !safeEqual(mac, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
