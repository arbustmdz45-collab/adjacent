import { NextResponse } from "next/server";
import { crossSite, limited } from "@/lib/rate-limit";
import { getByInterviewToken, publicInterview, submitInterview } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// The candidate's private interview page: the questions for their opening.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const found = await getByInterviewToken((await params).token.slice(0, 80)).catch(() => null);
  if (!found) return bad("This interview link is not valid.", 404);
  return NextResponse.json({ interview: publicInterview(found.o, found.c) });
}

// Their written answers. Sent once; the employer reads them next to what adjacent points at.
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (crossSite(req)) return bad("Not allowed.", 403);
  if (limited("ws-interview", req, 5)) return bad("Too many attempts. Wait a few minutes and try again.", 429);
  let body: { answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  try {
    const found = await getByInterviewToken((await params).token.slice(0, 80));
    if (!found) return bad("This interview link is not valid.", 404);
    const pub = publicInterview(found.o, found.c);
    if (pub.done) return bad("Your answers were already sent.", 409);
    if (!pub.open) return bad("This interview is closed.", 409);
    const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
    const written = found.o.questions.filter((x) => typeof answers[x.aid] === "string" && String(answers[x.aid]).trim().split(/\s+/).length >= 10).length;
    if (written < found.o.questions.length) return bad("Answer every question with at least a couple of sentences.");
    if (!process.env.ANTHROPIC_API_KEY) return bad("Answers cannot be received right now.", 503);
    await submitInterview(found.o, found.c, answers);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return bad("Your answers could not be saved just now. Try again in a moment.", 502);
  }
}
