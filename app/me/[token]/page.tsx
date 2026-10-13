import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { deleteCandidateByToken, getCandidateByToken } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your profile — adjacent", robots: { index: false, follow: false } };

async function remove(token: string) {
  "use server";
  await deleteCandidateByToken(token);
  redirect("/me/deleted");
}

const day = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default async function MyProfile({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token === "deleted") {
    return (
      <>
        <SiteHeader />
        <main className="prose-page" id="main">
          <h1>Deleted</h1>
          <p>
            Your profile, your description and every match that named you are gone from adjacent. What stays is only an
            anonymous count, like “one hire from hospitality into logistics”, with nothing that points to you.
          </p>
        </main>
      </>
    );
  }
  const c = await getCandidateByToken(token);
  if (!c) notFound();
  return (
    <>
      <SiteHeader />
      <main className="prose-page" id="main">
        <p className="eyebrow">Your profile · private link · keep it to yourself</p>
        <h1>What adjacent keeps about you</h1>
        <p>
          {c.name} · {c.email}
          {c.city ? ` · ${c.city}` : ""}
        </p>
        <p className="small-label">
          You agreed on {day(c.consent_at)}. We delete this profile automatically on {day(c.expires_at)} unless you ask us to
          keep it.
        </p>

        <h2>What you wrote</h2>
        <p className="quiet">{c.description}</p>

        <h2>What employers can see</h2>
        <p>
          Your background ({c.industry || "your industry"}), these activities, and quotes from your own words when they’re
          evidence for a role. Never your name, email or area until you agree to meet someone.
        </p>
        <ol className="cap-list">
          {c.capabilities.map((x, i) => (
            <li key={x.id}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              {x.activity}
            </li>
          ))}
        </ol>
        {c.interests.length > 0 && <p className="small-label">Interested in: {c.interests.join(" · ")}</p>}

        <h2>Your choices</h2>
        <p>
          <a href={`/api/me/${token}`} download>
            Download everything we keep (JSON)
          </a>
        </p>
        <p>To correct something, write to us from the email above and we’ll fix it.</p>
        <details>
          <summary className="text-button">Delete my profile</summary>
          <form action={remove.bind(null, token)} className="stack gap-12" style={{ marginTop: 12 }}>
            <p>This removes your profile and every match that names you, straight away. It can’t be undone.</p>
            <div>
              <button className="button" type="submit">
                Yes, delete everything
              </button>
            </div>
          </form>
        </details>
      </main>
    </>
  );
}
