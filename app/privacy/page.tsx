import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import { MIN_PUBLIC_HIRES, POOL_RETENTION_MONTHS, ROLE_RETENTION_MONTHS } from "@/lib/store";

export const metadata: Metadata = { title: "Privacy policy — adjacent" };

// Plain-language privacy policy written to GDPR Articles 13 and 14 and Spain's LOPDGDD.
// Fill in NEXT_PUBLIC_CONTROLLER_NAME and NEXT_PUBLIC_CONTACT_EMAIL, and have it reviewed before launch.
const CONTROLLER = process.env.NEXT_PUBLIC_CONTROLLER_NAME || "[YOUR NAME OR COMPANY, ADDRESS, TAX ID]";
const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[YOUR CONTACT EMAIL]";

export default function Privacy() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="prose-page">
        <p className="eyebrow">Privacy policy · version October 2026</p>
        <h1>What happens to what you tell us</h1>
        <p>
          Short version: the tool keeps nothing. If you choose to join the pool, we keep only what’s needed to introduce you to
          employers, for {POOL_RETENTION_MONTHS} months at most. You can see, download or delete it at any time. A person makes
          every decision, never software alone.
        </p>

        <h2>Who is responsible</h2>
        <p>
          The data controller is {CONTROLLER}. For anything about your data, write to <span className="selectable">{CONTACT}</span>.
        </p>

        <h2>What we process, why, and on what basis</h2>
        <ul>
          <li>
            <strong>Describing your day in the tool.</strong> Your text is sent to our AI provider to produce your reading,
            because you asked for it (GDPR Art. 6(1)(b)). Before it leaves, emails, phone numbers, links and ID numbers are
            removed automatically. adjacent doesn’t store it. To hand your text from the home page to the tool, it sits for a
            moment in your own browser tab, then is cleared.
          </li>
          <li>
            <strong>Joining the pool (“Let employers find me”).</strong> With your consent (Art. 6(1)(a)) we keep your first
            name, email, area, your description, the activities from your reading and the fields you’re interested in. AI
            compares this with employers’ roles; we review every match before an employer sees it. Employers see your
            background, activities and quotes from your own words, never your name, email or area, until you agree to meet. You
            can withdraw consent at any time by deleting your profile.
          </li>
          <li>
            <strong>Newsletter and pilot requests.</strong> Your email, and for pilots your company and what you tell us about
            the role, to reply and to send the letter you asked for (Art. 6(1)(a) for the newsletter, 6(1)(b) for pilots).
          </li>
          <li>
            <strong>Employers’ roles.</strong> The company, a contact email and the role description, to prepare the role and
            introduce people (Art. 6(1)(b)).
          </li>
          <li>
            <strong>Anonymous outcome counts.</strong> When someone is hired, we record only the starting industry, the kind of
            work, the result and the month, like “one hire from hospitality into logistics, October 2026”, with no link to the
            person. This is anonymous data. It stays after a profile is deleted, and we show it publicly only once a move has
            at least {MIN_PUBLIC_HIRES} hires, so no one can be singled out.
          </li>
        </ul>

        <h2>Who else handles it</h2>
        <p>
          Only providers that process data on our behalf, under data processing agreements: our AI provider (Anthropic), our
          hosting provider (Vercel), our database provider, and, for newsletter and pilot sign-ups, the spreadsheet or form
          service we use. Under its commercial terms, Anthropic doesn’t use this data to train its models. Some of these
          providers are based in the United States; transfers rely on the safeguards the GDPR requires, such as the EU–US Data
          Privacy Framework or Standard Contractual Clauses. We never sell your data or share it for advertising.
        </p>

        <h2>How long we keep it</h2>
        <ul>
          <li>Tool readings: not kept.</li>
          <li>Pool profiles: deleted automatically {POOL_RETENTION_MONTHS} months after you join, or straight away when you delete them.</li>
          <li>Employers’ roles: deleted {ROLE_RETENTION_MONTHS} months after the role is closed.</li>
          <li>Newsletter: until you unsubscribe. Pilot requests: up to 12 months if no pilot starts.</li>
          <li>Anonymous outcome counts: kept, since they can’t identify anyone.</li>
        </ul>

        <h2>Your rights</h2>
        <p>
          You can access, correct, delete, restrict or object to the processing of your data, take it with you
          (portability), and withdraw consent at any time. If you joined the pool, your private link lets you see, download and
          delete everything yourself. For anything else, write to {CONTACT}. If you think we’ve handled your data badly, you
          can complain to the Spanish Data Protection Agency (AEPD, aepd.es).
        </p>

        <h2>Decisions about people</h2>
        <p>
          adjacent uses AI to describe work and suggest where it transfers. It never makes decisions about anyone on its own:
          no one is rejected automatically, every match shows its reasons, and an employer and a person decide together whether
          to meet. AI readings can be wrong, so we label them and ask everyone to check them.
        </p>

        <h2>Security</h2>
        <p>
          Connections are encrypted, private links are long random codes that we store only in scrambled (hashed) form, the
          operator area is password-protected with sessions that expire, and we keep the least data that does the job.
        </p>

        <h2>Cookies</h2>
        <p>
          The public site sets no cookies and uses no analytics or tracking. Fonts are served from our own site. The only
          cookie is a strictly necessary sign-in cookie for the operator area.
        </p>

        <h2>Age</h2>
        <p>adjacent is for adults. If you’re under 18, please don’t join the pool.</p>

        <p>
          <Link href="/">Back to adjacent</Link>
        </p>
      </main>
    </>
  );
}
