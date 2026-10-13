import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Evidence from "@/components/Evidence";
import RoleBreakdown from "@/components/RoleBreakdown";
import { getRoleByToken, listMatches } from "@/lib/store";
import { wantToMeet } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your role — adjacent", robots: { index: false, follow: false } };

export default async function EmployerRole({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const role = await getRoleByToken(token);
  if (!role) notFound();
  const people = await listMatches(role.id, true);

  return (
    <>
      <header className="site-header">
        <div className="site-nav wrap">
          <Link href="/" className="logo">
            <span className="logo-word">adjacent</span>
            <span className="logo-tag">FOR {role.company.toUpperCase()}</span>
          </Link>
          <span className="small-label">Private link · please don’t share outside your team</span>
        </div>
      </header>
      <main className="page" id="main">
        <div className="column">
          <section className="stack gap-20">
            <p className="eyebrow">Prepared for {role.company}</p>
            <h1 className="h2">{role.title}</h1>
            <p className="sub">
              What this role really involves, where people already do that work, an ad they’ll recognise themselves in, and the
              people we’ve found so far.
            </p>
          </section>

          <div className="notice">
            <p>
              <strong>About these readings.</strong> They are written by AI from what each person and you described, and
              checked by us before you see them. Quotes are the person’s own words. Use them to decide who to talk to, never
              as the only reason to turn someone down.
            </p>
          </div>

          <section className="stack gap-24">
            <header className="stack gap-10">
              <h2 className="h2">People we’ve found</h2>
              <p className="sub">
                Each one is shown against what this work requires, in their own words. Names and contact details stay with us
                until you both agree to meet. You decide; nobody is rejected automatically.
              </p>
            </header>
            {people.length === 0 && (
              <div className="notice">
                <p>No one shortlisted yet. We’ll add people here as we find them, and let you know.</p>
              </div>
            )}
            {people.map((m) => (
              <article className="field" key={m.id}>
                <Evidence match={m} role={role} />
                {m.employer_interest ? (
                  <p className="form-status ok">You asked to meet this person. We’ll set it up and get back to you.</p>
                ) : (
                  <form action={wantToMeet.bind(null, token, m.id)}>
                    <button className="button" type="submit">
                      I’d like to meet this person
                    </button>
                  </form>
                )}
              </article>
            ))}
          </section>

          <RoleBreakdown role={role} />
        </div>
      </main>
    </>
  );
}
