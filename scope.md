# adjacent — Scope

Last updated: 13 October 2026 (Session 6, hackathon).

## The problem

People in jobs often called "low-skilled" (hospitality, retail, care, logistics) do hard, specific work every day: triage under pressure, calming angry customers, re-planning when things go wrong. Their job titles hide it, so moving into another field looks impossible to them and to employers. Meanwhile employers keep roles open for months because they only look at people with the same title.

## Who it's for

- **First: the person pivoting.** Someone in hospitality, retail or care who wants to change fields and doesn't know where their experience counts.
- **Second: employers with roles that are always open.** Operations, logistics, customer support and similar, starting in Barcelona.

## The bet (riskiest guesses)

1. **Riskiest:** employers will interview people from other fields when they see evidence activity by activity instead of job titles. I'll know when employers ask for a pilot and ask to meet someone they wouldn't have shortlisted from a CV.
2. People will put themselves forward ("Let employers find me") after their reading. I'll know when a meaningful share of readings end in an opt-in [target to set, e.g. 1 in 5].
3. An honest reading, which labels weak moves as weak, makes people trust it enough to act on it. I'll know when people keep most of the activities we find without editing them, and use the job titles and CV lines.

## In scope now (MVP)

- **The free reading:** describe a normal day and get 4–6 activities and three fields outside your industry. Each field comes with:
  - a fit label (strong, partial or weak), with the reason when weak;
  - which of your activities it uses;
  - what the work looks like there;
  - what you'd still need to learn;
  - job titles to search for;
  - CV lines in that field's language.
- **Changing the result in place:** edit, add or remove activities and look again; say no to a field (and why) to get another; correct the industry.
- **A landing page** whose hero starts the reading, with a "for employers" section and a pilot request form.
- **"Let employers find me":** an opt-in with explicit consent, and a private page to see, download and delete your data.
- **The operator area (me):**
  - add an employer's role and get its breakdown (activities, source fields, rewritten job ad, interview questions);
  - check the pool against it, with evidence and quotes;
  - shortlist people and track stages through to hired and "still there after 90 days".
- **Employer link:** the breakdown and the shortlist without names or contact details, plus "I'd like to meet".
- **Proven moves:** anonymous hire counts fed back into the reading and shown as real numbers once a move has 3 or more hires.
- **Privacy and security:** consent, retention, redaction, private links, hardened headers and the privacy policy.

## Out of scope for now (and why)

- **Accounts and logins for people or employers.** Private links are enough to learn; accounts add friction and data.
- **Payments and billing.** The price gets tested by hand with a few employers before any billing code.
- **Automatic introductions or contact sharing.** I introduce people by email after both sides agree, which keeps a person in every decision.
- **The employer-side candidate check on screen.** It's built but hidden, because the focus is the person pivoting.
- **Scores or rankings of candidates.** We show evidence, never a number that could reject someone.
- **Integrations with job boards or applicant tracking systems.** These only make sense once employers use it regularly.
- **More languages than the ones people write in.** The reading answers in the language you write in; there's no separate Spanish interface yet.
- **Training partners and course referrals.** This is a later revenue line, once proven moves show which gaps matter.

## Business model (hypothesis)

Free for people. Employers pay a fee per hire, below what an agency charges, refunded if the person leaves in the first 90 days. This hasn't been tested yet; the next step is to put the offer in front of 3 employers by hand.

## Defense

The data cycle: real outcomes (who got hired, who stayed 90 days) become proven moves, which make the reading more believable, which brings more people and employers, which leads to more hires. The visible product can be copied in an afternoon; the outcomes can't.

## Success criteria for the next two weeks

1. The app is deployed on its own domain, and the real-model output has been checked in English and Spanish.
2. At least 10 real readings from people in hospitality, retail or care, with notes on what they changed and what they said.
3. At least 3 conversations with employers that have a role that's always open, and at least one pilot request.
4. Opt-in rate and edit rate measured against Guesses 2 and 3.

## Definition of done for this MVP

From a public link, a person describes their day and in about a minute sees their activities and three fields with honest labels. They can change the result and join the pool with consent. I can add a role, find people in the pool with evidence, share a link with the employer and record a hire, which then shows up as a proven move.

## Known risks

- Employers may not interview people from other fields, even with evidence (Guess 1).
- AI readings can be wrong or flattering; they're labelled and reviewed, but real-model quality is unchecked.
- Using AI to evaluate candidates is high-risk under the EU AI Act. A risk assessment (DPIA) and processor agreements are needed before matching real people at scale.
- With no users or hires yet, the data cycle hasn't started.
