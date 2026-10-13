import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { limited } from "@/lib/rate-limit";
import { CANDIDATE_TOOL, HIRING_SYSTEM, candidatePrompt } from "@/lib/hiring-prompt";
import { SYSTEM, TOOLS, capabilitiesPrompt, fieldsPrompt, replacePrompt } from "@/lib/prompt";
import type { AnalyseRequest, CandidateResponse, Capability, Field } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
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

// Drop mappings that point at capabilities that no longer exist.
function clean(field: Field, caps: Capability[]): Field {
  const ids = new Set(caps.map((c) => c.id));
  return {
    ...field,
    maps: (field.maps || []).filter((m) => ids.has(m.capability_id)),
    titles: Array.isArray(field.titles) ? field.titles.filter((t) => typeof t === "string").slice(0, 4) : [],
    say_it: Array.isArray(field.say_it) ? field.say_it.filter((t) => typeof t === "string").slice(0, 3) : [],
    why_weak: field.strength === "weak" ? field.why_weak || null : null,
  };
}

const MAX_CANDIDATE_CHARS = 12000;
const norm = (s: string) => s.toLowerCase().replace(/[\s"“”'‘’.,;:()\-–—]+/g, " ").trim();

// Keep the check honest: one entry per capability, in order, and drop any
// quote that isn't actually in the candidate's text.
function checkAgainst(check: CandidateResponse["check"], caps: Capability[], text: string): CandidateResponse["check"] {
  const source = norm(text);
  const ids = new Set(caps.map((c) => c.id));
  const coverage = caps.map((c) => {
    const found = (check.coverage || []).find((x) => x.capability_id === c.id);
    if (!found) return { capability_id: c.id, evidence: "not_shown" as const, quote: null, note: "This check didn't cover it. Ask about it in the interview." };
    const quoteOk = found.quote && found.evidence !== "not_shown" && source.includes(norm(found.quote));
    return { ...found, quote: quoteOk ? found.quote : null };
  });
  return {
    ...check,
    coverage,
    questions: (check.questions || []).filter((q) => ids.has(q.capability_id)),
    ramp: (check.ramp || []).filter((r) => ids.has(r.capability_id)),
  };
}

type ToolDef = { name: string; description: string; input_schema: unknown };

async function ask<T>(tool: ToolDef, prompt: string, system: string = SYSTEM): Promise<T> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system,
    tools: [tool as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("The model returned no structured answer.");
  return block.input as T;
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) return bad("Server is missing ANTHROPIC_API_KEY.", 500);

  if (limited("analyse", req, MAX_REQUESTS)) return bad("Too many requests. Wait a few minutes and try again.", 429);

  let body: AnalyseRequest;
  try {
    body = await req.json();
  } catch {
    return bad("Invalid JSON.");
  }
  if (!validRole(body?.role)) return bad("Describe what you do in at least a sentence (max 4,000 characters).");

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
      const out = await ask<{ fields: Field[]; gap: { capability_id: string; note: string } | null }>(
        TOOLS.fields,
        fieldsPrompt(body.role, industry, body.capabilities, rejected),
      );
      const ids = new Set(body.capabilities.map((c) => c.id));
      return NextResponse.json({
        fields: out.fields.map((f) => clean(f, body.capabilities)),
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
      const out = await ask<{ field: Field }>(
        TOOLS.replace,
        replacePrompt(body.role, industry, body.capabilities, keep, rejected),
      );
      return NextResponse.json({ field: clean(out.field, body.capabilities) });
    }

    return bad("Unknown step.");
  } catch (err) {
    console.error(err);
    return bad("The analysis failed. Try again in a moment.", 502);
  }
}
