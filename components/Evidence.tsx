import type { Match } from "@/lib/store";
import type { Role } from "@/lib/store";

const VERDICT: Record<string, string> = {
  interview: "Worth an interview",
  conversation: "Worth a short call first",
  not_enough: "Not enough evidence yet",
};
const EVIDENCE: Record<string, string> = { shown: "Shown.", partly: "Partly shown.", not_shown: "Not shown." };
const pad = (n: number) => String(n).padStart(2, "0");

// One person's background against one role, capability by capability, in their own words.
export default function Evidence({ match, role }: { match: Match; role: Role }) {
  const num = (id: string) => {
    const i = role.capabilities.findIndex((c) => c.id === id);
    return i >= 0 ? pad(i + 1) : "··";
  };
  const c = match.check;
  return (
    <div className="stack gap-20">
      <div className="row">
        <h3 className="h3">{c.label}</h3>
        <span className={`strength ${match.verdict === "not_enough" ? "weak" : ""}`}>{VERDICT[match.verdict] || match.verdict}</span>
      </div>
      <p className="small-label">
        Comes from {match.candidate.industry || "another field"}
        {match.candidate.city ? ` · ${match.candidate.city}` : ""}
      </p>
      <p className="prose">{c.verdict_reason}</p>
      <div className="stack gap-12">
        <p className="eyebrow">Against what this work requires</p>
        {c.coverage.map((x) => (
          <div key={x.capability_id} className="stack gap-8">
            <p className="map-line">
              <span className="num">{num(x.capability_id)}</span>&nbsp;&nbsp;
              <span className={x.evidence === "not_shown" ? "muted-strong" : "strong-text"}>{EVIDENCE[x.evidence]}</span> {x.note}
            </p>
            {x.quote && <p className="quote">“{x.quote}”</p>}
          </div>
        ))}
      </div>
      {c.ramp.length > 0 && (
        <div className="stack gap-12">
          <p className="eyebrow">To close the gaps</p>
          {c.ramp.map((r, i) => (
            <p key={i} className="map-line">
              <span className="num">{num(r.capability_id)}</span>&nbsp;&nbsp;
              <span className="strong-text">{r.what}</span> {r.how} <span className="muted-strong">Rough estimate: {r.estimate}.</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
