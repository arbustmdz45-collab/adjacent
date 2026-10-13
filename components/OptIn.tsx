"use client";

import { useState } from "react";
import type { Capability, Field } from "@/lib/types";

type Props = { description: string; industry: string; capabilities: Capability[]; fields: Field[] };

// "Let employers find me": the step that turns a free reading into someone employers can meet.
export default function OptIn({ description, industry, capabilities, fields }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [interests, setInterests] = useState<string[]>(fields.filter((f) => f.strength !== "weak").map((f) => f.field));
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<{ kind: "idle" | "sending" | "ok" | "err"; message?: string; manage?: string }>({ kind: "idle" });

  if (state.kind === "ok") {
    return (
      <section className="optin stack gap-12" aria-live="polite">
        <p className="eyebrow">You&apos;re in the pool</p>
        <h2 className="h3">We&apos;ll email you before anyone sees your contact details.</h2>
        <p className="prose">
          Save this link to see, download or delete your data at any time:{" "}
          <a href={state.manage} className="selectable">
            {typeof window !== "undefined" ? window.location.origin : ""}
            {state.manage}
          </a>
          . Anyone with this link can see your profile, so keep it private.
        </p>
      </section>
    );
  }

  if (!open) {
    return (
      <section className="optin stack gap-12">
        <p className="eyebrow">Next step</p>
        <h2 className="h3">Let employers in these fields find you</h2>
        <p className="prose">
          We work with employers who are hiring for exactly this kind of work and are open to people from other fields. Join and
          we&apos;ll show them what you can do, without your name or contact details until you say yes.
        </p>
        <div>
          <button className="button" type="button" onClick={() => setOpen(true)}>
            Let employers find me →
          </button>
        </div>
      </section>
    );
  }

  return (
    <form
      className="optin stack gap-20"
      onSubmit={async (e) => {
        e.preventDefault();
        setState({ kind: "sending" });
        try {
          const res = await fetch("/api/pool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, city, description, industry, capabilities, interests, consent, website: "" }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return setState({ kind: "err", message: data.error || "That didn't go through. Try again." });
          setState({ kind: "ok", manage: data.manage });
        } catch {
          setState({ kind: "err", message: "That didn't go through. Check your connection and try again." });
        }
      }}
    >
      <p className="eyebrow">Let employers find you</p>
      <label className="stack gap-8">
        <span className="small-label">First name</span>
        <input className="input" required value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      </label>
      <label className="stack gap-8">
        <span className="small-label">Email</span>
        <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </label>
      <label className="stack gap-8">
        <span className="small-label">City or area where you&apos;d work</span>
        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Barcelona" />
      </label>
      {fields.length > 0 && (
        <fieldset className="stack gap-12" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="small-label" style={{ marginBottom: 10 }}>
            Which of these would you consider?
          </legend>
          <div className="checks">
            {fields.map((f) => (
              <label key={f.id} className="check-row">
                <input
                  type="checkbox"
                  checked={interests.includes(f.field)}
                  onChange={(e) =>
                    setInterests((prev) => (e.target.checked ? [...prev, f.field] : prev.filter((x) => x !== f.field)))
                  }
                />
                <span>{f.field}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <label className="check-row">
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          I’m 18 or over. Keep my description and the activities above for up to 12 months. adjacent may use AI to compare them with
          employers’ roles, and show employers my background, activities and quotes from my own words, without my name or
          contact details. Email me before passing my details to anyone. If I’m hired, an anonymous count (like “one hire from
          hospitality into logistics”) may be kept even after I delete my profile. I can see, download or delete my data at any
          time.{" "}
          <a href="/privacy" target="_blank" rel="noopener">
            Privacy policy
          </a>
        </span>
      </label>
      {state.kind === "err" && <p className="form-status err">{state.message}</p>}
      <div className="actions">
        <button className="button" type="submit" disabled={state.kind === "sending"}>
          {state.kind === "sending" ? "Saving…" : "Join the pool"}
        </button>
        <button className="text-button" type="button" onClick={() => setOpen(false)}>
          Not now
        </button>
      </div>
    </form>
  );
}
