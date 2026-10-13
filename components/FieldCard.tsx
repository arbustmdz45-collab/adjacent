"use client";

import { useState } from "react";
import type { Capability, Field, Strength } from "@/lib/types";
import { pad } from "./Capabilities";

const LABEL: Record<Strength, string> = { strong: "Strong fit", partial: "Partial fit", weak: "Weak fit" };
const FILLED: Record<Strength, number> = { strong: 3, partial: 2, weak: 1 };

function Meter({ strength }: { strength: Strength }) {
  const on = strength === "weak" ? "var(--weak)" : "var(--ink)";
  return (
    <span className={`strength ${strength === "weak" ? "weak" : ""}`}>
      <svg width="30" height="10" viewBox="0 0 30 10" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={i * 11} y="0" width="8" height="10" rx="1" fill={i < FILLED[strength] ? on : "var(--off)"} />
        ))}
      </svg>
      {LABEL[strength]}
    </span>
  );
}

function CopyLine({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="say-line">
      <p className="prose">{text}</p>
      <button
        className="text-button"
        type="button"
        onClick={() =>
          navigator.clipboard
            ?.writeText(text)
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
            .catch(() => {})
        }
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

type Props = {
  field: Field;
  capabilities: Capability[];
  busy: boolean;
  locked: boolean;
  onReject: (reason: string) => void;
};

export default function FieldCard({ field, capabilities, busy, locked, onReject }: Props) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const index = (id: string) => capabilities.findIndex((c) => c.id === id);
  const maps = field.maps
    .filter((m) => index(m.capability_id) >= 0)
    .sort((a, b) => index(a.capability_id) - index(b.capability_id));

  return (
    <article className={`field ${busy ? "busy" : ""}`} aria-busy={busy}>
      <div className="row">
        <h3 className="h3">{field.field}</h3>
        <Meter strength={field.strength} />
      </div>

      <div className="stack gap-10">
        <p className="eyebrow">Uses what you already do</p>
        {maps.map((m) => (
          <p className="map-line" key={m.capability_id}>
            <span className="num">{pad(index(m.capability_id) + 1)}</span>&nbsp;&nbsp;
            {m.coverage === "full" ? "Fully." : "Partly."} {m.activity}
          </p>
        ))}
      </div>

      <div className="stack gap-8">
        <p className="eyebrow">What the work looks like there</p>
        <p className="prose">{field.work_there}</p>
      </div>

      {field.strength === "weak" && field.why_weak && (
        <div className="stack gap-8">
          <p className="eyebrow weak">Why this is a weak fit</p>
          <p className="prose">{field.why_weak}</p>
        </div>
      )}

      <div className="stack gap-8">
        <p className="eyebrow">What you&apos;d still need to learn</p>
        <p className="prose">{field.still_to_learn}</p>
      </div>

      {field.titles.length > 0 && (
        <div className="stack gap-10">
          <p className="eyebrow">Search for</p>
          <ul className="titles">
            {field.titles.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {field.say_it.length > 0 && (
        <div className="stack gap-10">
          <p className="eyebrow">How to say it on your CV</p>
          {field.say_it.map((line, i) => (
            <CopyLine key={i} text={line} />
          ))}
        </div>
      )}

      {busy && <p className="quiet">Finding another field for you…</p>}

      {!locked &&
        !busy &&
        (rejecting ? (
          <form
            className="stack gap-12"
            onSubmit={(e) => {
              e.preventDefault();
              onReject(reason.trim());
              setRejecting(false);
              setReason("");
            }}
          >
            <label className="stack gap-8">
              <span className="small-label">Why not this one? (optional, it shapes the next suggestion)</span>
              <input
                className="input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. I can't take a pay cut, or I don't want to work nights"
                autoFocus
              />
            </label>
            <div className="actions">
              <button className="button" type="submit">
                Show me another
              </button>
              <button className="text-button" type="button" onClick={() => setRejecting(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <button className="text-button" type="button" onClick={() => setRejecting(true)}>
              Not for me? Show another
            </button>
          </div>
        ))}
    </article>
  );
}
