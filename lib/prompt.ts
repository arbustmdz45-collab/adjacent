// Everything the model is told lives in this file.
// To change how the product thinks, edit here. Nothing else needs to move.

import type { Capability, Field, Rejection } from "./types";

export const SYSTEM = `You analyse what a job actually requires, then find other fields that already produce that capability.

The middle layer is the product: capabilities, not job titles. A hiring manager will read your reasoning and decide whether to trust it, so every claim has to be concrete enough to disagree with.

CAPABILITIES
- Describe the actual activity, not a label. Use the object, scale and constraint the description gives you.
  Good: "Keeping a nervous 500kg animal calm during a procedure."
  Bad: "Animal handling." Bad: "Strong communication skills." Bad: "Works well under pressure."
- Each one is a single sentence a person could be watched doing.
- Add a one-sentence detail: what it looks like in practice, or what makes it hard.
- Do not invent duties the description does not imply. If the description is thin, return fewer capabilities rather than padding.

INDUSTRY
- Name the industry the role sits in, broadly enough that its sub-sectors are covered too (e.g. "healthcare and emergency services", not "ambulance dispatch").

FIELDS
- Every field must sit outside that industry. Not a sub-sector of it, and not a role that is inside it under another name.
- Prefer fields with a real pool of people who could plausibly move, over exotic one-off matches.
- For each field, name the specific activity in that field that transfers, every time. Not "they also handle pressure": say what they do, where, how often.
- where_built: the concrete situation where those people developed it. The setting, the moment, the thing they do repeatedly.
- still_to_learn: name which capabilities are not covered (by number), plus the domain knowledge, procedures or certifications they would need.
- strength, honestly:
  strong = fully covers at least one central capability, under conditions close to this job's.
  partial = real transfer on some capabilities, clear gaps on others.
  weak = the activity is real but the conditions, stakes or inputs differ materially. Explain exactly why in why_weak.
- If a match is weak, say so rather than padding. Three confident answers every time is a lie. A weak third field, labelled weak, is better than a dressed-up one.
- why_weak is null unless strength is "weak".

GAP
- If a capability is not covered well by any field you return, name it and explain why in one or two sentences (for example, the only people who do it at this level are inside the excluded industry). Otherwise null.

STYLE
- Write in the same language as the role description.
- Plain sentences. No stats you cannot know, no company names presented as facts about hiring, no hype.`;

export function capabilitiesPrompt(role: string) {
  return `Here is a description of work that needs doing:

<role>
${role}
</role>

Identify the industry it sits in and the 4 to 6 capabilities the work actually demands. Use ids c1, c2, c3… in order.`;
}

function listCapabilities(capabilities: Capability[]) {
  return capabilities
    .map((c, i) => `${String(i + 1).padStart(2, "0")} [id ${c.id}] ${c.activity}${c.detail ? ` (${c.detail})` : ""}`)
    .join("\n");
}

function listRejected(rejected: Rejection[]) {
  if (!rejected.length) return "";
  return `

The user has already rejected these fields. Do not return them or close variants of them, and take each reason into account when choosing what to return instead:
${rejected.map((r) => `- ${r.field}${r.reason ? `: ${r.reason}` : " (no reason given)"}`).join("\n")}`;
}

export function fieldsPrompt(role: string, industry: string, capabilities: Capability[], rejected: Rejection[]) {
  return `<role>
${role}
</role>

Industry to exclude: ${industry}

What this work requires. The user may have edited this list; treat it as authoritative and do not rewrite it. Refer to capabilities by their id in maps and gap, and by their two-digit number in prose:
${listCapabilities(capabilities)}${listRejected(rejected)}

Return exactly 3 fields outside that industry, ordered strongest first, plus the gap. Use field ids f1, f2, f3.`;
}

export function replacePrompt(
  role: string,
  industry: string,
  capabilities: Capability[],
  keep: Field[],
  rejected: Rejection[],
) {
  return `<role>
${role}
</role>

Industry to exclude: ${industry}

What this work requires (authoritative, refer by id in maps, by two-digit number in prose):
${listCapabilities(capabilities)}

Fields already on screen, which stay: ${keep.map((f) => f.field).join("; ") || "none"}.${listRejected(rejected)}

Return ONE new field to replace the most recently rejected one. It must differ from the fields that stay and from every rejected field. If nothing good is left, return the best weak match and say so in why_weak.`;
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
          activity: { type: "string", description: "The specific activity in this field that transfers." },
        },
        required: ["capability_id", "coverage", "activity"],
      },
    },
    where_built: { type: "string" },
    still_to_learn: { type: "string" },
    why_weak: { type: ["string", "null"] },
  },
  required: ["id", "field", "strength", "maps", "where_built", "still_to_learn", "why_weak"],
} as const;

export const TOOLS = {
  capabilities: {
    name: "return_capabilities",
    description: "Return the industry and the capabilities the work requires.",
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
    description: "Return three fields outside the industry and the gap.",
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
