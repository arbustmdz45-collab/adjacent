"use client";

import { useState } from "react";
import CandidateChecks from "@/components/CandidateChecks";
import Capabilities, { pad } from "@/components/Capabilities";
import FieldCard from "@/components/FieldCard";
import Steps from "@/components/Steps";
import { getCapabilities, getFields, replaceField } from "@/lib/api";
import type { Capability, Field, Gap, Rejection } from "@/lib/types";

type Phase = "empty" | "reading" | "matching" | "ready";

const SHOW_CANDIDATE_CHECK = false;

export default function Home() {
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState("");
  const [phase, setPhase] = useState<Phase>("empty");
  const [industry, setIndustry] = useState("");
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [gap, setGap] = useState<Gap>(null);
  const [rejected, setRejected] = useState<Rejection[]>([]);
  const [stale, setStale] = useState(false); // inputs changed since fields were matched
  const [replacing, setReplacing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingIndustry, setEditingIndustry] = useState(false);
  const [industryDraft, setIndustryDraft] = useState("");
  const [rematching, setRematching] = useState(false);

  async function match(caps: Capability[], ind: string, rej: Rejection[], r = role) {
    setPhase("matching");
    setError(null);
    try {
      const out = await getFields({ role: r, industry: ind, capabilities: caps, rejected: rej });
      setFields(out.fields);
      setGap(out.gap);
      setStale(false);
      setPhase("ready");
    } catch (e) {
      setError((e as Error).message);
      setPhase(fields.length ? "ready" : "matching");
    } finally {
      setRematching(false);
    }
  }

  async function start() {
    const r = draft.trim();
    if (!r) return;
    setRole(r);
    setPhase("reading");
    setError(null);
    setFields([]);
    setGap(null);
    setRejected([]);
    setStale(false);
    try {
      const out = await getCapabilities(r);
      setIndustry(out.industry);
      setCapabilities(out.capabilities);
      await match(out.capabilities, out.industry, [], r);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function reject(field: Field, reason: string) {
    const rej = [...rejected, { field: field.field, reason }];
    setRejected(rej);
    setReplacing(field.id);
    setError(null);
    try {
      const keep = fields.filter((f) => f.id !== field.id);
      const out = await replaceField({ role, industry, capabilities, keep, rejected: rej });
      const fresh = { ...out.field, id: `${field.id}-${rej.length}` };
      setFields((prev) => prev.map((f) => (f.id === field.id ? fresh : f)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setReplacing(null);
    }
  }

  function changeCaps(next: Capability[]) {
    setCapabilities(next);
    setStale(true);
  }

  function restart() {
    setPhase("empty");
    setError(null);
  }

  const busy = phase === "reading" || phase === "matching" || replacing !== null;
  const gapIndex = gap ? capabilities.findIndex((c) => c.id === gap.capability_id) : -1;

  // ---------- Empty ----------
  if (phase === "empty") {
    return (
      <main className="page centered">
        <form
          className="column narrow"
          style={{ gap: 20 }}
          onSubmit={(e) => {
            e.preventDefault();
            start();
          }}
        >
          <label htmlFor="role" className="label">
            Describe what you actually do all day in your current job
          </label>
          <textarea
            id="role"
            className="textarea big"
            rows={9}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="I run the floor at a busy restaurant on weekends: I seat walk-ins when we're full, calm down angry tables, and decide which orders the kitchen does first when we fall behind…"
          />
          <div>
            <button className="button" type="submit" disabled={draft.trim().length < 20}>
              Find where you could go
            </button>
          </div>
        </form>
      </main>
    );
  }

  const roleBlock = (
    <section className="stack gap-12">
      <div className="row">
        <p className="eyebrow">What you described</p>
        {!busy && (
          <button className="link" style={{ fontSize: 15 }} type="button" onClick={restart}>
            Start again
          </button>
        )}
      </div>
      <p className="quiet">{role}</p>
    </section>
  );

  // ---------- Thinking, step one ----------
  if (phase === "reading") {
    return (
      <main className="page centered">
        <div className="column narrow">
          {roleBlock}
          <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 32 }} className="stack gap-24">
            {error ? (
              <div className="notice error">
                <p>{error}</p>
                <div className="actions">
                  <button className="button" type="button" onClick={start}>
                    Try again
                  </button>
                  <button className="text-button" type="button" onClick={restart}>
                    Edit the description
                  </button>
                </div>
              </div>
            ) : (
              <Steps steps={[{ text: "Separating what you actually do from what your job is called", done: false }]} />
            )}
          </div>
        </div>
      </main>
    );
  }

  // ---------- Result (with fields still loading on first pass) ----------
  return (
    <main className="page">
      <div className="column">
        {roleBlock}

        <section className="stack gap-40">
          <header className="stack gap-10">
            <h2 className="h2">What you can already do</h2>
            <p className="sub">
              {capabilities.length} things your work shows you can do, written as activities, not job titles. If one is
              wrong or missing, change it and look again.
            </p>
          </header>
          <Capabilities
            capabilities={capabilities}
            locked={busy}
            onUpdate={(id, activity, detail) =>
              changeCaps(capabilities.map((c) => (c.id === id ? { ...c, activity, detail } : c)))
            }
            onRemove={(id) => changeCaps(capabilities.filter((c) => c.id !== id))}
            onAdd={(activity, detail) => {
              const n = Math.max(0, ...capabilities.map((c) => Number(c.id.replace(/\D/g, "")) || 0)) + 1;
              changeCaps([...capabilities, { id: `c${n}`, activity, detail }]);
            }}
          />
        </section>

        <section className="stack gap-40">
          <header className="stack gap-10">
            <h2 className="h2">Where you could go</h2>
            <p className="sub">
              Three fields outside {industry ? industry.toLowerCase() : "your industry"} that need what you already do.
              Each one says why, and what you&apos;d still have to learn, so you can judge it yourself.
            </p>
            {!busy &&
              (editingIndustry ? (
                <form
                  className="stack gap-12"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (industryDraft.trim()) {
                      setIndustry(industryDraft.trim());
                      setStale(true);
                    }
                    setEditingIndustry(false);
                  }}
                >
                  <label className="stack gap-8">
                    <span className="small-label">Your current industry (it's left out of the suggestions)</span>
                    <input
                      className="input"
                      value={industryDraft}
                      onChange={(e) => setIndustryDraft(e.target.value)}
                      autoFocus
                    />
                  </label>
                  <div className="actions">
                    <button className="button" type="submit">
                      Save
                    </button>
                    <button className="text-button" type="button" onClick={() => setEditingIndustry(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => {
                      setIndustryDraft(industry);
                      setEditingIndustry(true);
                    }}
                  >
                    Wrong industry? Change it
                  </button>
                </div>
              ))}
          </header>

          {stale && !busy && (
            <div className="notice">
              <p>You changed what you can do. The fields below were found for the earlier version.</p>
              <div>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    setRematching(true);
                    match(capabilities, industry, rejected);
                  }}
                >
                  Look again
                </button>
              </div>
            </div>
          )}

          {error && phase === "ready" && (
            <div className="notice error">
              <p>{error}</p>
            </div>
          )}

          {phase === "matching" ? (
            error ? (
              <div className="notice error">
                <p>{error}</p>
                <div>
                  <button className="button" type="button" onClick={() => match(capabilities, industry, rejected)}>
                    Try again
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ borderTop: "1px solid var(--rule)", paddingTop: 32 }}>
                <Steps
                  steps={[
                    rematching
                      ? { text: "Read your edited list of what you can do", done: true }
                      : {
                          text: `Found ${capabilities.length} things your work shows you can do, each written as an activity`,
                          done: true,
                        },
                    {
                      text: `Looking for fields outside ${industry.toLowerCase() || "your industry"} that need these things, and checking which moves are realistic`,
                      done: false,
                    },
                  ]}
                />
              </div>
            )
          ) : (
            <>
              {fields.map((f) => (
                <FieldCard
                  key={f.id}
                  field={f}
                  capabilities={capabilities}
                  busy={replacing === f.id}
                  locked={busy}
                  onReject={(reason) => reject(f, reason)}
                />
              ))}

              {gap && gapIndex >= 0 && (
                <aside className="stack gap-8" style={{ borderTop: "1px solid var(--rule)", paddingTop: 32 }}>
                  <p className="eyebrow">Not used by any of these</p>
                  <p className="prose">
                    <span className="num">{pad(gapIndex + 1)}</span>&nbsp;&nbsp;{gap.note}
                  </p>
                </aside>
              )}

              {rejected.length > 0 && (
                <p className="quiet" style={{ fontSize: 15 }}>
                  You said no to: {rejected.map((r) => r.field).join(", ")}. These won&apos;t come up again.
                </p>
              )}
            </>
          )}
        </section>

        {/* Candidate check: built and working, kept off the screen while the product focuses on pivoting.
            Set SHOW_CANDIDATE_CHECK to true to bring it back. */}
        {SHOW_CANDIDATE_CHECK && capabilities.length > 0 && (
          <CandidateChecks key={role} role={role} industry={industry} capabilities={capabilities} locked={busy} />
        )}
      </div>
    </main>
  );
}
