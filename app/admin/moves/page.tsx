import AdminNav from "@/components/admin/AdminNav";
import { requireAdmin } from "@/lib/auth";
import { provenMoves } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function Moves() {
  await requireAdmin();
  const moves = await provenMoves();
  return (
    <>
      <AdminNav current="moves" />
      <main className="page" id="main">
        <div className="column">
          <section className="stack gap-12">
            <p className="eyebrow">Proven moves</p>
            <h1 className="h2">Which pivots actually worked</h1>
            <p className="sub">
              Built only from hires you recorded. These numbers are shown to people on the tool when one of their suggested
              fields matches, and fed to the model so it prefers moves that have worked. This is the part nobody else has.
            </p>
          </section>
          {moves.length === 0 && (
            <div className="notice">
              <p>No hires recorded yet. When you move someone to “Hired” on a role, the move shows up here.</p>
            </div>
          )}
          <ul className="admin-list">
            {moves.map((m) => (
              <li key={m.key} className="admin-row">
                <span className="stack gap-8">
                  <span className="cap-activity">
                    {m.from} → {m.to}
                  </span>
                  <span className="small-label">
                    {m.hired} hired · {m.retained} still there after 90 days · {m.left} left within 90 days
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
