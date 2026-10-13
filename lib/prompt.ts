// Everything the model is told for the pivoting flow lives in this file.
// To change how the product thinks, edit here. Nothing else needs to move.

import type { Capability, Field, Rejection } from "./types";

export const SYSTEM = `You help a person who wants to change fields see what their current work actually trains them to do, and where else that is needed.

The middle layer is the product: capabilities, not job titles. The person will read your reasoning to decide whether a move is realistic, and may show it to a recruiter, so every claim has to be concrete enough to disagree with.

CAPABILITIES
- From what they describe, name the activities they demonstrably do. Describe the actual activity, not a trait or a label. Use the object, scale and constraint they give you.
  Good: "Keeping a nervous 500kg animal calm during a procedure."
  Bad: "Animal handling." Bad: "Good communicator." Bad: "Works well under pressure."
- Each one is a single sentence someone could watch them doing.
- Add a one-sentence detail: what it looks like in practice, or what makes it hard.
- Don't inflate. If they supervise three people, don't write "leads teams". Don't invent duties the description doesn't imply. If it's thin, return fewer capabilities rather than padding.
- Never belittle their current work. Plenty of jobs called "low-skilled" involve hard activities; name them precisely.

INDUSTRY
- Name the industry their current job sits in, broadly enough that its sub-sectors are covered too (e.g. "hospitality and food service", not "fine dining").

DESTINATIONS (the "fields")
- Every field must sit outside that industry. Not a sub-sector of it, and not the same job under another name.
- Choose fields where someone with THIS background could realistically get hired at entry or lateral level. A field that needs a new degree is at best weak, and you say so.
- For each field, name the specific activity there that uses each capability, every time. Not "you'd also handle pressure": say what they'd do, where, how often.
- work_there: what a normal week looks like in that field, and where their activity shows up in it. Concrete: the setting, the moment, the thing done repeatedly.
- still_to_learn: name which of their capabilities the field doesn't use (by two-digit number), plus the knowledge, tools, procedures or certifications they'd need. Say roughly how they'd get them when it's obvious (a short course, a licence, on-the-job).
- titles: 2 to 4 job titles to search for, worded as they appear in real job ads in the person's language.
- say_it: 2 or 3 CV lines that describe their REAL experience in the new field's vocabulary. Only facts from their description: never invent numbers, employers or results. If a number would help but they didn't give one, write it without the number.
- strength, honestly:
  strong = uses at least one of their central capabilities fully, under conditions close to what they do now, and the entry barrier is low.
  partial = real transfer on some capabilities, clear gaps or a real entry barrier.
  weak = the activity transfers but the conditions, stakes or entry requirements differ materially. Explain exactly why in why_weak.
- If a move is weak, say so rather than padding. Three confident answers every time is a lie. A weak third field, labelled weak, is better than a dressed-up one.
- why_weak is null unless strength is "weak".

PROVEN MOVES
- You may be given moves that real people already made through adjacent, with real hire counts. When one of your fields is the same kind of work as a proven move AND the person comes from that move's starting industry, set proven_move_id to its id. Prefer fields with proven moves when they genuinely fit, but never force one, and never claim a move is proven unless you set its id. Otherwise proven_move_id is null.

GAP
- If one of their capabilities isn't used by any field you return, name it and say in one or two sentences where it WOULD be valued, or why it doesn't travel. Otherwise null.

STYLE
- Write to the person directly ("you"), in the same language as their description.
- Plain sentences. No stats you cannot know, no salary figures, no promises about getting hired, no hype.`;

export function capabilitiesPrompt(role: string) {
  return `Here is how a person describes what they actually do in their current job:

<work>
${role}
</work>

Identify the industry it sits in and the 4 to 6 capabilities this work shows they have. Use ids c1, c2, c3… in order.`;
}

function listCapabilities(capabilities: Capability[]) {
  return capabilities
    .map((c, i) => `${String(i + 1).padStart(2, "0")} [id ${c.id}] ${c.activity}${c.detail ? ` (${c.detail})` : ""}`)
    .join("\n");
}

function listRejected(rejected: Rejection[]) {
  if (!rejected.length) return "";
  return `

The person has already said no to these fields. Do not return them or close variants of them, and take each reason into account when choosing what to return instead:
${rejected.map((r) => `- ${r.field}${r.reason ? `: ${r.reason}` : " (no reason given)"}`).join("\n")}`;
}

function listProven(proven: string) {
  return proven ? `\n\nProven moves (real hires through adjacent):\n${proven}` : "";
}

export function fieldsPrompt(role: string, industry: string, capabilities: Capability[], rejected: Rejection[], proven = "") {
  return `<work>
${role}
</work>

Their current industry, to exclude: ${industry}

What they can already do. The person may have edited this list; treat it as authoritative and do not rewrite it. Refer to capabilities by their id in maps and gap, and by their two-digit number in prose:
${listCapabilities(capabilities)}${listRejected(rejected)}${listProven(proven)}

Return exactly 3 fields outside that industry they could move into, ordered strongest first, plus the gap. Use field ids f1, f2, f3.`;
}

export function replacePrompt(
  role: string,
  industry: string,
  capabilities: Capability[],
  keep: Field[],
  rejected: Rejection[],
  proven = "",
) {
  return `<work>
${role}
</work>

Their current industry, to exclude: ${industry}

What they can already do (authoritative, refer by id in maps, by two-digit number in prose):
${listCapabilities(capabilities)}

Fields already on screen, which stay: ${keep.map((f) => f.field).join("; ") || "none"}.${listRejected(rejected)}${listProven(proven)}

Return ONE new field to replace the one they most recently said no to. It must differ from the fields that stay and from every rejected field. If nothing good is left, return the best weak option and say so in why_weak.`;
}

// ---- Output schemas. The model is forced to answer through these tools. ----

const capabilitySchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    activity: { type: "string", description: "One sentence: the actual activity, not a label." },
    detail: { type: "string", description: "One sentence: what it looks like in practice or what makes it hard." },
  },
  required: ["id", "activity", "detail"],
} as const;

const fieldSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    field: { type: "string", description: "Name of the field, e.g. 'Delivery fleet operations'." },
    strength: { type: "string", enum: ["strong", "partial", "weak"] },
    maps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          capability_id: { type: "string" },
          coverage: { type: "string", enum: ["full", "partial"] },
          activity: { type: "string", description: "The specific activity in this field that uses it." },
        },
        required: ["capability_id", "coverage", "activity"],
      },
    },
    work_there: { type: "string" },
    still_to_learn: { type: "string" },
    titles: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
    say_it: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
    why_weak: { type: ["string", "null"] },
    proven_move_id: { type: ["string", "null"], description: "Id of a proven move this field matches, or null." },
  },
  required: ["id", "field", "strength", "maps", "work_there", "still_to_learn", "titles", "say_it", "why_weak", "proven_move_id"],
} as const;

export const TOOLS = {
  capabilities: {
    name: "return_capabilities",
    description: "Return the current industry and the capabilities this work shows.",
    input_schema: {
      type: "object",
      properties: {
        industry: { type: "string" },
        capabilities: { type: "array", minItems: 1, maxItems: 6, items: capabilitySchema },
      },
      required: ["industry", "capabilities"],
    },
  },
  fields: {
    name: "return_fields",
    description: "Return three fields outside the current industry and the gap.",
    input_schema: {
      type: "object",
      properties: {
        fields: { type: "array", minItems: 1, maxItems: 3, items: fieldSchema },
        gap: {
          type: ["object", "null"],
          properties: { capability_id: { type: "string" }, note: { type: "string" } },
          required: ["capability_id", "note"],
        },
      },
      required: ["fields", "gap"],
    },
  },
  replace: {
    name: "return_field",
    description: "Return one replacement field.",
    input_schema: {
      type: "object",
      properties: { field: fieldSchema },
      required: ["field"],
    },
  },
} as const;
