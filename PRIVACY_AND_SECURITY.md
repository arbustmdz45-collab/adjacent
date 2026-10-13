# Privacy and security

What adjacent does in code to protect people's data, and what you still have to do yourself. Nothing here is legal advice; have a data protection professional review it before launch (ESADE's law clinic is a good start).

Frameworks it's built against: the GDPR, Spain's LOPDGDD, the EU AI Act's rules for AI used in recruitment (a high-risk category), and the OWASP basics for web apps.

## Built in

**Data protection by design (GDPR Art. 25)**
- The tool stores nothing. Readings are produced and shown, then gone.
- Contact details typed into free text (emails, phones, links, handles, IBANs, Spanish DNI/NIE) are removed before text goes to the AI and before anything is stored (`lib/redact.ts`).
- Employers see a person's background, activities and own words, never their name, email or area, until both sides agree to meet.
- Operator notifications carry no names or emails.
- No analytics, no tracking, no third-party requests on page load; fonts are self-hosted.

**Consent and transparency (Arts. 6, 7, 13)**
- Joining the pool needs an explicit, unticked consent box that says what is kept, for how long, that AI compares it with roles, what employers see, and that anonymous hire counts may remain. The consent version and time are stored with each profile (`CONSENT_VERSION` in `lib/store.ts`; bump it whenever the wording changes).
- A full privacy policy at `/privacy`: controller, purposes, legal bases, processors, transfers, retention, rights, the AEPD, automated decisions, cookies.
- AI-generated readings are labelled as such, for people and for employers.

**Rights (Arts. 15–21)**
- Every person in the pool gets a private link (`/me/…`) to see everything kept, download it as JSON (access and portability), and delete it on the spot (erasure, which also withdraws consent).
- Deletion removes the profile and every match that names the person. Outcome counts live in a separate, anonymous table with no link back, so they survive without keeping personal data.

**Retention (Art. 5(1)(e))**
- Pool profiles: 12 months, then deleted automatically. Closed roles: deleted 12 months after closing.
- A daily job (`/api/cron/purge`, scheduled in `vercel.json`) does the deleting; the operator dashboard runs it too.

**No solely automated decisions (Art. 22, AI Act human oversight)**
- AI suggests and explains; you review every match before an employer sees it; nobody is rejected automatically; employers are told readings can be wrong and must not be the only reason to turn someone down.
- Anonymous counts are shown publicly only from 3 hires per move (`MIN_PUBLIC_HIRES`), so no individual can be picked out.

**Security (Art. 32)**
- HTTPS enforced (HSTS), strict Content-Security-Policy, no framing, `no-referrer` so private links never leak to other sites, no caching or indexing of private pages.
- Private links are 192-bit random codes; candidate links are stored only as SHA-256 hashes. Employer links can be replaced from the operator page if one leaks.
- Operator area: password of at least 12 characters, login attempts limited, signed sessions that expire after 12 hours, `httpOnly` + `SameSite=Strict` cookie.
- Cross-site requests to the APIs are refused; server actions are protected by Next.js's own origin check. Inputs are length-limited and validated; a hidden field stops basic form bots.
- Database connections use TLS. Secrets live only in environment variables.

## What you need to do

1. **Fill in who you are.** Set `NEXT_PUBLIC_CONTROLLER_NAME` (name or company, address, tax ID) and `NEXT_PUBLIC_CONTACT_EMAIL`. The privacy policy shows placeholders until you do.
2. **Sign the processor agreements (DPAs)** with Anthropic, Vercel, your database provider and Google (if leads go to a Sheet). Most are click-through in each account's settings. Check where each stores data and pick EU regions where offered (Neon and Vercel both offer them).
3. **Keep a record of processing activities (Art. 30).** A one-page document listing what's in "What we process" in the privacy policy is enough at this size.
4. **Do a DPIA before matching real people at scale (Art. 35).** Using AI to evaluate candidates is the kind of processing that usually requires one. The AEPD publishes a free tool (Gestiona EIPD).
5. **Get consent to share contact details by email**, each time, before introducing someone to an employer. The product promises this; it's a manual step for now.
6. **Set the secrets:** a long `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` and `CRON_SECRET` (random strings), and turn on two-factor sign-in on GitHub, Vercel, Anthropic and your database account.
7. **Plan for breaches (Arts. 33–34):** if personal data leaks, you have 72 hours to notify the AEPD. Write down who you'd call and how you'd replace the leaked links.
8. **Before scaling:** move rate limiting to a shared store (Upstash), and add an audit log of who changed what in the operator area.

## Known limits

- Redaction catches contact details and IDs, not names or employers written in the text. The forms ask people not to include them.
- The rate limiter is per server instance (best effort).
- The live demo page inside Claude is separate from this app; it stores nothing but loads fonts from Google.
