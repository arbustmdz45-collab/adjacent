import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { crossSite, limited } from "@/lib/rate-limit";
import { matchFromBase } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Read people already in the base against this opening. Nobody is asked anything again.
export async function POST(req: Request) {
  if (crossSite(req)) return bad("Not allowed.", 403);
  if (!(await isAdmin())) return bad("Sign in first.", 401);
  if (limited("ws-base", req, Number(process.env.BASE_RUNS_PER_10_MIN || 10))) return bad("Too many readings in a short time. Wait a few minutes.", 429);
  let body: { oid?: string; limit?: number };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  const oid = typeof body.oid === "string" ? body.oid.slice(0, 40) : "";
  if (!oid) return bad("Invalid request.");
  if (!process.env.ANTHROPIC_API_KEY) return bad("The comparison is not available right now.", 503);
  try {
    const out = await matchFromBase(oid, Number(body.limit) || 4);
    if (!out) return bad("Not found.", 404);
    return NextResponse.json(out);
  } catch (err) {
    console.error(err);
    return bad("The base could not be read just now. Try again in a moment.", 502);
  }
}
