import type { CandidateResponse, Capability } from "./types";

const norm = (s: string) => s.toLowerCase().replace(/[\s"“”'‘’.,;:()\-–—]+/g, " ").trim();

// Keep the check honest: one entry per capability, in order, and drop any
// quote that isn't actually in the candidate's text.
export function checkAgainst(check: CandidateResponse["check"], caps: Capability[], text: string): CandidateResponse["check"] {
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

