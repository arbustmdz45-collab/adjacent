import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { listCandidates } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Pool() {
  await requireAdmin();
  const people = await listCandidates(true);
  return (
    <>
      <AdminNav current="pool" />
      <main className="page" id="main">
        <div className="column">
          <section className="stack gap-12">
            <p className="eyebrow">The pool</p>
            <h1 className="h2">
              {people.length} {people.length === 1 ? "person" : "people"} asked to be found
            </h1>
            <p className="sub">Everyone here opted in from the tool. They can delete themselves at any time from their own link.</p>
          </section>
          {people.length === 0 && (
            <div className="notice">
              <p>No one yet. People join from the end of their reading on the tool.</p>
            </div>
          )}
          <ul className="admin-list">
            {people.map((c) => (
              <li key={c.id} className="stack gap-12" style={{ padding: "24px 0", borderBottom: "1px solid var(--rule)" }}>
                <div className="row">
                  <span className="cap-activity">{c.name}</span>
                  <span className="small-label">
                    {c.industry || "Unknown industry"}
                    {c.city ? ` · ${c.city}` : ""} · joined {new Date(c.created_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
                <p className="prose">
                  <a href={`mailto:${c.email}`}>{c.email}</a>
                </p>
                <p className="quiet">{c.description}</p>
                {c.interests.length > 0 && <p className="small-label">Interested in: {c.interests.join(" · ")}</p>}
                <ol className="cap-list">
                  {c.capabilities.map((x, i) => (
                    <li key={x.id}>
                      <span className="n">{String(i + 1).padStart(2, "0")}</span>
                      {x.activity}
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
