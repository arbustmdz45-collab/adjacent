# adjacent

Helping skilled people move into new fields.

Describe what you actually do all day in your current job, not your title. You get back what that work shows you can do, written as activities instead of skill labels. Then you get three fields outside your industry that need those activities. For each one you see:

- which of your activities it uses, and how fully;
- what the work looks like there;
- what you'd still need to learn;
- job titles to search for;
- CV lines that describe your real experience in that field's language.

Weak fits are labelled weak, with the reason.

The result can be changed in place:

- **Edit, remove or add a capability.** Then look again: new fields are found against your version of the list.
- **Say no to a field.** Say why if you like ("I can't take a pay cut"), and only that field is replaced. Fields you said no to don't come back.
- **Change your current industry** if it was guessed wrong.

**Candidate check (built, currently hidden).** Paste a CV, or a few lines on what a person has done. You see, capability by capability, whether their background shows it, in their own words. Then you get interview questions to verify what's partial or missing, and a rough training plan to close the gaps. The verdict is one of "worth an interview", "worth a short call first" or "not enough evidence yet". It never says a person is unsuitable. Quotes are checked against the pasted text, and any that don't appear in it are dropped. Names, age and other personal details are ignored.


## The business loop

The free tool is the way in. What adjacent owns is what happens after it:

1. **Pool (opt-in).** At the end of a reading, people can choose "Let employers find me". With their consent we keep their description and activities. Each person gets a private link to see and delete everything.
2. **Employer side.** In the operator area (`/admin`) you add a hard-to-fill role. You get the activities it really requires, three source fields, a rewritten job ad and interview questions. "Find people in the pool" reads everyone against the role, capability by capability, with their own words as evidence. You shortlist people, and the employer gets a private link (`/r/…`) showing the breakdown and the shortlist, without names or contact details. They press "I'd like to meet this person", and you get notified.
3. **Outcomes.** You move each person through stages: shortlisted, introduced, interviewed, hired, still there after 90 days, or left. Hires become **proven moves** ("hospitality → logistics operations: 3 hired, 2 still there after 90 days"). Proven moves are fed back into the tool. The model prefers them when they fit, and people see the real counts on that field. No model can make those numbers up.

Nobody is rejected automatically, and a person makes every decision.

## How it's built

```
app/page.tsx              Landing page. Its hero textarea starts the tool
app/try/page.tsx          The tool: empty, thinking, result
app/privacy/page.tsx      Plain-language privacy note (have it reviewed before launch)
app/api/analyse/route.ts  The tool's API route. Steps: capabilities, fields, replace (+ hidden candidate)
app/api/subscribe/route.ts  Newsletter and employer pilot requests, forwarded to LEADS_WEBHOOK_URL
app/api/pool/route.ts     "Let employers find me": saves a profile to the pool, with consent
app/admin/                Operator area: roles, pool, proven moves (ADMIN_PASSWORD)
app/r/[token]/            Private employer link for one role
app/me/[token]/           A candidate's private page to see and delete their profile
lib/db.ts                 Postgres (DATABASE_URL), or an embedded local database for development
lib/store.ts              Candidates, roles, matches, stages, proven moves
lib/prompt.ts             Everything the model is told for the pivoting flow
lib/hiring-prompt.ts      Employer-side candidate check (hidden for now)
lib/types.ts              The shape of a capability, a field, a gap
components/Tool.tsx       The tool's screen and state
components/landing/       Hero start box and the two lead forms
app/globals.css           The whole look: tokens at the top, landing, then the tool
```

The model answers through forced tool calls, so its output always fits the schema. To change how the product thinks, edit `lib/prompt.ts`. To add something to each field card, change `lib/types.ts`, the schema in `lib/prompt.ts`, and `components/FieldCard.tsx`.

### Where leads go

There's no database. Each newsletter sign-up and pilot request is POSTed as JSON to `LEADS_WEBHOOK_URL`. The quickest setup is a Google Sheet:

1. Create a sheet, then Extensions → Apps Script.
2. Paste:
   ```js
   function doPost(e) {
     const d = JSON.parse(e.postData.contents);
     SpreadsheetApp.getActiveSheet().appendRow([d.submitted_at, d.type, d.email, d.company || "", d.role || "", d.free_email_domain || ""]);
     return ContentService.createTextOutput('{"ok":true}').setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. Deploy → New deployment → Web app, access "Anyone". Use the URL it gives you as `LEADS_WEBHOOK_URL`.

A Zapier or Make webhook, or a Formspree endpoint, works the same way. Until it's set, the forms tell people sign-ups aren't switched on yet, so nothing is silently lost.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

## Deploy

1. Import this repo at vercel.com/new.
2. Add a Postgres database: in the Vercel project, Storage → Create → Neon (free tier). It sets `DATABASE_URL` for you.
3. Add the environment variables from `.env.example`: `ANTHROPIC_API_KEY`, `ADMIN_PASSWORD`, `LEADS_WEBHOOK_URL` and `NEXT_PUBLIC_SITE_URL`.
4. Deploy. The tables are created on first use.

The rate limit is per server instance and held in memory. It stops casual abuse but won't hold up under real traffic, so move it to a shared store such as Upstash Redis before you share the link widely.
