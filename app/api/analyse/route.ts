import { NextResponse } from "next/server";
import { crossSite, limited } from "@/lib/rate-limit";
import { CANDIDATE_TOOL, HIRING_SYSTEM, candidatePrompt } from "@/lib/hiring-prompt";
import { ask } from "@/lib/ai";
import { checkAgainst } from "@/lib/check";
import { redact } from "@/lib/redact";
import { describeMoves, provenMoves, type ProvenMove } from "@/lib/store";
import { TOOLS, capabilitiesPrompt, fieldsPrompt, replacePrompt } from "@/lib/prompt";
import type { AnalyseRequest, CandidateResponse, Capability, Field } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_ROLE_CHARS = 4000;

const MAX_REQUESTS = Number(process.env.RATE_LIMIT_PER_10_MIN || 30);

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function validRole(role: unknown): role is string {
  return typeof role === "string" && role.trim().length >= 20 && role.length <= MAX_ROLE_CHARS;
}

function validCapabilities(caps: unknown): caps is Capability[] {
  return (
    Array.isArray(caps) &&
    caps.length >= 1 &&
    caps.length <= 8 &&
    caps.every((c) => c && typeof c.id === "string" && typeof c.activity === "string" && c.activity.trim())
  );
}

// Proven moves come from the database. Without one (local demo), the tool still works without them.
async function loadMoves(): Promise<ProvenMove[]> {
  try {
    return await provenMoves(true);
  } catch (err) {
    console.warn("Proven moves unavailable:", (err as Error).message);
    return [];
  }
}

// Drop mappings that point at capabilities that no longer exist, and attach real counts for a proven move.
function clean(field: Field, caps: Capability[], moves: ProvenMove[] = []): Field {
  const ids = new Set(caps.map((c) => c.id));
  const move = field.proven_move_id ? moves.find((m) => m.key === field.proven_move_id) : undefined;
  return {
    proven: move ? { from: move.from, to: move.to, hired: move.hired, retained: move.retained } : null,
    ...field,
    maps: (field.maps || []).filter((m) => ids.has(m.capability_id)),
    titles: Array.isArray(field.titles) ? field.titles.filter((t) => typeof t === "string").slice(0, 4) : [],
    say_it: Array.isArray(field.say_it) ? field.say_it.filter((t) => typeof t === "string").slice(0, 3) : [],
    why_weak: field.strength === "weak" ? field.why_weak || null : null,
  };
}

const MAX_CANDIDATE_CHARS = 12000;

export async function POST(req: Request) {
  if (crossSite(req)) return NextResponse.json({ error: "Not allowed." }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY) return bad("Server is missing ANTHROPIC_API_KEY.", 500);

  if (limited("analyse", req, MAX_REQUESTS)) return bad("Too many requests. Wait a few minutes and try again.", 429);

  let body: AnalyseRequest;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON.");
  }
  if (!validRole(body?.role)) return bad("Describe what you do in at least a sentence (max 4,000 characters).");
  // Minimise what leaves for the model: contact details typed into the description are removed first.
  body.role = redact(body.role);

  try {
    if (body.step === "capabilities") {
      const out = await ask<{ industry: string; capabilities: Capability[] }>(
        TOOLS.capabilities,
        capabilitiesPrompt(body.role),
      );
      return NextResponse.json(out);
    }

    if (!validCapabilities(body.capabilities)) return bad("Capabilities are missing or malformed.");
    const industry = typeof body.industry === "string" && body.industry.trim() ? body.industry : "unknown";
    const rejected = "rejected" in body && Array.isArray(body.rejected) ? body.rejected.slice(0, 20) : [];

    if (body.step === "fields") {
      const moves = await loadMoves();
      const out = await ask<{ fields: Field[]; gap: { capability_id: string; note: string } | null }>(
        TOOLS.fields,
        fieldsPrompt(body.role, industry, body.capabilities, rejected, describeMoves(moves)),
      );
      const ids = new Set(body.capabilities.map((c) => c.id));
      return NextResponse.json({
        fields: out.fields.map((f) => clean(f, body.capabilities, moves)),
        gap: out.gap && ids.has(out.gap.capability_id) ? out.gap : null,
      });
    }

    if (body.step === "candidate") {
      const text = typeof body.candidate === "string" ? body.candidate : "";
      if (text.trim().length < 40 || text.length > MAX_CANDIDATE_CHARS)
        return bad("Paste the candidate's CV or a few sentences on what they've done (max 12,000 characters).");
      const out = await ask<CandidateResponse>(
        CANDIDATE_TOOL,
        candidatePrompt(body.role, industry, body.capabilities, text),
        HIRING_SYSTEM,
      );
      return NextResponse.json({ check: checkAgainst(out.check, body.capabilities, text) });
    }

    if (body.step === "replace") {
      const keep = Array.isArray(body.keep) ? body.keep : [];
      const moves = await loadMoves();
      const out = await ask<{ field: Field }>(
        TOOLS.replace,
        replacePrompt(body.role, industry, body.capabilities, keep, rejected, describeMoves(moves)),
      );
      return NextResponse.json({ field: clean(out.field, body.capabilities, moves) });
    }

    return bad("Unknown step.");
  } catch (err) {
    console.error(err);
    return bad("The analysis failed. Try again in a moment.", 502);
  }
}
