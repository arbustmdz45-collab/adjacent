import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { crossSite, limited } from "@/lib/rate-limit";
import { getCandidate, getOpening, submitInterview } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// The live interview: the employer sends the corrected transcript, one answer per question.
export async function POST(req: Request) {
  if (crossSite(req)) return bad("Not allowed.", 403);
  if (!(await isAdmin())) return bad("Sign in first.", 401);
  if (limited("ws-live", req, 20)) return bad("Too many readings in a short time. Wait a few minutes.", 429);
  let body: { id?: string; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  if (!process.env.ANTHROPIC_API_KEY) return bad("ANTHROPIC_API_KEY is not set on the server.", 503);
  try {
    const c = await getCandidate(String(body.id || "").slice(0, 40));
    if (!c) return bad("Not found.", 404);
    const o = await getOpening(c.oid);
    if (!o) return bad("Not found.", 404);
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const enough = o.questions.filter((x) => String(answers[x.aid] || "").trim().split(/\s+/).length >= 8).length;
    if (!enough) return bad("Record or type at least one answer before reading it.");
    const doc = await submitInterview(o, c, answers, "live");
    return NextResponse.json({ doc });
  } catch (err) {
    console.error(err);
    return bad("The answers could not be read just now. Try again in a moment.", 502);
  }
}
