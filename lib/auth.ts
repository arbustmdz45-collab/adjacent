// The admin area is for you, the operator. One password (ADMIN_PASSWORD), one signed cookie.
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "adj_admin";

function expected() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return createHmac("sha256", pw).update("adjacent-admin-v1").digest("base64url");
}

export function passwordMatches(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(pw);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setAdminCookie() {
  const value = expected();
  if (!value) return;
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE);
}

export async function isAdmin() {
  const value = expected();
  if (!value) return false;
  const got = (await cookies()).get(COOKIE)?.value || "";
  const a = Buffer.from(got);
  const b = Buffer.from(value);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
