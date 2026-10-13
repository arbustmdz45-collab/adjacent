import Link from "next/link";
import { notFound } from "next/navigation";
import AdminNav from "@/components/admin/AdminNav";
import FindMatches from "@/components/admin/FindMatches";
import CopyButton from "@/components/CopyButton";
import Evidence from "@/components/Evidence";
import RoleBreakdown from "@/components/RoleBreakdown";
import { moveStage, newEmployerLink, updateRole } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth";
import { STAGES, getRole, listCandidates, listMatches, stageLabel, type Match, type Role } from "@/lib/store";

export const dynamic = "force-dynamic";

function MatchCard({ match, role }: { match: Match; role: Role }) {
  return (
    <article className="field">
      <Evidence match={match} role={role} forOperator />
      <div className="operator-box">
        <p className="eyebrow">Only you see this</p>
        <p className="prose">
          {match.candidate.name} · <a href={`mailto:${match.candidate.email}`}>{match.candidate.email}</a>
          {match.employer_interest && <span className="flag"> · Employer wants to meet</span>}
        </p>
        <form action={moveStage.bind(null, role.id, match.id)} className="stage-form">
          <label className="stack gap-8">
            <span className="small-label">Stage</span>
            <select name="stage" defaultValue={match.stage} className="input">
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack gap-8" style={{ flex: "2 1 240px" }}>
            <span className="small-label">Note</span>
            <input name="note" defaultValue={match.note} className="input" placeholder="e.g. interview Tuesday 10:00" />
          </label>
          <button className="button" type="submit">
            Save
          </button>
        </form>
        {match.hired_at && <p className="small-label">Hired {new Date(match.hired_at).toLocaleDateString("en-GB")}</p>}
      </div>
    </article>
  );
}

export default async function AdminRole({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const role = await getRole(id);
  if (!role) notFound();
  const [matches, pool] = await Promise.all([listMatches(id), listCandidates(true)]);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "";
  const shareUrl = `${site}/r/${role.token}`;
  const inProgress = matches.filter((m) => m.stage !== "suggested" && m.stage !== "not_a_fit");
  const toReview = matches.filter((m) => m.stage === "suggested");
  const dropped = matches.filter((m) => m.stage === "not_a_fit");

  return (
    <>
      <AdminNav current="roles" />
      <main className="page" id="main">
        <div className="column">
          <section className="stack gap-20">
            <Link href="/admin" className="text-button" style={{ alignSelf: "flex-start" }}>
              ← All roles
            </Link>
            <p className="eyebrow">{role.company}</p>
            <h1 className="h2">{role.title}</h1>
            <p className="quiet">{role.description}</p>
            <div className="notice">
              <p>
                <strong>Employer link.</strong> Send it to {role.contact_email || "the employer"}. It shows the breakdown and
                only the people you move past “Suggested”, without names or contact details.
              </p>
              <p className="selectable" style={{ fontFamily: "var(--mono)", fontSize: 14, overflowWrap: "anywhere" }}>
                {shareUrl}
              </p>
              <div className="actions">
                <CopyButton text={shareUrl} label="Copy link" />
                <Link href={`/r/${role.token}`} className="text-button">
                  Open it
                </Link>
                <form action={newEmployerLink.bind(null, role.id)}>
                  <button type="submit" className="text-button">
                    Replace link (old one stops working)
                  </button>
                </form>
              </div>
            </div>
            <form action={updateRole.bind(null, role.id)} className="stage-form">
              <label className="stack gap-8" style={{ flex: "2 1 240px" }}>
                <span className="small-label">Kind of work (groups hires into proven moves)</span>
                <input name="field_label" defaultValue={role.field_label} className="input" />
              </label>
              <label className="stack gap-8">
                <span className="small-label">Status</span>
                <select name="status" defaultValue={role.status} className="input">
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
              <button className="button" type="submit">
                Save
              </button>
            </form>
          </section>

          <section className="stack gap-24">
            <h2 className="h2">People for this role</h2>
            <FindMatches roleId={role.id} poolSize={pool.length} />
            {inProgress.length > 0 && (
              <div className="stack gap-24">
                <p className="eyebrow">In progress · {inProgress.length}</p>
                {inProgress.map((m) => (
                  <MatchCard key={m.id} match={m} role={role} />
                ))}
              </div>
            )}
            {toReview.length > 0 && (
              <div className="stack gap-24">
                <p className="eyebrow">To review · {toReview.length}</p>
                <p className="cap-detail">
                  Move someone to “{stageLabel("shortlisted")}” to show them on the employer link. Ask them first.
                </p>
                {toReview.map((m) => (
                  <MatchCard key={m.id} match={m} role={role} />
                ))}
              </div>
            )}
            {dropped.length > 0 && (
              <details>
                <summary className="text-button">Not a fit · {dropped.length}</summary>
                <div className="stack gap-24" style={{ marginTop: 16 }}>
                  {dropped.map((m) => (
                    <MatchCard key={m.id} match={m} role={role} />
                  ))}
                </div>
              </details>
            )}
          </section>

          <details className="stack gap-24">
            <summary className="text-button">What the employer sees</summary>
            <div className="column" style={{ marginTop: 32 }}>
              <RoleBreakdown role={role} />
            </div>
          </details>
        </div>
      </main>
    </>
  );
}
