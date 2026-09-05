# Research notes

What the plan in `app/data.js` is built on, and where the numbers came from.
Read this before treating any figure in the app as precise.

## Resale ROI

Published cost-versus-value reporting for 2026 consistently shows the same
shape: **small exterior replacements top the rankings, and large interior
remodels sit at the bottom.** Eight of the top ten projects by return are
exterior. The only interior project near the top is a *minor* kitchen refresh.

Reported figures for the highest-ranked projects:

| Project | Reported return |
|---|---|
| Garage door replacement | 194%–268% depending on source |
| Steel entry door | 188%–216% |
| Manufactured stone veneer | ~208% |
| Interior paint, done cleanly | ~107% |
| Minor kitchen remodel | ~95%–113% |
| Basic lawn care and mulch | 104%–217% |
| Minor bath remodel | ~71% |
| Landscape lighting | ~59% |

**Treat these as a ranking only.** Note the spread on garage doors — 194% and
268% are both 2026 figures for the same project from different outlets. The
underlying reports also note that homeowners spending the typical $15,000–20,000
on pre-sale improvements frequently recoup **under 60 cents on the dollar** in
practice. The gap between the headline percentages and that sentence is the most
important thing on this page.

Guardrails that appear across sources: keep any single project under ~30% of the
home's value, and for a sale inside twelve months prefer "high-impact, low-cost
visual refreshes" over renovation.

On landscaping specifically: an often-cited Virginia Tech Extension figure puts
the *perceived* value lift from landscaping at 5.5%–11.4%. Perceived, not
appraised. Its real mechanism is stated plainly in the industry sources — a
well-kept exterior leads buyers to assume the interior was maintained too, which
raises confidence and reduces aggressive negotiation.

- [Opendoor — best home improvements for ROI in 2026](https://www.opendoor.com/articles/best-home-improvements-to-increase-value-where-to-spend-for-maximum-roi-in-2026)
- [HomeCostLab — 2026 Cost vs Value, project by project](https://homecostlab.com/guides/cost-vs-value-report-2026-roi/)
- [Angi — highest-ROI remodeling projects 2026](https://www.angi.com/articles/remodeling-projects-highest-roi.htm)
- [Lawn Love — landscaping projects that add home value](https://lawnlove.com/blog/landscaping-projects-that-add-home-value/)
- [Brezsny Associates — the ROI of curb appeal](https://www.brezsnyassociates.com/blog/the-roi-of-curb-appeal-why-landscaping-is-often-the-smartest-pre-sale-investment-you-can-make/)

## Selling with cats

**Odor is the number one deal-killer**, not hair. 67% of REALTORS® report that
pet ownership has a moderate-to-major impact on a sale. Roughly 10–20% of people
are allergic to cats or dogs, and pet allergens embed in carpet fibers,
upholstery, **HVAC ductwork**, and even drywall — which is why the pre-listing
reset in Phase 4 includes duct cleaning and professional extraction rather than
just a deep clean.

Two findings drove specific design decisions in the app:

- **Masking backfires.** Air fresheners and candles read to buyers as *something
  is being hidden*. Sources are unanimous: remove at the source with enzyme
  cleaners, never cover. The app says this twice on purpose.
- **Pets should be off the property for every showing** — allergies, distraction,
  and liability. Hence the "cat relocation plan" as a real project with a
  rehearsed 30-minute drill, since showing requests come same-day.

- [HomeLight — selling a house with pets](https://www.homelight.com/blog/sell-house-with-pets/)
- [Opendoor — minimizing odors, damage, and buyer concerns](https://www.opendoor.com/articles/steps-for-selling-a-home-with-pets)

## Cat hair as a system

Layer ordering in the app follows leverage: source control beats capture, capture
beats cleanup.

- **Grooming** is the highest-leverage intervention; brush in a ventilated space
  or outdoors. A sudden increase in shedding can signal stress or a health issue.
- **Air:** size purifiers for **4–5 air changes per hour** in the rooms cats
  actually use, and place one near the litter area for odor and litter dust.
  Multi-cat households need filter changes **30–50% more often**.
- **HVAC:** every MERV rating from 8 to 13 captures pet *hair* (20–100 microns)
  easily — the rating matters for **dander**. MERV 13 captures ≥90% of pet dander
  and down to 0.3 microns; MERV 11 is the safer default for system compatibility.
  Two cautions that made it into the app verbatim: **do not exceed what your
  blower supports**, and **check the filter actually seals in its slot**, because
  gaps let air bypass the media entirely. With pets, change monthly.

- [Air Filters Delivered — which MERV rating for pet dander](https://www.airfiltersdelivered.com/blogs/helpful-tips/which-merv-rated-air-filter-is-best-for-pet-dander)
- [Coway — science-backed guide to cat dander](https://cowaymega.com/blogs/blog/banish-cat-dander-for-good-your-science-backed-clean-air-guide)

## Flies next to horses

- **Fly predators** are species-specific parasitoid wasps that kill fly pupae.
  Harmless to horses, cats, dogs, people and honeybees; they don't sting or bite.
- **The schedule is the treatment.** Pest flies reproduce roughly **nine times
  faster** than the predators, so releases must repeat **every 3–4 weeks**
  through the warm months. A single release accomplishes very little.
- **Start before daytime temperatures consistently reach 60°F** — fly development
  accelerates past that point, and getting ahead of the first hatch matters more
  than anything done afterward.
- **Dosing is keyed to animals, not acreage**: roughly 500–1,000 per large animal.
  Since the horses are the neighbor's, the effective dose depends on their herd —
  which is exactly why the neighbor conversation is in the plan as a real project.
- **Traps:** odor-baited for house flies, visual/sticky for biting stable flies.
  Hang them **away from the barn and house**, at least **4 feet up**, at
  **50–100 foot intervals**. The goal is to pull flies away from where you live.
- Combining predators with traps is the recommended approach when adults are
  already present: traps handle the existing population, predators handle the
  next generation.

- [Spalding Labs — controlling house flies on a farm](https://info.spalding-labs.com/how-to-control-house-flies-farm-biological-control/)
- [University of Kentucky Entomology — fly control around horse barns](https://entomology.mgcafe.uky.edu/ef514)
- [Stable Management — fly traps for the horse farm](https://stablemanagement.com/articles/fly-traps-horse-farm-32199/)

## DIY smart home

The stack in the app is Home Assistant + Zigbee + ESPHome, chosen because it is
local, subscription-free, and **portable** — which matters when you're selling.

- **ESPHome** turns $5–15 microcontrollers into sensors defined by a YAML config
  — no C++, no soldering for most projects, no cloud dependency. An ESP32 plus a
  particulate sensor is roughly $35 and an afternoon.
- For room presence, **mmWave radar modules** (LD2410/LD2450) detect motion as
  small as breathing and substantially outperform PIR sensors indoors.
- As of August 2026 there is an official **ESPHome Starter Kit** at $39.99 from
  Apollo Automation and the Open Home Foundation, with no soldering and no cloud
  account required — a reasonable on-ramp if the DIY path looks intimidating.

- [ESPHome Starter Kit review](https://newatlas.com/technology/esphome-starter-kit-review-from-blinking-lights-to-building-a-smart-home)
- [ESPHome + Raspberry Pi sensor guide](https://raspberry.tips/en/raspberrypi-tutorials/esphome-raspberry-pi-smart-home-sensors)

## Habit design

The Sunday Huddle and The Floor come from habit-stacking research: anchor a new
behavior to something that already reliably happens, and keep the new behavior
small — five minutes or less — because repetition strengthens the pathway and
makes the task cheaper over time. The failure mode this guards against is the
one that actually kills family systems: a new routine that depends on nobody
having a bad week.

- [Motherly — habit stacking for family routines](https://mother.ly/health-wellness/mental-health/habit-stacking/)
- [Waterford.org — using habit stacking to start a home routine](https://www.waterford.org/resources/habit-stacking-tips/)

## What is *not* sourced

The hour estimates on Mission projects are my own estimates for a
moderately-handy adult, and they drive the capacity check. Re-estimate them
after you've completed one project of each type; the projection sharpens a lot
once real numbers replace them.
