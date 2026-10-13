import { NextResponse } from "next/server";
import { notify } from "@/lib/notify";
import { crossSite, limited } from "@/lib/rate-limit";
import { createCandidate } from "@/lib/store";

export const runtime = "nodejs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

// "Let employers find me": saves someone's reading to the pool, with their explicit consent.
export async function POST(req: Request) {
  if (crossSite(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (limited("pool", req, 5)) return bad("Too many attempts. Wait a few minutes and try again.", 429);
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  if (clip(body.website, 200)) return NextResponse.json({ ok: true }); // honeypot

  const name = clip(body.name, 120);
  const email = clip(body.email, 200).toLowerCase();
  const city = clip(body.city, 120);
  const description = clip(body.description, 4000);
  const industry = clip(body.industry, 200);
  if (!name) return bad("Add your first name.");
  if (!EMAIL.test(email)) return bad("That email doesn't look right. Check it and try again.");
  if (description.length < 20) return bad("Your description is missing. Start the reading again.");
  if (body.consent !== true) return bad("Tick the box so we're allowed to keep your profile.");

  const capabilities = Array.isArray(body.capabilities)
    ? body.capabilities
        .slice(0, 8)
        .map((c: Record<string, unknown>, i: number) => ({
          id: clip(c?.id, 20) || `c${i + 1}`,
          activity: clip(c?.activity, 400),
          detail: clip(c?.detail, 400),
        }))
        .filter((c: { activity: string }) => c.activity)
    : [];
  const interests = Array.isArray(body.interests) ? body.interests.slice(0, 6).map((x) => clip(x, 120)).filter(Boolean) : [];

  try {
    const { token } = await createCandidate({ name, email, city, description, industry, capabilities, interests });
    // Minimal notice: no name or email leaves the database.
    await notify({ type: "candidate_joined", industry, interests });
    return NextResponse.json({ ok: true, manage: `/me/${token}` });
  } catch (err) {
    console.error(err);
    return bad("We couldn't save that just now. Try again in a moment.", 502);
  }
}
