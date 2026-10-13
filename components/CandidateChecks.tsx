"use client";

import { useState } from "react";
import { checkCandidate } from "@/lib/api";
import type { CandidateCheck, Capability, Evidence, Verdict } from "@/lib/types";
import { pad } from "./Capabilities";
import Steps from "./Steps";

const VERDICT: Record<Verdict, string> = {
  interview: "Worth an interview",
  conversation: "Worth a short call first",
  not_enough: "Not enough evidence yet",
};
const EVIDENCE: Record<Evidence, string> = { shown: "Shown.", partly: "Partly shown.", not_shown: "Not shown." };
const FILLED: Record<Verdict, number> = { interview: 3, conversation: 2, not_enough: 1 };

type Stored = CandidateCheck & { capsKey: string; source: string };

const keyOf = (caps: Capability[]) => caps.map((c) => `${c.id}:${c.activity}`).join("|");

function VerdictMark({ verdict }: { verdict: Verdict }) {
  const weak = verdict === "not_enough";
  const on = weak ? "var(--weak)" : "var(--ink)";
  return (
    <span className={`strength ${weak ? "weak" : ""}`}>
      <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={i * 11} y="0" width="8" height="10" rx="1" fill={i < FILLED[verdict] ? on : "var(--off)"} />
        ))}
      </svg>
      {VERDICT[verdict]}
    </span>
  );
}

function CheckCard({
  check,
  capabilities,
  stale,
  busy,
  onRemove,
  onRerun,
}: {
  check: Stored;
  capabilities: Capability[];
  stale: boolean;
  busy: boolean;
  onRemove: () => void;
  onRerun: () => void;
}) {
  const index = (id: string) => capabilities.findIndex((c) => c.id === id);
  const num = (id: string) => (index(id) >= 0 ? pad(index(id) + 1) : "··");
  return (
    <article className="field">
      <div className="row">
        <h3 className="h3">{check.label}</h3>
        <VerdictMark verdict={check.verdict} />
      </div>
      <p className="prose">{check.verdict_reason}</p>

      {stale && (
        <div className="notice">
          <p>This check was made against an earlier version of what the work requires.</p>
          <div>
            <button className="button" type="button" disabled={busy} onClick={onRerun}>
              Check again against the current list
            </button>
          </div>
        </div>
      )}

      <div className="stack gap-12">
        <p className="eyebrow">Against what this work requires</p>
        {check.coverage.map((c) => (
          <div key={c.capability_id} className="stack gap-8 evidence-row">
            <p className="map-line">
              <span className="num">{num(c.capability_id)}</span>&nbsp;&nbsp;
              <span className={c.evidence === "not_shown" ? "muted-strong" : "strong-text"}>{EVIDENCE[c.evidence]}</span>{" "}
              {c.note}
            </p>
            {c.quote && <p className="quote">“{c.quote}”</p>}
          </div>
        ))}
      </div>

      {check.questions.length > 0 && (
        <div className="stack gap-12">
          <p className="eyebrow">Ask in the interview</p>
          {check.questions.map((q, i) => (
            <div key={i} className="stack gap-8">
              <p className="map-line">
                <span className="num">{num(q.capability_id)}</span>&nbsp;&nbsp;
                <span className="strong-text">{q.question}</span>
              </p>
              <p className="cap-detail indent">Listen for: {q.listen_for}</p>
            </div>
          ))}
        </div>
      )}

      {check.ramp.length > 0 && (
        <div className="stack gap-12">
          <p className="eyebrow">To close the gaps</p>
          {check.ramp.map((r, i) => (
            <p key={i} className="map-line">
              <span className="num">{num(r.capability_id)}</span>&nbsp;&nbsp;
              <span className="strong-text">{r.what}</span> {r.how} <span className="muted-strong">Rough estimate: {r.estimate}.</span>
            </p>
          ))}
        </div>
      )}

      <div>
        <button className="text-button" type="button" onClick={onRemove}>
          Remove this check
        </button>
      </div>
    </article>
  );
}

type Props = { role: string; industry: string; capabilities: Capability[]; locked: boolean };

export default function CandidateChecks({ role, industry, capabilities, locked }: Props) {
  const [draft, setDraft] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checks, setChecks] = useState<Stored[]>([]);
  const currentKey = keyOf(capabilities);

  async function run(text: string, replaceId?: string) {
    if (text.length < 40) return;
    setChecking(true);
    setError(null);
    try {
      const out = await checkCandidate({ role, industry, capabilities, candidate: text });
      const fresh: Stored = { ...out.check, id: `k${Date.now()}`, capsKey: currentKey, source: text };
      setChecks((prev) => (replaceId ? prev.map((x) => (x.id === replaceId ? fresh : x)) : [fresh, ...prev]));
      if (!replaceId) setDraft("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="stack gap-40">
      <header className="stack gap-10">
        <h2 className="h2">Check someone who looks wrong on paper</h2>
        <p className="sub">
          Paste their CV, or a few lines on what they&apos;ve actually done. You&apos;ll see what it shows against each
          capability above, what to ask them, and what training would close the gaps. Nothing is saved.
        </p>
      </header>

      <form
        className="stack gap-12"
        onSubmit={(e) => {
          e.preventDefault();
          run(draft.trim());
        }}
      >
        <label htmlFor="candidate" className="small-label">
          Their background. Names, age and other personal details are ignored.
        </label>
        <textarea
          id="candidate"
          className="textarea"
          rows={7}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={checking}
          placeholder="Ops desk lead at a food delivery company, 4 years. Ran the evening shift: 300+ couriers across 12 zones, reassigned orders when riders went offline…"
        />
        <div>
          <button className="button" type="submit" disabled={locked || checking || draft.trim().length < 40}>
            Check this candidate
          </button>
        </div>
      </form>

      {checking && (
        <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 32 }}>
          <Steps
            steps={[
              { text: "Reading what this person has actually done, ignoring titles and personal details", done: true },
              { text: `Comparing it with the ${capabilities.length} things this work requires`, done: false },
            ]}
          />
        </div>
      )}

      {error && (
        <div className="notice error">
          <p>{error}</p>
        </div>
      )}

      {checks.map((c) => (
        <CheckCard
          key={c.id}
          check={c}
          capabilities={capabilities}
          stale={c.capsKey !== currentKey}
          busy={locked || checking}
          onRerun={() => run(c.source, c.id)}
          onRemove={() => setChecks((prev) => prev.filter((x) => x.id !== c.id))}
        />
      ))}
    </section>
  );
}
