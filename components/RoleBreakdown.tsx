import CopyButton from "./CopyButton";
import type { Role } from "@/lib/store";

const FIT: Record<string, string> = { strong: "Strong fit", partial: "Partial fit", weak: "Weak fit" };
const pad = (n: number) => String(n).padStart(2, "0");

// The employer-facing breakdown of one role. Used on the operator page and the employer's private link.
export default function RoleBreakdown({ role }: { role: Role }) {
  const num = (id: string) => pad(role.capabilities.findIndex((c) => c.id === id) + 1);
  const adText = `${role.ad.headline}\n\n${role.ad.body}`;
  return (
    <>
      <section className="stack gap-32">
        <header className="stack gap-10">
          <h2 className="h2">What this work requires</h2>
          <p className="sub">Written as activities, not requirements. This is what to look for, whatever field someone comes from.</p>
        </header>
        <ol className="caps">
          {role.capabilities.map((c, i) => (
            <li className="cap" key={c.id}>
              <span className="num">{pad(i + 1)}</span>
              <div className="stack gap-8">
                <p className="cap-activity">{c.activity}</p>
                {c.detail && <p className="cap-detail">{c.detail}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="stack gap-32">
        <header className="stack gap-10">
          <h2 className="h2">Where these people already work</h2>
          <p className="sub">Fields outside {role.industry.toLowerCase() || "your industry"} where people do this every day.</p>
        </header>
        {role.sources.map((s) => (
          <article className="field" key={s.field}>
            <div className="row">
              <h3 className="h3">{s.field}</h3>
              <span className={`strength ${s.strength === "weak" ? "weak" : ""}`}>{FIT[s.strength] || s.strength}</span>
            </div>
            <p className="prose">{s.activity}</p>
            {s.strength === "weak" && s.why_weak && (
              <div className="stack gap-8">
                <p className="eyebrow weak">Why this is a weak fit</p>
                <p className="prose">{s.why_weak}</p>
              </div>
            )}
          </article>
        ))}
      </section>

      <section className="stack gap-24">
        <header className="row">
          <h2 className="h2">Your job ad, rewritten</h2>
          <CopyButton text={adText} label="Copy the ad" />
        </header>
        <div className="field">
          <p className="h3">{role.ad.headline}</p>
          <p className="prose" style={{ whiteSpace: "pre-wrap" }}>
            {role.ad.body}
          </p>
          <p className="small-label">Fill in the parts in [brackets] before posting.</p>
        </div>
      </section>

      <section className="stack gap-24">
        <h2 className="h2">Ask in the interview</h2>
        <ol className="caps">
          {role.questions.map((q, i) => (
            <li className="cap" key={i}>
              <span className="num">{num(q.capability_id)}</span>
              <div className="stack gap-8">
                <p className="cap-activity">{q.question}</p>
                <p className="cap-detail">Listen for: {q.listen_for}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
