import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import NewRoleForm from "@/components/admin/NewRoleForm";
import { requireAdmin } from "@/lib/auth";
import { listCandidates, listRoles } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const [roles, pool] = await Promise.all([listRoles(), listCandidates(true)]);
  return (
    <>
      <AdminNav current="roles" />
      <main className="page" id="main">
        <div className="column">
          <section className="stack gap-12">
            <p className="eyebrow">Today</p>
            <h1 className="h2">
              {roles.filter((r) => r.status === "open").length} open {roles.filter((r) => r.status === "open").length === 1 ? "role" : "roles"} · {pool.length} {pool.length === 1 ? "person" : "people"} in the pool
            </h1>
          </section>

          <NewRoleForm />

          <section className="stack gap-24">
            <h2 className="h3">Roles</h2>
            {roles.length === 0 && <p className="sub">No roles yet. Add the first one above.</p>}
            <ul className="admin-list">
              {roles.map((r) => (
                <li key={r.id}>
                  <Link href={`/admin/roles/${r.id}`} className="admin-row">
                    <span className="stack gap-8">
                      <span className="cap-activity">{r.title}</span>
                      <span className="small-label">
                        {r.company} · {r.field_label || "no field"} · {r.status}
                      </span>
                    </span>
                    <span className="small-label">
                      {r.active_count} in progress · {r.hired_count} hired
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
