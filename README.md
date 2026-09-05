# Mission: Fix Up House

A house-fixing and house-keeping system for a family of five, three cats, a
two-story 4bd/3.5ba, a horse pasture next door, and about twelve months on the
clock before listing.

**Mission Control** is the app in `app/`. It opens filled in — there is nothing
to configure before it starts working.

---

## The thesis

Two clocks are running in this house at the same time, and they compete for the
same Saturday:

| | **The Rhythm** | **The Mission** |
|---|---|---|
| Runs | forever | ends at listing |
| Fails by | slow decay | running out of weeks |
| Shape | a loop | a burndown |

Almost every home-organization system fails because it only models one of them.
You end up with a chore chart that ignores the renovation, or a project list
that ignores the fact that five people and three cats keep living in the house
while the projects happen. Mission Control runs both, in two colors — verdigris
for the forever clock, amber for the finite one — and makes the tradeoff between
them visible instead of pretending it isn't there.

## Why your last system didn't stick

This is the actual problem, so it got the most design attention. Four failure
modes, and what this app does about each:

**The setup cliff.** You spend a Saturday building the perfect chart and it dies
in three weeks, because all the effort landed up front and all the payoff was
supposed to come later. → *This ships pre-seeded with your actual house. Zero
setup. Rename five people if you want; that's it.*

**The manager trap.** One parent becomes the person who assigns, and assigning is
more work than doing. Resentment follows, then collapse. → *Rotation is computed
and visible to everyone. The app assigns, so no person has to. "The app said so"
is a genuinely different conversation than "I said so."*

**All-or-nothing collapse.** Miss three days, everything turns red, abandon the
whole thing. → *Due dates roll forward from when you last did a job, never from a
fixed calendar. Nothing accumulates into a wall of red. A streak counts any week
you hit **70%**, not a perfect one.*

**No visible win.** Nothing ever tells you it's working. → *Weeks held, projects
closed, hours remaining, estimated value added.*

The design rule underneath all four: **build for your worst week, not your best.**
A system that needs your best week dies on your first bad one, and there will be
bad ones. That's what **The Floor** is — five things that, done alone, mean you
haven't lost ground.

## The one habit that matters

If you keep one thing from all of this, keep the **Sunday Huddle**: twenty
minutes, once a week, anchored to a meal you already eat together. Habits stick
when they're attached to something that already reliably happens — the anchor
does the work willpower otherwise has to. Everything else in here is downstream
of that twenty minutes.

---

## What's in the app

| Screen | What it's for |
|---|---|
| **Today** | The Floor, plus what's actually due, with names already on it |
| **Rhythm** | 38 recurring jobs on rolling schedules, and the six-zone rotation |
| **Mission** | 47 projects across 5 phases, with a capacity check |
| **Cats** | Six-layer hair and odor plan, ordered by leverage |
| **Flies** | The seasonal campaign, given that the manure isn't yours |
| **Smart** | DIY, local-first, deliberately portable |
| **Huddle** | The twenty-minute weekly script |
| **Setup** | Names, dates, backup |

### The phases, and why they're in this order

Two scheduling rules drive the whole plan:

- **Things that decay get done last** — mulch, paint, deep cleaning, the lawn.
  Do them in month four and you pay for them twice.
- **Things that need lead time start first** — grass seed and plantings need a
  season to look established; three contractor bids take a month to collect.

| | Phase | When | The point |
|---|---|---|---|
| 0 | Stop the Bleeding | Weeks 1–4 | Halt active damage; get the Rhythm running before anything else |
| 1 | Subtract | Months 1–3 | Remove ~30% of what's in the house. Free, and it outperforms most upgrades |
| 2 | De-risk | Months 3–7 | Fix what an inspector would flag, before it becomes a price concession |
| 3 | The Money Shots | Months 6–10 | The visible upgrades — overwhelmingly exterior and modest |
| 4 | Stage & List | Final 8 weeks | Everything perishable, all at once |

### Read the ROI numbers as a ranking, not a promise

The figures in the Mission screen come from national cost-versus-value style
reporting. They move year to year and market to market, different outlets
publish materially different numbers for the same project in the same year, and
the same reporting notes that sellers frequently recoup well under what the
averages suggest. Use them to decide *what to do first*, never to forecast your
sale price.

The mechanism that reliably works on a twelve-month clock is **condition and
presentation, not renovation**. A guardrail worth keeping: no single project
should exceed roughly 30% of the home's value.

The highest-return line item in the entire plan is a **pre-inspection**. You get
the buyer's list a year early, at your own pace, with no negotiating leverage
attached to it.

### The unglamorous truth about the cats

There are two separate problems and they need different solutions.

The **hair** problem is a quality-of-life problem, and it's mostly solved at the
source: brushing, plus washable throws on the three places the cats actually
sleep, which turns a cleaning problem into a laundry problem.

The **odor** problem is a *sale* problem, and it's the one that costs real money —
odor is consistently the biggest deal-killer reported for pet households. It
lives in carpet, upholstery, and ductwork, and you cannot smell it, because
nose-blindness to your own house is total. Hence the single least optional item
in the plan: **the Nose Test** — a friend who owns no animals, walking through,
being honest. And never mask it. A buyer who smells air freshener assumes
something is being hidden, which costs more than the original smell.

### The flies, and the thing you don't control

Source control is by far the biggest lever in fly management, and the manure is
not on your property. So the plan is interception (predator releases every 3–4
weeks through the warm months — the schedule *is* the treatment, since pest flies
outbreed the predators badly), traps hung *away* from the house to pull flies off
your patio rather than invite them over, exclusion at every screen and door, and
one genuinely worthwhile conversation with the neighbors about splitting the cost
of predators for their side. That last one is worth more than everything else
combined.

Start before daytime temperatures consistently hit 60°F. Everything is easier
before the first generation hatches.

### On the smart home

Every item is chosen against a problem you actually have, and every item unplugs
and comes with you. Nothing hardwired, nothing on a subscription.

Be honest about what it does: smart home gear rarely shows up in an appraisal.
Its value here is that it automates the maintenance system so it survives a busy
week, and that leak sensors under every sink cost about ninety dollars against a
five-figure water-damage claim during your sale year. Start there, not with the
fun one.

---

## Running it

No build step, no dependencies, no server.

```bash
# just open it
open app/index.html

# or rebuild the single-file bundles after editing
node build.mjs
```

`build.mjs` writes two files:

- `dist/mission-control.html` — one self-contained page. Host it anywhere,
  or open it straight off the disk.
- `dist/artifact-body.html` — the same page without the document wrapper, which
  is what the Artifact publisher wants.

### Where the data lives

The app works standalone and stores state in the browser. Published as an
Artifact it also picks up a **shared database**, so every phone and the kitchen
tablet see the same board live — check something off downstairs and it's checked
off on everyone's phone. The app detects this at runtime and falls back cleanly,
so the same file works either way. Setup → Export makes a JSON backup.

### Editing the plan

`app/data.js` is plain data and meant to be edited by hand — tasks, cadences,
projects, costs. Everything else derives from it.

---

## The honest caveat

Two numbers in here are estimates and should be treated as such: the ROI
percentages (national averages, wide variance, discussed above) and the hour
estimates on projects. The hour estimates are what drive the capacity check, so
if they're off, the capacity check is off in the same direction. Re-estimate the
big ones — interior paint, decluttering, the pre-inspection punch list — after
you've done one of each, and the projection gets a lot sharper.
