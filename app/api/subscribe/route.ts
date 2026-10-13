import { NextResponse } from "next/server";
import { crossSite, limited } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Newsletter sign-ups and employer pilot requests.
// Each one is POSTed as JSON to LEADS_WEBHOOK_URL: a Google Sheets Apps Script,
// Zapier/Make webhook, Formspree endpoint, or anything else that accepts JSON.
// adjacent keeps no database of its own.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const FREE_MAIL = /@(gmail|googlemail|hotmail|outlook|live|yahoo|icloud|me|aol|proton|protonmail|gmx)\./i;

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  if (crossSite(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (limited("subscribe", req, 8)) return bad("Too many attempts. Wait a few minutes and try again.", 429);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }

  // Honeypot: real people never see this field. Pretend it worked.
  if (clip(body.website, 200)) return NextResponse.json({ ok: true });

  const type = body.type === "employer" ? "employer" : body.type === "newsletter" ? "newsletter" : null;
  if (!type) return bad("Invalid request.");

  const email = clip(body.email, 200).toLowerCase();
  if (!EMAIL.test(email)) return bad("That email doesn't look right. Check it and try again.");

  const lead: Record<string, unknown> = { type, email, submitted_at: new Date().toISOString() };

  if (type === "employer") {
    const company = clip(body.company, 200);
    const role = clip(body.role, 2000);
    if (!company) return bad("Add your company's name.");
    if (role.length < 10) return bad("Tell us a little about the role that's hard to fill.");
    if (body.consent !== true) return bad("Tick the box so we're allowed to contact you.");
    Object.assign(lead, { company, role, consent: true, free_email_domain: FREE_MAIL.test(email) });
  }

  const hook = process.env.LEADS_WEBHOOK_URL;
  if (!hook) {
    console.warn(`LEADS_WEBHOOK_URL is not set; a ${type} sign-up was not delivered.`);
    return bad("Sign-ups aren't switched on yet. Please try again soon.", 503);
  }

  try {
    const res = await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    });
    if (!res.ok) throw new Error(`Webhook answered ${res.status}`);
  } catch (err) {
    console.error("Lead webhook failed:", err);
    return bad("That didn't go through on our side. Try again in a moment.", 502);
  }

  return NextResponse.json({ ok: true });
}
