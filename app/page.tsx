import Link from "next/link";
import HeroStart from "@/components/landing/HeroStart";
import { EmployerForm, NewsletterForm } from "@/components/landing/LeadForms";
import SiteHeader from "@/components/SiteHeader";

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

const PROMISES = [
  "NO JOB TITLES",
  "WEAK FITS LABELLED WEAK",
  "CV LINES IN THE NEW FIELD’S LANGUAGE",
  "JOB TITLES TO SEARCH FOR",
  "NOTHING SAVED",
  "A PERSON ALWAYS DECIDES",
];

export default function Landing() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        {/* ---------- Hero: the tool starts here ---------- */}
        <section className="wrap">
          <div className="index-bar">
            <span>INDEX 001 — WHAT YOU ALREADY DO</span>
            <span>CAREER PIVOTS · OUTSIDE YOUR INDUSTRY</span>
            <span>AUTUMN ’26</span>
          </div>

          <div className="hero">
            <div className="hero-copy">
              <h1>
                What you do all day is worth more than your <span className="hand">title</span>.
              </h1>
              <p className="lede">
                Describe a normal day at work. We read the activities in it, <span className="wavy">not the job title</span>,
                and show you three fields outside your industry that need them, with what you’d still have to learn.
              </p>
              <HeroStart />
            </div>

            <figure className="specimen">
              <span aria-hidden="true" className="specimen-note">
                read as activities ✶
              </span>
              <div className="paper">
                <p className="eyebrow">What they wrote</p>
                <blockquote>
                  “I run the floor at a busy restaurant on weekends. I seat walk-ins when we’re full, calm down angry tables,
                  and decide which orders the kitchen does first when we fall behind.”
                </blockquote>
                <div className="hr" />
                <p className="eyebrow">What that shows they can do</p>
                <ol className="cap-list">
                  <li>
                    <span className="n">01</span>Deciding which order goes first when the kitchen is behind and every table is
                    waiting.
                  </li>
                  <li>
                    <span className="n">02</span>Calming an angry customer face to face, in front of a full room.
                  </li>
                  <li>
                    <span className="n">03</span>Fitting walk-ins into a room that’s already full, without breaking the
                    bookings.
                  </li>
                </ol>
              </div>
              <figcaption>Fig. 001 — a weekend shift, example reading</figcaption>
            </figure>
          </div>

          <div className="facts">
            <div className="fact">
              <b>4–6</b>
              <span>ACTIVITIES FOUND IN YOUR WORK</span>
            </div>
            <div className="fact">
              <b>3</b>
              <span>FIELDS OUTSIDE YOUR INDUSTRY</span>
            </div>
            <div className="fact">
              <b>0</b>
              <span>JOB TITLES USED TO JUDGE YOU</span>
            </div>
          </div>
        </section>

        <div className="strip" aria-label="What we promise">
          <div className="strip-track">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1 ? true : undefined} style={{ display: "flex", gap: 28 }}>
                {PROMISES.map((p) => (
                  <span key={p} style={{ display: "flex", gap: 28, whiteSpace: "nowrap" }}>
                    <span>✶ {p}</span>
                    <span className="sep">|</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ---------- How it works ---------- */}
        <section className="wrap section" id="how">
          <div className="section-head">
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: "10px 28px" }}>
              <span className="kicker">INDEX — HOW IT WORKS</span>
              <span className="hand" style={{ color: "var(--sage)" }}>
                in four steps
              </span>
            </div>
            <Link href="/try" className="underlink">
              Try it now →
            </Link>
          </div>
          <ol className="steps-list">
            <li>
              <span className="n">01</span>
              <span aria-hidden="true" className="swatch" style={{ background: "var(--ochre)" }} />
              <span className="t">Describe a normal day, in your words</span>
              <span className="m">NOT YOUR TITLE</span>
            </li>
            <li>
              <span className="n">02</span>
              <span aria-hidden="true" className="swatch" style={{ background: "var(--sage)" }} />
              <span className="t">See what you can already do</span>
              <span className="m">WRITTEN AS ACTIVITIES</span>
            </li>
            <li>
              <span className="n">03</span>
              <span aria-hidden="true" className="swatch" style={{ background: "var(--slate)" }} />
              <span className="t">Find three fields that need it</span>
              <span className="m">OUTSIDE YOUR INDUSTRY</span>
            </li>
            <li>
              <span className="n">04</span>
              <span aria-hidden="true" className="swatch" style={{ background: "var(--cocoa)" }} />
              <span className="t">Say it in their language</span>
              <span className="m">CV LINES + TITLES TO SEARCH</span>
            </li>
          </ol>
        </section>

        {/* ---------- Example reading ---------- */}
        <section className="wrap section">
          <div className="section-head">
            <div className="titled">
              <h2>The reading</h2>
              <span className="hand">one weekend shift, three ways out ✶</span>
            </div>
            <span className="kicker">EXAMPLE · RESTAURANT FLOOR MANAGER</span>
          </div>
          <div className="cards">
            <article className="card">
              <div className="paper">
                <div className="stack gap-12">
                  <span className="tag solid">STRONG FIT</span>
                  <p>
                    Deciding which order goes first when the kitchen falls behind becomes deciding which delivery goes first
                    when riders are short.
                  </p>
                </div>
                <p className="caption">Search for · Operations coordinator · Dispatcher</p>
              </div>
              <div className="card-foot">
                <div className="stack gap-8">
                  <span className="caption">01 — Logistics</span>
                  <h3>Delivery fleet operations</h3>
                </div>
                <Link href="/try" className="underlink" style={{ color: "var(--accent)" }}>
                  Read yours +
                </Link>
              </div>
            </article>
            <article className="card">
              <div className="paper">
                <div className="stack gap-12">
                  <span className="tag">PARTIAL FIT</span>
                  <p>
                    Calming an angry table becomes calming an angry caller, without seeing their face. The software is new.
                  </p>
                </div>
                <p className="caption">Search for · Customer service supervisor</p>
              </div>
              <div className="card-foot">
                <div className="stack gap-8">
                  <span className="caption">02 — Customer support</span>
                  <h3>Support team lead</h3>
                </div>
                <Link href="/try" className="underlink" style={{ color: "var(--accent)" }}>
                  Read yours +
                </Link>
              </div>
            </article>
            <article className="card">
              <div className="paper">
                <div className="stack gap-12">
                  <span className="tag weak">WEAK FIT · SAID SO</span>
                  <p>The juggling travels. The medical vocabulary doesn’t, and most posts ask for a health qualification.</p>
                </div>
                <p className="caption">Search for · Patient flow coordinator</p>
              </div>
              <div className="card-foot">
                <div className="stack gap-8">
                  <span className="caption">03 — Healthcare</span>
                  <h3>Hospital patient flow</h3>
                </div>
                <Link href="/try" className="underlink" style={{ color: "var(--accent)" }}>
                  Read yours +
                </Link>
              </div>
            </article>
          </div>
        </section>

        {/* ---------- How we judge a fit ---------- */}
        <section className="dark" id="fit">
          <div className="wrap dark-inner">
            <div className="stack gap-32" style={{ flex: "1 1 520px", minWidth: 0 }}>
              <span className="kicker">HOW WE JUDGE A FIT</span>
              <h2>Every job trains something real.</h2>
              <p>
                There’s no such thing as a low-skilled day. A weekend floor manager triages, de-escalates and reschedules
                under pressure. We name those activities precisely, tell you honestly where they travel, and say so when a
                move is a long shot.
              </p>
              <Link href="/try" className="underlink" style={{ alignSelf: "flex-start", borderColor: "var(--peach)" }}>
                Read my day →
              </Link>
            </div>
            <div className="fit-scale">
              <div className="fit-row">
                <span className="label">STRONG</span>
                <p>Uses at least one of your central activities fully, in conditions close to yours, and the way in is open.</p>
              </div>
              <div className="fit-row">
                <span className="label">PARTIAL</span>
                <p>Real overlap on some activities, with clear gaps or a real barrier to entry. We name both.</p>
              </div>
              <div className="fit-row weak">
                <span className="label">WEAK</span>
                <p>The activity travels, but the stakes, conditions or entry requirements differ a lot. We tell you why.</p>
              </div>
              <div className="fit-row">
                <span className="label">NEVER</span>
                <p>A field inside your own industry, a dream job that needs a new degree passed off as easy, or a promise of a job.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Starting points ---------- */}
        <section className="wrap section">
          <div className="section-head">
            <div className="titled">
              <span className="kicker">STARTING POINTS</span>
              <h2>Where people start from</h2>
            </div>
            <Link href="/try" className="underlink">
              Start from yours →
            </Link>
          </div>
          <ul className="people">
            <li>
              <span aria-hidden="true" className="initial" style={{ background: "var(--cocoa)" }}>
                H
              </span>
              <div className="who">
                <b>Floor manager</b>
                <span>HOSPITALITY</span>
              </div>
              <span className="what">Triage under pressure, de-escalation in public, live rescheduling.</span>
            </li>
            <li>
              <span aria-hidden="true" className="initial" style={{ background: "#8e3e3e" }}>
                C
              </span>
              <div className="who">
                <b>Care assistant</b>
                <span>SOCIAL CARE</span>
              </div>
              <span className="what">Reading people who can’t say what’s wrong, keeping routines on a tight clock.</span>
            </li>
            <li>
              <span aria-hidden="true" className="initial" style={{ background: "var(--sage)" }}>
                R
              </span>
              <div className="who">
                <b>Retail shift lead</b>
                <span>RETAIL</span>
              </div>
              <span className="what">Covering gaps when staff don’t show, stock counts against the clock, the till at closing.</span>
            </li>
          </ul>
        </section>

        {/* ---------- Employers ---------- */}
        <section className="wrap section" id="employers">
          <div className="section-head">
            <div className="titled">
              <span className="kicker">FOR EMPLOYERS</span>
              <h2>Roles nobody applies to?</h2>
            </div>
            <span className="hand">we read the work, not the CV ✶</span>
          </div>
          <div className="split">
            <div>
              <ol className="employer-points">
                <li>
                  <span className="n">01</span>We describe what the role really involves, as activities, not a list of
                  requirements.
                </li>
                <li>
                  <span className="n">02</span>We name the fields outside your industry where people already do that work every
                  day, and how far each one is from yours.
                </li>
                <li>
                  <span className="n">03</span>We rewrite your job ad so those people recognise themselves in it, and give you
                  interview questions that test the work, not the title.
                </li>
              </ol>
              <div className="trust">
                <p>✶ A person always decides. We never rank, score or reject candidates.</p>
                <p>✶ What you tell us about a role isn’t shared with anyone.</p>
                <p>✶ We’re running a small number of pilots this autumn.</p>
              </div>
            </div>
            <EmployerForm />
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className="wrap section" id="faq">
          <div className="section-head">
            <div className="titled">
              <span className="kicker">QUESTIONS</span>
              <h2>Before you start</h2>
            </div>
          </div>
          <div className="faq">
            <details>
              <summary>Is it free?</summary>
              <p>Yes. Describing your day and getting your three fields costs nothing and needs no account.</p>
            </details>
            <details>
              <summary>Do you keep what I write?</summary>
              <p>
                No. What you type is sent to our AI provider to produce your reading, and adjacent doesn’t save it. Close the
                tab and it’s gone. The <Link href="/privacy">privacy note</Link> has the details.
              </p>
            </details>
            <details>
              <summary>Will this get me a job?</summary>
              <p>
                No tool can promise that. It shows you where your work is needed, what you’d still have to learn, which titles
                to search for and how to describe yourself. The rest is applications and conversations.
              </p>
            </details>
            <details>
              <summary>What if a suggestion is wrong for me?</summary>
              <p>
                Say no to it and tell us why, for example “I can’t take a pay cut”. You get another one, shaped by your reason.
                You can also correct the activities we found and look again.
              </p>
            </details>
            <details>
              <summary>Does it work in Spanish?</summary>
              <p>Yes. Write in Spanish and the whole reading comes back in Spanish, including the job titles to search for.</p>
            </details>
          </div>
        </section>

        {/* ---------- Newsletter ---------- */}
        <section className="wrap signup">
          <div className="stack gap-24">
            <h2>Get the next field notes.</h2>
            <p className="lede">
              One letter a month: pivots we’ve read, the fields hiring people like you, and how to write about your own work.
            </p>
          </div>
          <NewsletterForm />
        </section>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-inner">
          <div className="footer-brand">
            <span className="logo-word">adjacent</span>
            <p>Your work, read as what it is. Made in Barcelona.</p>
          </div>
          <nav aria-label="The tool" className="footer-col">
            <span className="kicker">THE TOOL</span>
            <Link href="/try">Read my day</Link>
            <Link href="/#fit">How we judge a fit</Link>
            <Link href="/#faq">Questions</Link>
          </nav>
          <nav aria-label="Employers" className="footer-col">
            <span className="kicker">EMPLOYERS</span>
            <Link href="/#employers">Request a pilot</Link>
            {CONTACT && <a href={`mailto:${CONTACT}`}>{CONTACT}</a>}
          </nav>
          <nav aria-label="Legal" className="footer-col">
            <span className="kicker">LEGAL</span>
            <Link href="/privacy">Privacy note</Link>
          </nav>
        </div>
      </footer>

      <div className="bar">
        <div className="wrap bar-inner">
          <div className="bar-left">
            <span className="hand">your move.</span>
            <span className="mono">ONE DESCRIPTION · THREE FIELDS · FREE</span>
          </div>
          <Link href="/try" className="btn peach">
            Read my day →
          </Link>
        </div>
      </div>
    </>
  );
}
