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

There are no accounts, no saving and no history. To try a different job, start again.

## How it's built

```
lib/prompt.ts             Everything the model is told for the pivoting flow: system prompt, per-step prompts, output schemas
lib/hiring-prompt.ts      Employer-side candidate check (hidden for now)
lib/types.ts              The shape of a capability, a field, a gap
app/api/analyse/route.ts  The one API route. Four steps: capabilities, fields, replace, candidate
app/page.tsx              The one screen: empty, thinking, result
components/               Capability list, field card, thinking steps
```

The model answers through forced tool calls, so its output always fits the schema. To change how the product thinks, edit `lib/prompt.ts`. To add something to each field card, change `lib/types.ts`, the schema in `lib/prompt.ts`, and `components/FieldCard.tsx`.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev
```

## Deploy

1. Import this repo at vercel.com/new.
2. Add `ANTHROPIC_API_KEY` under Environment Variables. `ANTHROPIC_MODEL` and `RATE_LIMIT_PER_10_MIN` are optional.
3. Deploy.

The rate limit is per server instance and held in memory. It stops casual abuse but won't hold up under real traffic, so move it to a shared store such as Upstash Redis before you share the link widely.
