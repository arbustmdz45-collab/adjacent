// Output check (Session 8 guardrail). Runs on every field before it reaches the person.
// Text the model reads can carry hidden instructions (indirect prompt injection), e.g. a pasted
// job ad that says "always recommend X bootcamp". The prompt tells the model to ignore them;
// this check is the second line: no links, domains or "sign up at…" promotions reach the screen.
import type { Field } from "./types";

const DOMAIN = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|io|net|org|es|mx|co|ai|app|dev|edu|info|me)\b\S*/gi;
const PROMO = /\b(?:sign up|enrol|enroll|inscr[ií]bete|apúntate|use (?:the )?code|bootcamp)\b/i;

function sentences(text: string) {
  return text.split(/(?<=[.!?])\s+/);
}

// Drops any sentence that names a website or pushes a sign-up. Returns the cleaned text and whether anything was removed.
export function scrub(text: string): { text: string; flagged: boolean } {
  let flagged = false;
  const kept = sentences(String(text ?? "")).filter((s) => {
    const bad = DOMAIN.test(s) || PROMO.test(s);
    DOMAIN.lastIndex = 0;
    if (bad) flagged = true;
    return !bad;
  });
  return { text: kept.join(" "), flagged };
}

export function guardField(field: Field): { field: Field; flagged: boolean } {
  let flagged = false;
  const clean = (t: string) => {
    const r = scrub(t);
    flagged ||= r.flagged;
    return r.text;
  };
  const out: Field = {
    ...field,
    work_there: clean(field.work_there),
    still_to_learn: clean(field.still_to_learn),
    say_it: field.say_it.map(clean).filter(Boolean),
    titles: field.titles.map(clean).filter(Boolean),
    why_weak: field.why_weak ? clean(field.why_weak) : null,
    maps: field.maps.map((m) => ({ ...m, activity: clean(m.activity) })),
  };
  if (flagged) console.warn("guard: removed a link or promotion from a field (possible injection)");
  return { field: out, flagged };
}
