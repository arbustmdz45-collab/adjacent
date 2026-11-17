import Link from "next/link";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "@/components/workspace/workspace.css";

const STEPS = [
  ["Paste the opening", "The ad as you posted it, with pay, hours and location. adjacent takes it apart into what the person does every day and shows which of your requirements shut out people who can do the work."],
  ["See where to look", "Three fields outside your industry where people already do those activities, with what you would have to teach them and where to find them."],
  ["Replace the CV", "Your ad sends people to a candidate page. They describe a job in their own words and adjacent lines it up with each activity. Only their literal words count as evidence."],
  ["Check, hire, record", "A 20-minute practical test and an interview guide come with every opening. Each test, hire and 90-day result is recorded against the field the person came from."],
];

// The public home page: for employers. The earlier job-seeker page now lives at /seekers.
export default function Home() {
  return (
    <div className="adjw">
      <div className="solo" style={{ maxWidth: 1040 }}>
        <div className="wbar">
          <div className="brand" style={{ padding: 0 }}>adjacent</div>
          <span className="wrow">
            <Link className="note" href="/seekers">For job seekers</Link>
            <Link className="wbtn sm" href="/workspace">Sign in</Link>
          </span>
        </div>

        <section className="whero" style={{ paddingTop: 36 }}>
          <div className="lab">For employers with office openings that stay open</div>
          <h1 style={{ marginTop: 12 }}>
            The person you need already does this job. <mark>In another field.</mark>
          </h1>
          <p>
            Paste an opening that is not getting filled. adjacent takes it apart into what the person does every day, shows
            which other fields already have people doing it, and gives you a way to check before you hire.
          </p>
          <div className="wrow" style={{ marginTop: 26 }}>
            <Link className="wbtn" href="/workspace">Open the workspace</Link>
            <Link className="wbtn ghost" href="/apply/e2">See what a candidate sees</Link>
          </div>
        </section>

        <section className="sheet strongb">
          <div className="lab" style={{ marginBottom: 6 }}>How it works</div>
          <div className="acts">
            {STEPS.map(([name, detail], i) => (
              <div className="act" key={name}>
                <div className="k">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <h3>{name}</h3>
                  <p>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid2">
          <article className="cand">
            <div className="ch">
              <div>
                <strong>A-014</strong> <span className="note">comes from emergency dispatch, 4 years</span>
              </div>
              <span className="wtag">example, fictional</span>
            </div>
            <div className="ev">
              <div><span className="pill s2">strong</span></div>
              <div>
                <div className="an">Take a crash report by phone</div>
                <blockquote><mark>I had to get the exact location and whether anyone was hurt before anything else, and type it in while they talked</mark></blockquote>
                <div className="nt">The same fact-taking, under more pressure.</div>
              </div>
            </div>
            <div className="ev">
              <div><span className="pill s0">no evidence</span></div>
              <div>
                <div className="an">Follow several open files until payment</div>
                <div className="nt">Wrote nothing about carrying open cases for days or weeks.</div>
              </div>
            </div>
            <div className="cf">What the employer of an auto claims opening sees for one answer. No name, photo, age or school.</div>
          </article>
          <div className="col" style={{ justifyContent: "center" }}>
            <div className="lab">What a chatbot can’t give you</div>
            <p>
              Anyone can paste an ad into a chatbot and get a list of ideas. adjacent keeps what happens next: who answered,
              what they wrote, who passed the test, who was hired and who was still there at 90 days.
            </p>
            <p className="note">
              It does not post your opening, hold a CV database, interview for you or decide who you hire.
            </p>
          </div>
        </section>

        <p className="note">
          <Link href="/privacy">Privacy</Link>
        </p>
      </div>
    </div>
  );
}
