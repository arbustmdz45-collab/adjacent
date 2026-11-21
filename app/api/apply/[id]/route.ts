import { NextResponse } from "next/server";
import { crossSite, limited } from "@/lib/rate-limit";
import { MIN_WORDS, createAnswer, getOpening, publicOpening, words } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PDF_BYTES = 4 * 1024 * 1024; // the file is read once for its text and never stored
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
  // The form is sent as multipart so an optional CV (PDF) can come with it.
  let body: Record<string, unknown>;
  let file: File | null = null;
  try {
    const form = await req.formData();
    body = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string"));
    const f = form.get("cv");
    if (f && typeof f !== "string" && f.size > 0) file = f;
  } catch {
    return bad("Invalid request.");
  }
  if (clip(body.website, 200)) return NextResponse.json({ ok: true }); // honeypot
  // One answer per activity, each with a minimum, or marked as something they have never done.
  let parts: Record<string, string> = {};
  let skip: string[] = [];
  try {
    const pj = JSON.parse(clip(body.parts, 20000) || "{}");
    if (pj && typeof pj === "object") for (const [k, v] of Object.entries(pj)) parts[String(k).slice(0, 40)] = clip(v, 3000);
    const sj = JSON.parse(clip(body.skip, 2000) || "[]");
    if (Array.isArray(sj)) skip = sj.map((x) => String(x).slice(0, 40));
  } catch {
    return bad("Invalid request.");
  }
  const text = clip(body.text, 3000);
  const byPart = Object.keys(parts).length > 0 || skip.length > 0;
  if (!byPart && words(text) < 15) return bad("Write at least a couple of sentences about what you did on a normal day.");
  const email = clip(body.email, 200).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad("Add an email address so the employer can reach you if they want to meet.");
  if (body.consent !== "true") return bad("Tick the box so the employer is allowed to read your answer.");
  let cv = "";
  if (file) {
    if (file.size > MAX_PDF_BYTES) return bad("That PDF is larger than 4 MB. Upload a smaller one or leave it out.");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return bad("The CV has to be a PDF.");
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const { text: pages } = await extractText(await getDocumentProxy(new Uint8Array(await file.arrayBuffer())), { mergePages: true });
      cv = String(pages || "").trim();
    } catch {
      return bad("That PDF could not be read. Upload a different file or leave it out.");
    }
    if (cv.length < 80) return bad("No text could be read from that PDF. It may be a scanned image. Upload a text PDF or leave it out.");
  }
  if (!process.env.ANTHROPIC_API_KEY) return bad("The comparison is not available right now.", 503);
  try {
    const o = await getOpening((await params).id.slice(0, 40));
    if (!o) return bad("This opening does not exist.", 404);
    if (o.open === false) return bad("This opening has been filled.", 409);
    if (byPart) {
      const short = o.activities.filter((a) => !skip.includes(a.id) && words(parts[a.id] || "") < MIN_WORDS);
      if (short.length) return bad(`Write at least ${MIN_WORDS} words about: ${short.map((a) => a.name).join("; ")}. If you have never done one of these, tick the box under it instead.`);
      if (skip.length === o.activities.length) return bad("You marked every activity as something you have never done. Describe at least one of them so there is something to compare.");
    }
    const candidate = await createAnswer(o, { parts, skip, text, zone: clip(body.zone, 80), pay: clip(body.pay, 80), avail: clip(body.avail, 80), email, cv });
    return NextResponse.json({ candidate });
  } catch (err) {
    console.error(err);
    return bad("Your answer could not be compared just now. Try again in a moment.", 502);
  }
}
