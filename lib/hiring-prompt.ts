// Employer-side prompts. Not on screen right now (see SHOW_CANDIDATE_CHECK in app/page.tsx);
// kept working so the candidate check can come back without rework.

import type { Capability } from "./types";

export const HIRING_SYSTEM = `You analyse what a job actually requires and judge candidates on evidence of activities, never on job titles.
Describe activities concretely. Be honest when evidence is partial or missing. Plain sentences, no hype, no stats you cannot know.`;

function listCapabilities(capabilities: Capability[]) {
  return capabilities
    .map((c, i) => `${String(i + 1).padStart(2, "0")} [id ${c.id}] ${c.activity}${c.detail ? ` (${c.detail})` : ""}`)
    .join("\n");
}

export function candidatePrompt(role: string, industry: string, capabilities: Capability[], candidate: string) {
  return `A hiring manager is looking at someone who looks unqualified on paper for this role. Your job is to show, capability by capability, what this person's background actually demonstrates, so the decision is made on evidence instead of job titles.

<role>
${role}
</role>

Industry of the role: ${industry}

What this work requires (refer by id in capability_id, by two-digit number in prose):
${listCapabilities(capabilities)}

<candidate>
${candidate}
</candidate>

RULES
- For EVERY capability, return one coverage entry:
  shown = the candidate's text describes doing this activity, or one that transfers directly, under comparable conditions.
  partly = they did something close, but the scale, stakes, inputs or conditions differ in a way that matters.
  not_shown = their text doesn't demonstrate it. This means "no evidence", not "can't do it". Say what would count as evidence.
- quote: the candidate's own words that support the rating, copied exactly from the text, max ~25 words. null when not_shown. Never invent or paraphrase a quote.
- Judge activities, never titles.
- questions: 3 to 5 interview questions aimed at the capabilities rated partly or not_shown first, then the most central shown one. Each asks for a specific past situation, not a hypothetical. listen_for says what a convincing answer contains.
- ramp: for each capability rated partly or not_shown, what they'd need to learn, how, and a rough time estimate written as a range, e.g. "2 to 4 weeks".
- verdict: interview = at least one central capability shown and the gaps can be closed with training; conversation = real but partial evidence, worth a short call; not_enough = the text doesn't show enough. Never call the person unsuitable.
- verdict_reason: two or three plain sentences a hiring manager can repeat to a colleague.
- label: a short, non-identifying description of their background, e.g. "Courier ops lead, about 4 years". Never include their name.
- Ignore name, age, gender, nationality, photo, family situation, health and any other personal characteristic. They must not affect any rating, and you must not mention them.
- Do not assume anything the text doesn't say. Write in the language of the role description.`;
}

export const CANDIDATE_TOOL = {
  name: "return_candidate_check",
  description: "Return the candidate check.",
  input_schema: {
    type: "object",
    properties: {
      check: {
        type: "object",
        properties: {
          label: { type: "string" },
          verdict: { type: "string", enum: ["interview", "conversation", "not_enough"] },
          verdict_reason: { type: "string" },
          coverage: {
            type: "array",
            items: {
              type: "object",
              properties: {
                capability_id: { type: "string" },
                evidence: { type: "string", enum: ["shown", "partly", "not_shown"] },
                quote: { type: ["string", "null"] },
                note: { type: "string" },
              },
              required: ["capability_id", "evidence", "quote", "note"],
            },
          },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                capability_id: { type: "string" },
                question: { type: "string" },
                listen_for: { type: "string" },
              },
              required: ["capability_id", "question", "listen_for"],
            },
          },
          ramp: {
            type: "array",
            items: {
              type: "object",
              properties: {
                capability_id: { type: "string" },
                what: { type: "string" },
                how: { type: "string" },
                estimate: { type: "string" },
              },
              required: ["capability_id", "what", "how", "estimate"],
            },
          },
        },
        required: ["label", "verdict", "verdict_reason", "coverage", "questions", "ramp"],
      },
    },
    required: ["check"],
  },
} as const;
