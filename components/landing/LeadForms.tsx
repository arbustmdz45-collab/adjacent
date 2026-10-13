"use client";

import { useState } from "react";

type Status = { kind: "idle" | "sending" | "ok" | "err"; message?: string };

async function send(payload: Record<string, unknown>): Promise<Status> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { kind: "err", message: data.error || "That didn't go through. Try again in a moment." };
    return { kind: "ok", message: data.message };
  } catch {
    return { kind: "err", message: "That didn't go through. Check your connection and try again." };
  }
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  return (
    <form
      className="inline-form"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus({ kind: "sending" });
        const s = await send({ type: "newsletter", email, website: "" });
        setStatus(s.kind === "ok" ? { kind: "ok", message: "You're on the list. The first letter comes when it's ready." } : s);
        if (s.kind === "ok") setEmail("");
      }}
    >
      <label htmlFor="news-email" className="caption">
        Your email
      </label>
      <div className="inline-row">
        <input
          id="news-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
        />
        <button type="submit" disabled={status.kind === "sending"}>
          {status.kind === "sending" ? "SENDING…" : "SUBSCRIBE →"}
        </button>
      </div>
      <p className="caption" aria-live="polite">
        {status.kind === "ok" || status.kind === "err" ? (
          <span className={`form-status ${status.kind}`} style={{ fontFamily: "var(--serif)", letterSpacing: 0, textTransform: "none" }}>
            {status.message}
          </span>
        ) : (
          "No spam. One letter a month. Unsubscribe any time."
        )}
      </p>
    </form>
  );
}

export function EmployerForm() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  if (status.kind === "ok") {
    return (
      <div className="form">
        <div className="paper" aria-live="polite">
          <p className="eyebrow">Received</p>
          <p className="h3">Thanks. We&apos;ll be in touch about next steps for {company || "your team"}.</p>
          <p className="prose">Nothing about the role is shared with anyone else.</p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="form"
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus({ kind: "sending" });
        setStatus(await send({ type: "employer", email, company, role, consent, website }));
      }}
    >
      <div className="paper">
        <div className="field-group">
          <label htmlFor="emp-email">Work email</label>
          <input id="emp-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
        </div>
        <div className="field-group">
          <label htmlFor="emp-company">Company</label>
          <input id="emp-company" type="text" required autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
        </div>
        <div className="field-group">
          <label htmlFor="emp-role">The role that&apos;s hard to fill</label>
          <textarea
            id="emp-role"
            required
            rows={3}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. night-shift warehouse lead, open for 4 months, most applicants drop out in week two"
          />
        </div>
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
          <label htmlFor="emp-website">Website</label>
          <input id="emp-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <label className="consent" htmlFor="emp-consent">
          <input id="emp-consent" type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            You can contact me about a pilot. I&apos;ve read the <a href="/privacy">privacy note</a>.
          </span>
        </label>
        <div className="start-row">
          <button className="btn" type="submit" disabled={status.kind === "sending"}>
            {status.kind === "sending" ? "Sending…" : "Request a pilot →"}
          </button>
        </div>
        {status.kind === "err" && (
          <p className="form-status err" aria-live="polite">
            {status.message}
          </p>
        )}
      </div>
    </form>
  );
}
