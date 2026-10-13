import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Privacy note — adjacent" };

// Plain-language note. Have it reviewed before launch; it is not legal advice.
export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="prose-page">
        <p className="eyebrow">Privacy note · last updated October 2026</p>
        <h1>What happens to what you tell us</h1>

        <h2>When you describe your day</h2>
        <p>
          The text you type is sent to our AI provider (Anthropic) so it can produce your reading. adjacent doesn’t save it
          unless you choose “Let employers find me”: there are no accounts and no history, and closing the tab clears it. Don’t include names, health details or anything
          you wouldn’t want processed. The tool doesn’t need them.
        </p>

        <h2>When you subscribe or request a pilot</h2>
        <p>
          We keep your email address, and for pilots your company name and what you wrote about the role, so we can reply. We
          use them only for that and for the monthly letter you asked for. We don’t sell or share them. Ask us to delete them
          at any time and we will.
        </p>

        <h2>When you join the pool</h2>
        <p>
          If you choose “Let employers find me”, we keep your first name, email, area, your description and the activities
          from your reading. Employers see your background, activities and your own words, never your name or contact details,
          until you agree to meet. You get a private link to see everything we keep and delete it at any time.
        </p>

        <h2>Hiring decisions</h2>
        <p>
          adjacent describes work and shows the evidence for each match. It never rejects anyone automatically. Every hiring
          decision is made by a person.
        </p>

        <p>
          <Link href="/">Back to adjacent</Link>
        </p>
      </main>
    </>
  );
}
