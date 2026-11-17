import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { crossSite, limited } from "@/lib/rate-limit";
import { createOpening, listAll } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Everything the employer workspace shows: openings and the people who answered them.
export async function GET() {
  if (!(await isAdmin())) return bad("Sign in first.", 401);
  try {
    return NextResponse.json(await listAll());
  } catch (err) {
    console.error(err);
    return bad("The workspace could not be loaded.", 502);
  }
}

// A new opening: taken apart by the model, then saved.
export async function POST(req: Request) {
  if (crossSite(req)) return bad("Not allowed.", 403);
  if (!(await isAdmin())) return bad("Sign in first.", 401);
  if (limited("ws-opening", req, 10)) return bad("Too many openings in a short time. Wait a few minutes.", 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  const raw = clip(body.raw, 4000);
  if (raw.split(/\s+/).length < 8) return bad("Paste the text of the opening first.");
  if (!process.env.ANTHROPIC_API_KEY) return bad("ANTHROPIC_API_KEY is not set on the server.", 503);
  try {
    const opening = await createOpening({ company: clip(body.company, 200), raw, pay: clip(body.pay, 120), hours: clip(body.hours, 120), zone: clip(body.zone, 120) });
    return NextResponse.json({ opening });
  } catch (err) {
    console.error(err);
    return bad("The analysis could not be completed. Try again.", 502);
  }
}
