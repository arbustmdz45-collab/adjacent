# Architecture Doc

**Venture:** unnamed (working title: bringing capable people into under-qualified sectors)
**Founder:** Augusto — BBA, ESADE
**Phase:** 0 — Problem
**Last updated:** 6 October 2026

---

## 1. Description of the venture

Some sectors hire from a pool that is not very qualified, not because the work does not need capability, but because nobody from outside that world ever looks their way. Equestrian, construction, small trades, family-run operations. Meanwhile there are capable people in other fields whose skills would apply directly, and who never find out those sectors exist as options.

What I would build points capable people from other fields toward sectors that currently hire below their own need.

**How I got here.** I started somewhere else: a diagnostic sold to companies, telling them which adjacent profiles their job ads were screening out. Then I talked to three people. Two of them independently said the same thing — the useful move is finding people who are already trained and capable, not filtering the same pool better. The horse stable owner said in-person hiring still wins for him and that what he actually wants is capable people from other fields brought into the equestrian world. My father said the same thing almost word for word.

So the pivot is deliberate: I went with what the people I talked to told me would work, rather than with the version I had already researched and grown attached to.

**What I am giving up by doing that.** The diagnostic had cleaner economics — a repeat sale to the same customer. The supply side is closer to placement, which has a bad history (see §6). I am accepting that risk because the customer signal was consistent and it is the only signal I have that did not come from me.

**Status:** direction set by interviews, product shape still undefined. Two more conversations needed before anything gets built.

---

## 2. Architectural principles

**P1 — Problem before product.** No naming, no building, no landing page until the problem survives contact with people who are not friends or family. I already broke this once by asking for brand names before validating anything.

**P2 — Human evidence outranks AI research.** AI research tells me what employers say; interviews tell me what they did. When they conflict, the interview wins. The pivot in §1 is this principle actually applied, not just stated.

**P3 — Argue against it first.** Every new direction gets the "give me the strongest evidence this is wrong" prompt before any supportive work. Everything I threw away came from before that prompt; everything I kept came after it.

**P4 — Say the number is unknown rather than inventing one.** Where I have a method but not the inputs, I write the method and name what is missing.

**P5 — Watch the placement trap.** Now that I am on the supply side, the failure mode is earning a fee and losing both the person and the company the moment it works. Any model that only earns on successful placement needs a second revenue line or it repeats a known failure.

**P6 — Discount friendly evidence.** When a warm source says the idea is good, that part is discarded. When they say something inconvenient, that part is kept. My father said both; I kept the second.

**P7 — Write down what would kill it.** Each phase states at least one condition that ends the project. Without that, every finding becomes confirmation.

---

## 3. Tradeoffs consciously accepted

**T1 — Supply side over diagnostic.** Chosen because two of three interviewees pointed there unprompted. Cost: worse economics than a repeat diagnostic, and it sits closer to placement, where several well-funded companies have failed.

**T2 — Beachhead is Spain and Barcelona, not Mexico.** I can reach people here in person this week, and one interviewee said mid-size Mexican companies lack the infrastructure. Cost: Mexico is the market I actually understand. Also worth flagging that this finding conveniently matched a choice I had already made for convenience, which is a reason to hold it loosely.

**T3 — Under-qualified sectors, not white-collar roles.** The signal came from equestrian and construction, which is not where I was looking. Cost: these sectors have less money and less software habit than the mid-market offices I had in mind.

**T4 — Services-shaped before software-shaped.** A services business can start with one customer and no product. Cost: wrong shape for an AI-native ventures course, and it will cost me on that criterion.

**T5 — Solo.** The course caps at solo or pair and I carry the domain knowledge anyway. Cost: no second opinion inside the project; everything is self-checked.

**T6 — Narrow vertical first.** One sector, testable in a weekend. Cost: whatever I learn may not generalise.

---

## 4. Open assumptions

**A1 — Capable people would actually take these jobs.** This is the new load-bearing assumption and nothing supports it yet. The sectors pay less and carry less status, which is plausibly why nobody looks their way. *Check:* talk to people who did move into a sector like this and find out what made them.

**A2 — The sector will pay to be found.** The stable owner wants capable people; he did not say he would pay for them. The construction owner said anything like this has to be cheap and come with a benchmark showing results, which is a cold-start problem since the first customers pay before any results exist. *Check:* name a price in the next conversations and watch the reaction instead of asking what they would pay.

**A3 — The matching itself is not the hard part.** O*NET and LinkedIn have mapped skill transferability for years, and Eightfold does adjacent-skill matching commercially. If matching is solved, my value is distribution and persuasion, not analysis. *Check:* try the matching by hand for one role and see whether the answer was obvious.

**A4 — In-person hiring can be worked with rather than replaced.** The stable owner said in-person still wins for him. If that is general in these sectors, software is a support layer at best. *Check:* ask the next two how they made their last three hires.

**A5 — I can get non-warm interviews.** All three so far are family or friends' fathers. *Check:* one cold conversation with an agency recruiter.

**Kill conditions.** If capable people from other fields consistently say they would not take these jobs at the pay on offer, A1 is dead and there is no supply to point anywhere. If nobody in the sector will pay without a proven benchmark, A2 is dead and this is a content product, not a business.

---

## 5. Tracked dependencies

**External evidence I rely on**

Cifras PYME (Ministry of Industry, November 2025) gives 28,373 Spanish companies with 50–249 employees and 6,104 with 250 or more; the sizing collapses without it. SHRM 2025 gives 44-day average time-to-fill and roughly $4,700 cost-per-hire, used as a pain anchor. McKinsey's 2026 HR Monitor gives a 70-day median time-to-hire for senior roles. NFIB's 34% of US small business owners with unfillable openings is the weakest link in the chain — different country, different size definition.

The Harvard Business School and Burning Glass Institute finding on degree requirements — companies dropped the requirement and barely changed who they hired — is tracked deliberately as the strongest evidence against the original version of this idea. It matters less now that I am on the supply side, but it still says employer behaviour does not change easily.

**Competitive dependencies**

Eightfold AI does adjacent-skill matching at enterprise scale. Gloat does the same internally. SeekOut, Beamery, Reejig and Findem are adjacent. O*NET and the LinkedIn skills graph are free alternatives to the matching layer.

**Human dependencies**

Three interviews done, all warm intros: a construction company owner, a horse stable owner, and my father. Two remaining and they should be cold — an agency recruiter and someone who actually moved into one of these sectors from elsewhere. Route in: ESADE alumni network and the careers office.

**Course dependencies**

Phase 0 handouts, interviews due before the next session. The binding constraint is time, not ideas: I am on an 8-to-8 schedule and dropping one subject.

---

## 6. What I am deliberately avoiding

Written down so drift is visible when it happens.

Reverse marketplaces. Hired raised over $130M from GV and NEA and wound down in 2020, selling assets to pay creditors; Vettery absorbed it; Triplebyte shut down in March 2023. Two structural reasons, and both apply to me now that I am on the supply side: curation quality dilutes as you scale, and a successful placement removes your user from the platform.

Building a thin version of Eightfold. Its value comes from data volume I do not have.

Anything where someone would say "so it's a job board." That sentence is the signal I have drifted.

---

## 7. Session log

**Session 1 — Problem phase.** Arrived with four candidates: AI brand visibility, pensions in LatAm, accessible retail in LatAm, slice pizza. Picked AI visibility first because it was AI-native by construction. Then a different idea arrived on its own — skill transfer across fields — and I switched. Caught myself asking for brand names before validating anything.

**Session 2 — Problem testing.** Research showed the first half of my idea was crowded: AI career-pivot platforms already earn real revenue, and O*NET and LinkedIn have mapped skill transferability for years. The uncrowded part was jobs where the default hire does not fit the work. Reframed from consumer to employer, since the career-changer buys once and has no money. Found the strongest evidence against it, the 85% versus 0.14% result. Built the market size bottom-up: around 31,000 Spanish companies in the band, roughly €14M a year at €1,500 a diagnostic, which is a services business rather than a venture-scale market.

AI failures logged in that session: it invented plausible examples of mismatched roles and presented them as confidently as sourced facts; it wrote interview questions about the future, which is the exact mistake the course warns about; it produced a clean market number from assumptions it had made up; and it only surfaced the damaging study after being told to argue against me.

**Session 2 — Interviews, three of five.** The construction company owner said something like this would be useful but it has to be cheap and come with a benchmark showing results. The horse stable owner said in-person hiring still wins for his business, and what he actually wants is capable people from other fields brought into the equestrian world, since the people he usually hires are not highly qualified. My father reinforced that almost word for word and added that mid-size companies in Mexico lack the infrastructure for it.

**The pivot.** Two of three independently pointed at the supply side rather than the screen, so I moved the venture there. That is the main thing that changed, and it came from the conversations rather than from research. Mexico is out as a starting market. All three were warm intros, so the encouragement is discounted and the inconvenient parts are kept.

**Open question going into the next session.** How the supply side earns money without becoming a placement business. The interviews point toward supply; the failure history points away from placement economics. Unresolved, and resolving it is the next job.

---

## 8. Changelog

**6 October 2026.** Doc created, then rewritten the same day to reflect the pivot from the employer-side diagnostic to the supply side, following three interviews. Tradeoffs and assumptions rewritten around the new direction.
