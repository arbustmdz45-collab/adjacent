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

export default async function MyProfile({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (token === "deleted") {
    return (
      <>
        <SiteHeader />
        <main className="prose-page" id="main">
          <h1>Deleted</h1>
          <p>Your profile and everything linked to it are gone from adjacent.</p>
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
        <p className="eyebrow">Your profile · private link</p>
        <h1>What adjacent keeps about you</h1>
        <p>
          {c.name} · {c.email}
          {c.city ? ` · ${c.city}` : ""}
        </p>
        <h2>What you wrote</h2>
        <p className="quiet">{c.description}</p>
        <h2>What employers see</h2>
        <p>Your background ({c.industry || "your industry"}), these activities and your own words as evidence. Never your name or contact details until you agree.</p>
        <ol className="cap-list">
          {c.capabilities.map((x, i) => (
            <li key={x.id}>
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              {x.activity}
            </li>
          ))}
        </ol>
        {c.interests.length > 0 && <p className="small-label">Interested in: {c.interests.join(" · ")}</p>}
        <form action={remove.bind(null, token)} style={{ marginTop: 24 }}>
          <button className="button" type="submit">
            Delete my profile
          </button>
        </form>
      </main>
    </>
  );
}
