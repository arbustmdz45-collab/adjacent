# adjacent

One page that tests **A1 — capable people would actually take these jobs** (see `docs/scope.md`).

It shows up to five real equestrian jobs in Catalonia to people in one adjacent field (currently veterinary assistants) and asks for one thing: an email, with a short note on why.

## Run it

```
python3 server.py
```

Then open http://localhost:8000. No dependencies, just Python 3.

Sign-ups are added to `signups.csv` in this folder (email, current job, why). That file is the only record; read it by hand. It is git-ignored, and the server never serves it.

## Before you share it

1. Edit `jobs.json`: replace the five placeholder roles with real ones you found by calling stables, put the pay in as it is, and set `"placeholder": false`. The yellow **Borrador** banner stays up until every role is real.
2. If you pick a different adjacent field, change the header line and the "Por qué tú" list in `index.html`.

## What this deliberately is not

No accounts, matching, payments, dashboard, employer side, CVs, second sector or branding. See the "does NOT do" list in `docs/scope.md`.
