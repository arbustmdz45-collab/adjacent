# adjacent

Helping skilled people move into new fields.

Paste a description of work that needs doing. You get back the capabilities that work actually requires, written as activities instead of skill labels. Then you get three fields outside the industry where people already do those activities. Every match shows where those people built the capability and what they'd still need to learn. Weak matches are labelled weak, with the reason.

The result can be changed in place:

- **Edit, remove or add a capability.** Then re-match: the new fields are found against your version of the list, not the model's.
- **Reject a field.** Say why if you like, and only that field is replaced. Rejected fields aren't suggested again for that role.
- **Change the excluded industry** if the model guessed it wrong.

**Candidate check (built, currently hidden).** Paste a CV, or a few lines on what a person has done. You see, capability by capability, whether their background shows it, in their own words. Then you get interview questions to verify what's partial or missing, and a rough training plan to close the gaps. The verdict is one of "worth an interview", "worth a short call first" or "not enough evidence yet". It never says a person is unsuitable. Quotes are checked against the pasted text, and any that don't appear in it are dropped. Names, age and other personal details are ignored.

There are no accounts, no saving and no history. To run two roles, paste twice.

## How it's built

```
lib/prompt.ts             Everything the model is told: system prompt, per-step prompts, output schemas
lib/types.ts              The shape of a capability, a field, a gap
app/api/analyse/route.ts  The one API route. Four steps: capabilities, fields, replace, candidate
app/page.tsx              The one screen: empty, thinking, result
components/               Capability list, field card, thinking steps
```

The model answers through forced tool calls, so its output always fits the schema. To change how the product thinks, edit `lib/prompt.ts`. To add a field to the output, change `lib/types.ts`, the schema in `lib/prompt.ts`, and `components/FieldCard.tsx`.

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
