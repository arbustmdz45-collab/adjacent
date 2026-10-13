# adjacent — Architecture

Last updated: 13 October 2026 (Session 6, hackathon).
Repository: github.com/arbustmdz45-collab/adjacent

## What the system does

adjacent reads what someone actually does at work, writes it as activities instead of job titles, and shows three fields outside their industry that need those activities. On top of that free reading sits the business loop:

1. People opt in to be found by employers.
2. Employers bring roles that are hard to fill.
3. I match the two with evidence.
4. Hires become anonymous "proven moves" that feed back into the reading.

## Stack

- **App:** Next.js 15 (App Router) with React 19 and TypeScript. One codebase serves the public site, the tool, the operator area, the employer links and the API.
- **AI:** Anthropic's Claude through the official SDK (`@anthropic-ai/sdk`). The model is set with `ANTHROPIC_MODEL` and defaults to Sonnet.
- **Database:** Postgres through `DATABASE_URL` (Neon, Supabase or Vercel Postgres). Local development falls back to an embedded Postgres (PGlite) in `.data/`.
- **Hosting:** Vercel, with a daily cron job for data retention (`vercel.json`).
- **Leads:** newsletter and pilot sign-ups go as JSON to `LEADS_WEBHOOK_URL` (for example a Google Sheet through Apps Script).
- **Fonts:** self-hosted through `@fontsource`, so pages make no third-party requests.

## Main parts

**Public pages**
- `app/page.tsx` is the landing page. Its hero text box starts the tool: the text is handed to `/try` through the browser tab's session storage and cleared on arrival.
- `app/try/page.tsx` with `components/Tool.tsx` is the tool. It has three states (empty, thinking, result) and in-place changes: edit, add or remove activities, say no to a field, change the industry. At the end, `components/OptIn.tsx` offers "Let employers find me".
- `app/privacy/page.tsx` is the privacy policy.

**Private pages**
- `app/admin/*` is the operator area, behind `ADMIN_PASSWORD`. It has three views:
  - **Roles:** add a role and get its breakdown, check the pool against it, move people through stages, and copy or replace the employer link.
  - **Pool:** everyone who opted in.
  - **Proven moves:** the anonymous hire counts.
- `app/r/[token]` is the employer's private link for one role. It shows the role breakdown and the shortlisted people, with no names, contact details or area, plus an "I'd like to meet this person" button.
- `app/me/[token]` is each person's private page to see, download and delete their data.

**API**
- `app/api/analyse` is one route with steps. `capabilities` reads the description; `fields` finds three fields; `replace` swaps one field the person said no to; `candidate` is the hidden employer-side check.
- `app/api/pool` saves an opt-in to the pool, with consent.
- `app/api/subscribe` sends newsletter and pilot requests to the webhook.
- `app/api/me/[token]` exports a person's data as JSON.
- `app/api/cron/purge` is the daily retention job, protected by `CRON_SECRET`.

**Libraries**
- `lib/prompt.ts` holds everything the model is told for the pivoting flow: the system prompt, the prompts for each step and the output schemas.
- `lib/hiring-prompt.ts` holds the employer-side prompts: the role breakdown and the candidate check.
- `lib/ai.ts` makes one structured call to Claude. The model is forced to answer through a tool schema.
- `lib/store.ts` reads and writes candidates, roles, matches, stages and anonymous outcomes, and handles proven moves, retention and export.
- `lib/db.ts` handles the database connection, the schema and private-link hashing.
- `lib/auth.ts` runs operator sessions: signed, expiring, `httpOnly`, `SameSite=Strict`.
- `lib/redact.ts` removes emails, phone numbers, links, handles, IBANs and Spanish DNI/NIE numbers from free text.
- `lib/check.ts` makes sure every quote in a candidate check really appears in the candidate's text.
- `lib/rate-limit.ts` limits requests per IP and refuses requests from other sites.
- `lib/notify.ts` sends operator notifications with no names or emails.

## Data model

- **candidates:** the people who opted in. First name, email, area, a redacted description, industry, activities and interests. Their private link is stored only as a SHA-256 hash, along with the consent version, the consent time and an expiry date 12 months out.
- **roles:** each employer's role. Company, contact email, the description, and the AI breakdown: activities, three source fields, the rewritten ad and interview questions. Also the "kind of work" label used for proven moves, the employer link token, and the status and closing date.
- **matches:** one row per person and role. It holds the AI evidence check, the stage (suggested → shortlisted → introduced → interviewed → hired → still there after 90 days / left within 90 days / not a fit), whether the employer asked to meet, a note, and a link to an outcome. It's deleted when either the person or the role is deleted.
- **outcomes:** anonymous by design. Only the starting industry, the kind of work, the result and the month, with no link back to a person or role. It survives deletions, and proven moves are counted from it.

## How a reading works

1. The browser sends the description to `/api/analyse` with step `capabilities`. The server redacts contact details and asks Claude for the industry and 4–6 activities, with a fixed schema.
2. The browser calls step `fields` with the activities, which may have been edited. The server loads proven moves, but only those with at least `MIN_PUBLIC_HIRES` hires (default 3), adds them to the prompt, and asks for three fields. Each field has its activities, the work there, what's left to learn, job titles, CV lines, and an optional `proven_move_id`. The server drops mappings to activities that no longer exist and attaches the real hire counts for any proven move.
3. "Not for me" calls step `replace` with the rejected fields and reasons, so the next suggestion avoids them.

## Key decisions and why

1. **One API route, steps instead of separate endpoints.** It keeps the surface small and easy to rate-limit.
2. **The model answers through forced tool calls.** The output always fits the screen, so there's no parsing of free text.
3. **All prompts live in one file.** Changing how the product thinks means editing one place.
4. **The tool stores nothing.** Data is kept only after explicit opt-in. This lowers privacy risk and makes the free tool safe to share.
5. **Outcomes are kept in a separate, anonymous table.** People can be fully erased while the data cycle keeps its counts. Public numbers need 3 or more hires so no one can be singled out.
6. **Proven moves are fed back into the prompt and shown as real counts.** This is the defense from Session 5: data a copycat can't produce.
7. **A person makes every decision.** AI readings are labelled as AI, matches are reviewed before an employer sees them, and nobody is rejected automatically. This follows GDPR Article 22 and the EU AI Act's rules for recruitment.
8. **Private links instead of accounts** for employers and candidates. Less friction for an MVP. Links are long random codes, candidate links are hashed, and employer links can be replaced.
9. **Postgres instead of a document store.** Stages, joins and anonymous aggregation are easy to express in SQL, and the embedded fallback makes local development need no setup.
10. **The employer-side candidate check is built but hidden.** The business focuses on the person pivoting; it can return with one flag (`SHOW_CANDIDATE_CHECK`).

## Security and privacy (summary)

- **Headers:** HTTPS enforced (HSTS), a strict Content-Security-Policy, no framing, no referrer, and no caching or indexing of private pages.
- **Operator area:** a password of at least 12 characters, a limit on login attempts, and sessions that expire after 12 hours.
- **APIs:** refuse cross-site requests, limit input lengths and use a honeypot field against bots.
- **Data:** redaction before the AI and before storage, 12-month retention with a daily purge, export and deletion for each person, and no personal data in logs or notifications.
- **Details:** see `PRIVACY_AND_SECURITY.md`.

## Environment

`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `DATABASE_URL`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CRON_SECRET`, `LEADS_WEBHOOK_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTROLLER_NAME`, `NEXT_PUBLIC_CONTACT_EMAIL`, `MIN_PUBLIC_HIRES`, `RATE_LIMIT_PER_10_MIN`. All are documented in `.env.example`.

## Live demo (separate from this app)

A single-page version of the landing page and tool runs as a Claude artifact. The reading uses the visitor's own Claude account. It stores nothing, and its forms prepare an email instead of saving anything. It exists for demos; this repository is the product.

## Known limits

- Not deployed yet: it needs the API key, Vercel and the database set up.
- In this session the AI calls were tested only with a stand-in model; real-model output still needs checking, in English and Spanish.
- The rate limit is per server instance, so it needs a shared store (Upstash) before real traffic.
- Redaction can't catch names or employers written in free text.
- Hiring stages are updated by hand in the operator area.

## Changes in Session 6

- Added the landing page, which starts the tool directly.
- Made the person pivoting the main flow, with job titles to search for and CV lines.
- Added the operator area, the employer links, the candidate pool with consent, and outcome tracking with proven moves fed back into the tool.
- Added the privacy and security work listed above.
