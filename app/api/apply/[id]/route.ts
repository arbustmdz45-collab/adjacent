import { NextResponse } from "next/server";
import { crossSite, limited } from "@/lib/rate-limit";
import { createAnswer, getOpening, publicOpening } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// The public candidate page reads only what a candidate should see of the opening.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const o = await getOpening((await params).id.slice(0, 40)).catch(() => null);
  if (!o) return bad("This opening does not exist.", 404);
  return NextResponse.json({ opening: publicOpening(o) });
}

// A candidate's answer. Public, so it is rate-limited per IP and capped in length.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (crossSite(req)) return bad("Not allowed.", 403);
  if (limited("ws-answer", req, Number(process.env.ANSWERS_PER_10_MIN || 5))) return bad("Too many answers from this connection. Wait a few minutes and try again.", 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  if (clip(body.website, 200)) return NextResponse.json({ ok: true }); // honeypot
  const text = clip(body.text, 3000);
  if (text.split(/\s+/).length < 15) return bad("Write at least a couple of sentences about what you did on a normal day.");
  const email = clip(body.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad("Add an email address so the employer can reach you if they want to meet.");
  if (body.consent !== true) return bad("Tick the box so the employer is allowed to read your answer.");
  if (!process.env.ANTHROPIC_API_KEY) return bad("The comparison is not available right now.", 503);
  try {
    const o = await getOpening((await params).id.slice(0, 40));
    if (!o) return bad("This opening does not exist.", 404);
    if (o.open === false) return bad("This opening has been filled.", 409);
    const candidate = await createAnswer(o, { text, zone: clip(body.zone, 80), pay: clip(body.pay, 80), avail: clip(body.avail, 80), email });
    return NextResponse.json({ candidate });
  } catch (err) {
    console.error(err);
    return bad("Your answer could not be compared just now. Try again in a moment.", 502);
  }
}
