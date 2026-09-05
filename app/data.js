/* Mission Control — seed data
 * Everything here is the *plan*. Mutable state (what's done, what it cost)
 * lives separately in storage so this file stays editable by hand.
 *
 * House profile: 2 stories, 4 bed, 3.5 bath, family of 5, 3 cats,
 * horse property next door, listing target ~June 2027.
 */

const HOUSE = {
  name: "Mission: Fix Up House",
  stories: 2,
  beds: 4,
  baths: 3.5,
  people: 5,
  cats: 3,
  listTarget: "2027-06-15",
  neighborHorses: true,
};

/* ---------------------------------------------------------------------------
 * PEOPLE — rename these in Settings. Capability tiers drive auto-assignment so
 * a 7-year-old never gets handed the gutters.
 * ------------------------------------------------------------------------- */
const PEOPLE = [
  { id: "p1", name: "Grown-up 1", short: "G1", tier: 3, color: "#c2721a" },
  { id: "p2", name: "Grown-up 2", short: "G2", tier: 3, color: "#17706b" },
  { id: "p3", name: "Kid 1",      short: "K1", tier: 2, color: "#3d6ea8" },
  { id: "p4", name: "Kid 2",      short: "K2", tier: 2, color: "#8a5aa8" },
  { id: "p5", name: "Kid 3",      short: "K3", tier: 1, color: "#a85a6e" },
];

/* ---------------------------------------------------------------------------
 * ZONES — six-week rotation. One zone gets the deep pass each week; everything
 * else stays on light duty. This is the classic zone-cleaning trick and it is
 * the only way a 4/3.5 two-story stays ahead of five people and three cats.
 * ------------------------------------------------------------------------- */
const ZONES = [
  { id: "z1", name: "Kitchen & Pantry",        floor: 1, note: "Highest traffic. Cat bowls, fridge coils, under-sink leak check." },
  { id: "z2", name: "Living & Dining",         floor: 1, note: "Where the cats actually live. Throws, upholstery, baseboards." },
  { id: "z3", name: "Entry, Stairs & Halls",   floor: 1, note: "Stair treads hold the most hair in the house. Also fly entry point." },
  { id: "z4", name: "Primary Suite",           floor: 2, note: "Bed + bath. Grout, glass, vent fan." },
  { id: "z5", name: "Kids' Rooms & Bath",      floor: 2, note: "Three rooms + full bath. Kids do their own; adult inspects." },
  { id: "z6", name: "Garage, Laundry, Utility", floor: 1, note: "Dryer vent, water heater, filter stock, the junk pile." },
];

/* ---------------------------------------------------------------------------
 * THE FLOOR — the Minimum Viable Week.
 *
 * This is the single most important list in the app. On a bad week — sick kid,
 * work crunch, holidays — you do ONLY these five and you have not lost ground.
 * A system that requires your best week dies on your first bad one.
 * ------------------------------------------------------------------------- */
const FLOOR = [
  { id: "f1", title: "Scoop every litter box",       detail: "All 4 boxes, daily. Non-negotiable — this is the one that becomes a $3,000 problem.", per: "day" },
  { id: "f2", title: "Robots run + main floor swept", detail: "Push the button if the schedule didn't. Stairs by hand.", per: "day" },
  { id: "f3", title: "Kitchen reset before bed",      detail: "Counters clear, sink empty, dishwasher running.", per: "day" },
  { id: "f4", title: "Wash the cat textiles",         detail: "Throws off the couches and cat beds — one load, hot.", per: "week" },
  { id: "f5", title: "Trash, recycling, 10-min purge", detail: "Bins to the curb, and everyone grabs 5 things that leave the house.", per: "week" },
];

/* ---------------------------------------------------------------------------
 * RHYTHM — the recurring maintenance engine.
 *
 * cadence: days between repeats, counted from when you LAST DID IT, not from a
 * fixed calendar. Miss a week and it slides, it does not turn into a red debt.
 * tier: minimum capability tier — 1 kid-friendly, 2 older kid, 3 adult.
 * ------------------------------------------------------------------------- */
const RHYTHM = [
  // --- Daily / near-daily -------------------------------------------------
  { id: "r01", title: "Scoop litter boxes", cadence: 1, min: 6, tier: 1, tag: "cats", zone: null, why: "Three cats, four boxes. Odor is the #1 thing that kills a home sale — and it soaks into drywall long before you smell it." },
  { id: "r02", title: "Run robot vacuums (both floors)", cadence: 1, min: 3, tier: 1, tag: "cats", zone: null, why: "Daily beats deep. Hair you pick up today never gets ground into carpet fiber." },
  { id: "r03", title: "Kitchen reset", cadence: 1, min: 12, tier: 2, tag: "core", zone: "z1", why: "A clean kitchen at 10pm is the difference between waking up ahead or behind." },
  { id: "r04", title: "Sweep stairs + entry", cadence: 2, min: 6, tier: 2, tag: "cats", zone: "z3", why: "Stair treads are the single biggest hair reservoir in a two-story house." },
  { id: "r05", title: "Doors closed sweep", cadence: 1, min: 2, tier: 1, tag: "flies", zone: null, why: "Every door left open is a dozen flies. Make it a named job and it stops being nagging." },

  // --- Weekly -------------------------------------------------------------
  { id: "r10", title: "Brush all three cats", cadence: 3, min: 15, tier: 1, tag: "cats", zone: null, why: "Source control. An undercoat rake pulls out hair that would otherwise land on every surface you own. Do it on the porch." },
  { id: "r11", title: "Wash cat throws + beds", cadence: 7, min: 10, tier: 2, tag: "cats", zone: null, why: "Washable throws on the 3 spots cats actually sleep concentrates ~80% of the hair into things you can machine-wash." },
  { id: "r12", title: "Zone deep pass", cadence: 7, min: 75, tier: 2, tag: "core", zone: "rotating", why: "One zone per week gets the real treatment. Six weeks and the whole house has been done." },
  { id: "r13", title: "Bathrooms quick pass (all 3.5)", cadence: 7, min: 30, tier: 2, tag: "core", zone: null, why: "Toilets, sinks, mirrors. Not deep — deep happens on that bath's zone week." },
  { id: "r14", title: "Laundry: all beds", cadence: 7, min: 30, tier: 2, tag: "core", zone: null, why: "Five people. Stripping every bed the same day is faster than five separate loads." },
  { id: "r15", title: "Wipe litter area + mats", cadence: 7, min: 8, tier: 2, tag: "cats", zone: null, why: "The tracked litter halo is what visitors notice." },
  { id: "r16", title: "Empty vacuum + clean brushrolls", cadence: 7, min: 8, tier: 2, tag: "cats", zone: null, why: "A hair-choked robot is a robot that quietly stops working. This is the #1 reason people think robot vacuums 'don't work' with pets." },
  { id: "r17", title: "Mow + edge", cadence: 7, min: 45, tier: 3, tag: "yard", season: "warm", zone: null, why: "Basic lawn care is reported among the highest-return dollars you can spend before a sale." },
  { id: "r18", title: "Family Huddle (20 min)", cadence: 7, min: 20, tier: 1, tag: "system", zone: null, why: "THE keystone habit. Anchor it to Sunday dinner. Twenty minutes: review the week, pick the zone, claim Mission jobs. Skip this and the whole system dies within a month." },

  // --- Every 2-4 weeks ----------------------------------------------------
  { id: "r20", title: "Release fly predators", cadence: 24, min: 10, tier: 2, tag: "flies", season: "warm", zone: null, why: "Parasitic wasps that kill fly pupae before they hatch. Harmless to cats, kids and horses. Must be re-released every 3-4 weeks — pest flies breed far faster than the predators do." },
  { id: "r21", title: "Check + rebait fly traps", cadence: 14, min: 15, tier: 2, tag: "flies", season: "warm", zone: null, why: "Odor traps for house flies, sticky/visual traps for biting stable flies. Hang them AWAY from the house, 4ft up — you are luring flies away, not inviting them over." },
  { id: "r22", title: "Change HVAC filter", cadence: 30, min: 10, tier: 3, tag: "cats", zone: "z6", why: "With pets, monthly. MERV 11-13 catches pet dander — but confirm your blower can handle 13 before you jump, a too-restrictive filter starves the system." },
  { id: "r23", title: "Deep vacuum upholstery + curtains", cadence: 21, min: 40, tier: 2, tag: "cats", zone: null, why: "Dander embeds in soft goods. This is where a buyer's allergies get triggered." },
  { id: "r24", title: "Wipe baseboards + vent covers", cadence: 30, min: 30, tier: 2, tag: "cats", zone: "rotating", why: "Hair collects on horizontal ledges you never look at. Buyers look at them." },
  { id: "r25", title: "Mission work session", cadence: 7, min: 180, tier: 3, tag: "mission", zone: null, why: "One protected 3-hour block a week. This is how a 12-month project list actually gets finished." },

  // --- Quarterly / seasonal ----------------------------------------------
  { id: "r30", title: "Test smoke + CO alarms", cadence: 180, min: 20, tier: 3, tag: "safety", zone: null, why: "An inspector will check every one. Cheaper to fix now than as a closing credit." },
  { id: "r31", title: "Clean gutters + downspouts", cadence: 180, min: 120, tier: 3, tag: "yard", zone: null, why: "Overflowing gutters cause the foundation and siding problems that scare buyers most." },
  { id: "r32", title: "Clean dryer vent (full run)", cadence: 180, min: 45, tier: 3, tag: "safety", zone: "z6", why: "Pet hair + lint. Genuine fire risk, and a common inspection callout." },
  { id: "r33", title: "Flush water heater", cadence: 365, min: 60, tier: 3, tag: "safety", zone: "z6", why: "Extends its life and keeps 'aging water heater' off the inspection report." },
  { id: "r34", title: "HVAC pro service", cadence: 182, min: 90, tier: 3, tag: "safety", zone: null, why: "Two services a year, and KEEP THE RECEIPTS — a documented service history is a real negotiating asset at sale." },
  { id: "r35", title: "Reseal grout + caulk lines", cadence: 365, min: 120, tier: 3, tag: "core", zone: null, why: "Failed caulk reads as water damage to a buyer even when nothing is wrong." },
  { id: "r36", title: "Trim shrubs, edge beds", cadence: 45, min: 90, tier: 3, tag: "yard", season: "warm", zone: null, why: "Overgrowth against siding traps moisture and reads as neglect." },
  { id: "r37", title: "Walk the perimeter: screens, weatherstrip, gaps", cadence: 60, min: 30, tier: 3, tag: "flies", zone: null, why: "Exclusion is the cheapest fly control there is. One torn screen undoes a season of traps." },
  { id: "r38", title: "Standing water audit", cadence: 30, min: 20, tier: 2, tag: "flies", season: "warm", zone: null, why: "Flies breed in wet organic matter. Hose puddles, gutter sludge, compost, forgotten buckets, the base of the trash cans." },
];

/* ---------------------------------------------------------------------------
 * MISSION — the finite 12-month plan to list the house.
 *
 * Ordering principle, and it matters more than any individual project:
 *   Things that DECAY get done last (mulch, paint, lawn, cleaning).
 *   Things that need LEAD TIME get started first (seed, plantings, permits,
 *   anything needing three contractor bids).
 *
 * On the ROI numbers: these are national averages from cost-vs-value style
 * reporting and they move year to year and market to market. Use them to RANK
 * projects, never as a promise. The same reports note that homeowners often
 * recoup well under 100% in practice. The reliable mechanism for a 12-month
 * sale is condition and presentation, not renovation.
 * ------------------------------------------------------------------------- */
const PHASES = [
  { n: 0, id: "ph0", name: "Stop the Bleeding",  window: "Weeks 1–4",    hue: "risk",
    thesis: "Before a single upgrade: stop active damage, and get the weekly rhythm actually running. If the system isn't running, nothing below gets finished." },
  { n: 1, id: "ph1", name: "Subtract",           window: "Months 1–3",   hue: "teal",
    thesis: "The highest-return work in the whole plan is free. Remove ~30% of what's in the house. Empty rooms photograph bigger, and every box you move now is one you don't move in a panic later." },
  { n: 2, id: "ph2", name: "De-risk",            window: "Months 3–7",   hue: "warn",
    thesis: "Fix what an inspector would flag. This is where the money actually is: an inspection finding becomes a price concession at two to three times what the repair would have cost you." },
  { n: 3, id: "ph3", name: "The Money Shots",    window: "Months 6–10",  hue: "amber",
    thesis: "Now — and only now — the visible upgrades. Almost all of the top-returning projects are exterior and modest. Curb appeal is the whole game." },
  { n: 4, id: "ph4", name: "Stage & List",       window: "Final 8 weeks", hue: "good",
    thesis: "Everything perishable happens here: mulch, paint touch-up, deep clean, carpet extraction, peak lawn. Do these too early and you pay twice." },
];

/* cost = your estimated spend, value = rough resale impact, roi = reported band
 * decays = must be done close to listing; lead = weeks of lead time needed */
const PROJECTS = [
  // ---- Phase 0 : Stop the Bleeding ---------------------------------------
  { id: "m001", ph: "ph0", title: "Leak sensors under every sink, water heater, washer", cost: 90, value: 0, hrs: 2, cat: "smart", why: "Ten dollars a sensor against a five-figure water-damage claim in the middle of your sale year. Best risk-adjusted dollar in this whole document." },
  { id: "m002", ph: "ph0", title: "Fresh HVAC filter + set a monthly reminder", cost: 20, value: 0, hrs: 1, cat: "repair", why: "Three cats. Monthly, MERV 11–13, verified against what your blower can take." },
  { id: "m003", ph: "ph0", title: "Clear gutters + check downspout discharge", cost: 0, value: 400, hrs: 4, cat: "repair", why: "Water against the foundation is the most expensive problem you can grow by ignoring." },
  { id: "m004", ph: "ph0", title: "Walk the roof with binoculars, photograph everything", cost: 0, value: 0, hrs: 1, cat: "repair", why: "You need to know now whether there's a roof problem. A roof surprise in month 11 is a catastrophe; in month 1 it's a plan." },
  { id: "m005", ph: "ph0", title: "Fix every dripping faucet and running toilet", cost: 60, value: 300, hrs: 3, cat: "repair", why: "Trivial to fix, and each one is a line item on an inspection report." },
  { id: "m006", ph: "ph0", title: "Stand up the Rhythm system — 4 weeks unbroken", cost: 0, value: 0, hrs: 0, cat: "system", why: "This is a real project with a real deliverable: four consecutive weeks of hitting the Floor. Do not start Phase 1 until this is done." },
  { id: "m007", ph: "ph0", title: "Order fly predators + set the release schedule", cost: 180, value: 0, hrs: 1, cat: "flies", why: "Start before daytime temps consistently hit 60°F. Getting ahead of the first hatch is worth more than everything you do after it." },
  { id: "m008", ph: "ph0", title: "Pre-inspection: hire your own inspector", cost: 450, value: 3000, hrs: 4, cat: "repair", why: "The single smartest $450 in the plan. You get the buyer's list a year early, at your own pace, with no negotiating leverage attached to it." },

  // ---- Phase 1 : Subtract -------------------------------------------------
  { id: "m101", ph: "ph1", title: "Declutter: garage", cost: 0, value: 2000, hrs: 20, cat: "declutter", why: "Buyers need to see that a car fits. A packed garage reads as 'this house has no storage'." },
  { id: "m102", ph: "ph1", title: "Declutter: all closets to 70% full", cost: 0, value: 1500, hrs: 12, cat: "declutter", why: "A stuffed closet says the house is too small. Same closet at 70% says it's generous." },
  { id: "m103", ph: "ph1", title: "Declutter: kids' rooms (with the kids)", cost: 0, value: 800, hrs: 10, cat: "declutter", why: "Do it with them, not to them. Three rooms, one weekend each." },
  { id: "m104", ph: "ph1", title: "Rent a storage unit for 6 months", cost: 700, value: 3000, hrs: 8, cat: "declutter", why: "Cheaper than any renovation on this list and it makes every room look bigger. Counterintuitive but this outperforms most upgrades per dollar." },
  { id: "m105", ph: "ph1", title: "Depersonalize: photos, collections, fridge", cost: 0, value: 500, hrs: 4, cat: "declutter", why: "Buyers need to picture themselves living there. Save it for the last month if it's painful." },
  { id: "m106", ph: "ph1", title: "Audit the cat infrastructure — what stays, what hides", cost: 150, value: 1500, hrs: 4, cat: "cats", why: "Trees, towers, scratchers, bowls, boxes. Decide now which are staying for showings and which get consolidated. Buyers should not be able to count your cats." },
  { id: "m107", ph: "ph1", title: "Haul-away day: dump run + donation run", cost: 250, value: 0, hrs: 8, cat: "declutter", why: "Book the trailer. Momentum matters more than sorting perfectly." },

  // ---- Phase 2 : De-risk --------------------------------------------------
  { id: "m201", ph: "ph2", title: "Work the pre-inspection list, top to bottom", cost: 1500, value: 5000, hrs: 40, cat: "repair", why: "Every item you fix now is one that doesn't become a concession demand later." },
  { id: "m202", ph: "ph2", title: "GFCI outlets in all wet locations", cost: 200, value: 600, hrs: 4, cat: "repair", why: "Kitchen, 3.5 baths, garage, exterior. Guaranteed inspection callout, cheap to fix." },
  { id: "m203", ph: "ph2", title: "Regrade soil away from foundation", cost: 300, value: 2500, hrs: 16, cat: "repair", why: "Negative grading scares buyers more than almost anything else. Dirt is cheap." },
  { id: "m204", ph: "ph2", title: "Service HVAC, start the paper trail", cost: 350, value: 1500, hrs: 3, cat: "repair", why: "A folder of service records at showing time is worth real money." },
  { id: "m205", ph: "ph2", title: "Reglaze / regrout tubs and showers", cost: 400, value: 1800, hrs: 20, cat: "repair", why: "3.5 baths. Tired grout reads as water damage; fresh grout reads as a maintained house." },
  { id: "m206", ph: "ph2", title: "Repair drywall, patch every hole", cost: 150, value: 900, hrs: 16, cat: "repair", why: "Five people and three cats leave marks. Patch now, paint in Phase 4." },
  { id: "m207", ph: "ph2", title: "Fix every door: latches, squeaks, sticking", cost: 80, value: 700, hrs: 8, cat: "repair", why: "Buyers touch every door. A sticking door is a tiny, constant signal of neglect." },
  { id: "m208", ph: "ph2", title: "Address any cat-damaged surfaces", cost: 400, value: 2200, hrs: 12, cat: "cats", why: "Scratched door frames, clawed carpet edges, damaged screens. Find them all now — you've stopped seeing them." },
  { id: "m209", ph: "ph2", title: "Seal the house against flies", cost: 250, value: 300, hrs: 12, cat: "flies", why: "Re-screen torn windows, weatherstrip all exterior doors, add door sweeps. Pays off daily until you leave, and it's a real quality-of-life upgrade." },
  { id: "m210", ph: "ph2", title: "Talk to the horse neighbors", cost: 0, value: 0, hrs: 1, cat: "flies", why: "Manure management at the source is the single biggest lever on fly population and it isn't on your property. Offer to split the cost of fly predators — it's cheap, it's neighborly, and it works far better than anything you can do alone." },

  // ---- Phase 3 : The Money Shots -----------------------------------------
  { id: "m301", ph: "ph3", title: "Replace the garage door", cost: 4500, value: 8000, hrs: 8, cat: "curb", roi: "Consistently the #1 ranked project, reported 190–270%", why: "Biggest single visual mass on most facades. It reads instantly." },
  { id: "m302", ph: "ph3", title: "Replace the front entry door (steel)", cost: 2200, value: 4000, hrs: 6, cat: "curb", roi: "Reported ~190–215%", why: "Where every buyer stands while the agent works the lockbox. They will study it." },
  { id: "m303", ph: "ph3", title: "Pressure wash everything", cost: 120, value: 2000, hrs: 10, cat: "curb", why: "Siding, walks, drive, fence, deck. Rent the machine. Dollar for dollar this is the most dramatic thing on the entire list." },
  { id: "m304", ph: "ph3", title: "Paint the front door + shutters", cost: 90, value: 1200, hrs: 6, cat: "curb", why: "One quart of paint. Pick the color against the roof, not against Pinterest." },
  { id: "m305", ph: "ph3", title: "New house numbers, mailbox, porch light, kick plate", cost: 300, value: 1500, hrs: 4, cat: "curb", why: "Cheap jewelry for the front of the house. Buy all four in one finish." },
  { id: "m306", ph: "ph3", title: "Stone veneer accent on the front elevation", cost: 3200, value: 5500, hrs: 30, cat: "curb", roi: "Reported ~200%+", why: "Only if your facade is flat and boring. Skip it if the front already has texture or interest." },
  { id: "m307", ph: "ph3", title: "Minor kitchen refresh — hardware, paint, fixture", cost: 1400, value: 2600, hrs: 30, cat: "interior", roi: "Minor remodel reported ~95–115%; full remodels return far less", why: "Cabinet paint, new pulls, one good faucet, updated light. Do NOT gut this kitchen — major remodels are near the bottom of every return ranking." },
  { id: "m308", ph: "ph3", title: "Update lighting + all switch plates", cost: 600, value: 1400, hrs: 12, cat: "interior", why: "Dated fixtures date the whole house. Matched warm bulbs at 2700K in every room — mismatched color temperature is the most common thing that makes listing photos look bad." },
  { id: "m309", ph: "ph3", title: "Reseed / patch the lawn", cost: 200, value: 1500, hrs: 8, cat: "yard", lead: 10, why: "LEAD TIME: grass needs a full season to fill in. Seed now for a lawn that peaks at listing." },
  { id: "m310", ph: "ph3", title: "Define bed edges, plant perennials", cost: 500, value: 2000, hrs: 20, cat: "yard", lead: 12, why: "A crisp cut edge does more than expensive plants. Plants need time to look established." },
  { id: "m311", ph: "ph3", title: "Trim trees off the roof and siding", cost: 600, value: 1200, hrs: 6, cat: "yard", why: "Branch contact is both an inspection item and a squirrel-and-roof problem." },
  { id: "m312", ph: "ph3", title: "Low-voltage path + facade lighting", cost: 350, value: 700, hrs: 8, cat: "curb", roi: "Reported ~60% — do it for evening showings, not for the return", why: "The honest one on this list: it doesn't pay back on paper, but it makes twilight photos and evening showings dramatically better." },

  // ---- Phase 4 : Stage & List --------------------------------------------
  { id: "m401", ph: "ph4", title: "Interior paint, neutral, every room", cost: 1800, value: 3500, hrs: 60, cat: "interior", roi: "Reported ~105%+ when the work is genuinely clean", decays: true, why: "The highest-impact interior dollar. Clean edges matter more than color — a sloppy line reads worse than dated paint." },
  { id: "m402", ph: "ph4", title: "Professional carpet + upholstery extraction", cost: 550, value: 2500, hrs: 4, cat: "cats", decays: true, why: "Hot-water extraction with an enzyme treatment, not a rental machine. This is where three cats' worth of evidence lives." },
  { id: "m403", ph: "ph4", title: "HVAC duct cleaning + new filter", cost: 450, value: 1200, hrs: 4, cat: "cats", decays: true, why: "Pet allergens settle into ductwork and then get redistributed into every room every time the system runs." },
  { id: "m404", ph: "ph4", title: "The Nose Test — bring in someone with no pets", cost: 0, value: 3000, hrs: 1, cat: "cats", decays: true, why: "You are nose-blind to your own house. This is not optional. Ask a friend who doesn't own animals to walk through and be brutally honest. Odor is the number one deal-killer for pet households." },
  { id: "m405", ph: "ph4", title: "Fresh mulch in every bed", cost: 350, value: 1800, hrs: 10, cat: "yard", decays: true, roi: "Basic lawn care and mulch report among the highest returns per dollar in landscaping", decaysNote: "Fades in ~8 weeks", why: "Do this 1–2 weeks before photos. Not a day earlier." },
  { id: "m406", ph: "ph4", title: "Deep clean: windows inside and out", cost: 250, value: 1200, hrs: 12, cat: "clean", decays: true, why: "Clean glass changes how bright every listing photo looks." },
  { id: "m407", ph: "ph4", title: "Whole-house deep clean (hire it out)", cost: 600, value: 2000, hrs: 2, cat: "clean", decays: true, why: "Do not do this one yourself. You've been living in it; you will miss things a stranger won't." },
  { id: "m408", ph: "ph4", title: "Cat relocation plan for showings", cost: 0, value: 2000, hrs: 2, cat: "cats", why: "Cats and all their gear off the property for every showing. Have the crates, the destination and the 30-minute drill worked out in advance — you will get same-day showing requests." },
  { id: "m409", ph: "ph4", title: "Stage: rent or borrow what's missing", cost: 900, value: 4000, hrs: 12, cat: "clean", decays: true, why: "You've removed 30% of your stuff. Some rooms will now read as empty rather than spacious." },
  { id: "m410", ph: "ph4", title: "Professional photos (+ twilight set)", cost: 400, value: 5000, hrs: 4, cat: "clean", decays: true, why: "The listing photo is the only thing most buyers ever see. Never let an agent shoot it on a phone." },
];

/* ---------------------------------------------------------------------------
 * CATS — three cats, two floors. Layered defense, ordered by leverage.
 * ------------------------------------------------------------------------- */
const CAT_PLAN = [
  { layer: "1. Source",   title: "Brush before it sheds",
    detail: "Undercoat rake or deshedding tool, 5 minutes per cat, 3× a week, done on the porch. This is the highest-leverage thing on the list — hair caught here never has to be cleaned up anywhere else. Add an omega-3 supplement; a sudden increase in shedding is worth a vet conversation, since it can signal stress or a health issue.",
    win: "Cuts loose hair at the source" },
  { layer: "2. Capture",  title: "Give the hair somewhere to land",
    detail: "Washable throws on the three spots the cats actually sleep, plus washable covers on cat beds. This concentrates the large majority of shed hair onto objects you can put in a washing machine. Wash weekly, hot. Cheapest, least glamorous, most effective intervention available.",
    win: "Turns a cleaning problem into a laundry problem" },
  { layer: "3. Floors",   title: "Daily robots, weekly deep",
    detail: "One robot per floor — carrying one up and down stairs means it stops happening by week three. Choose anti-tangle rubber brushrolls over bristles. Empty the bin and cut hair off the rollers weekly, or it quietly stops picking anything up. Stairs are hand-work; nothing automates stairs well.",
    win: "Hair never gets ground into fiber" },
  { layer: "4. Air",      title: "Filter what's airborne",
    detail: "HEPA purifiers sized for 4–5 air changes per hour in the rooms where cats spend time, plus one near the litter area. On the HVAC side: MERV 11–13 pleated filter, changed monthly with pets — but check your blower can handle 13 first, and make sure the filter actually seals in its slot. Gaps let air bypass the media entirely.",
    win: "Handles dander, which is the allergy trigger" },
  { layer: "5. Litter",   title: "Four boxes, three cats",
    detail: "The n+1 rule. Large uncovered boxes, a real trapping mat under each, scooped daily and fully changed weekly. Put a purifier near the box cluster. This layer is about odor, and odor is the layer that decides your sale.",
    win: "Kills the #1 deal-breaker at the source" },
  { layer: "6. Evidence", title: "The pre-listing reset",
    detail: "Six to eight weeks before listing: professional hot-water extraction with enzyme treatment on carpet and upholstery, duct cleaning, fresh filters, and replace the textiles too far gone to save. Then the Nose Test — a friend with no pets, walking through, being honest. Never use candles or air fresheners to cover: buyers read a masked smell as something being hidden, which is worse than the smell.",
    win: "Removes what a buyer's nose is looking for" },
];

/* ---------------------------------------------------------------------------
 * FLIES — living next to horses.
 *
 * The hard constraint: the manure is not on your property. Source control is
 * the single biggest lever in fly management and you don't own it. So the
 * strategy is interception, exclusion, and a good relationship with a neighbor.
 * ------------------------------------------------------------------------- */
const FLY_PLAN = [
  { when: "Late winter", title: "Start before you see a single fly",
    detail: "Begin control before daytime temperatures consistently reach 60°F. Fly development accelerates hard past that line, and everything is easier before the first generation hatches than after.", key: true },
  { when: "Early spring", title: "First fly predator release",
    detail: "Parasitic wasps that lay eggs in fly pupae, killing them before they hatch. Harmless to cats, kids, horses and bees — they don't sting or bite. Quantity is keyed to the number of large animals nearby, roughly 500–1,000 per horse, which means your effective dose depends on the neighbor's herd, not your house." },
  { when: "Every 3–4 weeks, warm months", title: "Re-release, without fail",
    detail: "This is where most people fail. Pest flies reproduce roughly nine times faster than the predators do, so a single release is nearly worthless — the schedule IS the treatment. Put it in the app and never skip it." },
  { when: "Spring through fall", title: "Trap placement, done right",
    detail: "Odor-baited traps for house flies, sticky and visual traps for biting stable flies. Hang them AWAY from the house and patio, at least 4 feet up, spaced 50–100 feet apart along the property line nearest the horses. The entire point is to pull flies away from where you live — a stink trap by the back door is worse than no trap." },
  { when: "Ongoing", title: "Exclusion — your cheapest win",
    detail: "Intact screens on every window, weatherstripping and sweeps on every exterior door, and a household rule about doors. Add a box fan or ceiling fan on the patio: flies are weak fliers and moving air keeps them off you without a single chemical." },
  { when: "Monthly, warm months", title: "Kill your own breeding sites",
    detail: "You can't manage the neighbor's manure but you can eliminate every wet organic site on your side: gutter sludge, hose puddles, the base of the trash cans, compost, pet waste, forgotten buckets. A surprising share of 'their' flies are actually yours." },
  { when: "Once, early", title: "The neighbor conversation",
    detail: "Worth more than everything above combined. Manure management, dragging pastures, and predator releases at the source are what actually collapse a fly population. Offer to split the cost of predators for their property — it's inexpensive, it's genuinely neighborly, and it treats the problem where it's being made.", key: true },
];

/* ---------------------------------------------------------------------------
 * SMART — DIY, local-first, and deliberately PORTABLE.
 *
 * You're selling. Buy things you can unplug and take with you. Avoid anything
 * hardwired or proprietary-cloud that becomes a fixture — and be honest that
 * smart home gear rarely shows up in an appraisal. Its value here is that it
 * automates the maintenance system and prevents disasters.
 * ------------------------------------------------------------------------- */
const SMART = [
  { id: "s1", tier: "Foundation", title: "Home Assistant box", cost: "$100–180", diff: 2,
    solves: "Everything below talks to this. Local, no subscription, no cloud account.",
    detail: "Home Assistant Green, or HA OS on a mini PC or Raspberry Pi you already have. Add a Zigbee coordinator stick (~$30) and you can run dozens of cheap battery sensors on your own network. All of it comes with you when you move." },
  { id: "s2", tier: "Foundation", title: "Kitchen wall tablet", cost: "$80–150", diff: 1,
    solves: "The system that sticks needs to be visible without anyone opening an app.",
    detail: "Any cheap tablet, wall-mounted or on a stand where the family already gathers, running this dashboard full-screen. The single most important piece of hardware here. A chore system living on one parent's phone makes that parent the manager — and managing is more work than doing." },
  { id: "s3", tier: "Cat hair", title: "Two robot vacuums", cost: "$250–600", diff: 1,
    solves: "Daily floor hair on both stories.",
    detail: "One per floor. Rubber anti-tangle brushroll, not bristles. Schedule them for mid-morning when the house is empty. In HA you can make them run automatically on a 'nobody home' trigger and skip when someone's asleep." },
  { id: "s4", tier: "Cat hair", title: "PM2.5 air quality sensor", cost: "$35", diff: 3,
    solves: "Makes the invisible visible — and motivation follows measurement.",
    detail: "An ESP32 plus a PMS5003 particulate sensor, flashed with ESPHome (YAML config, no C++). Graph it in HA. Watch the spike when someone brushes a cat indoors, or when the robot runs. Auto-trigger the air purifiers above a threshold. Roughly $35 and an afternoon." },
  { id: "s5", tier: "Flies", title: "Door contact sensors", cost: "$60", diff: 1,
    solves: "Flies come in through held-open doors. Every time.",
    detail: "Zigbee contact sensors (~$12 each) on the doors to the yard. Automation: if a door is open more than 60 seconds, announce it on the nearest speaker. Non-nagging, instantly effective, and it trains the kids without a parent having to say anything." },
  { id: "s6", tier: "Disaster", title: "Water leak sensors", cost: "$90", diff: 1,
    solves: "A burst supply line during your sale year.",
    detail: "Under every sink, behind both toilets on the main level, under the water heater, behind the washer. Ten to fifteen dollars each. Push alert to every phone. The cheapest insurance in this entire document." },
  { id: "s7", tier: "Cats", title: "Litter box counter", cost: "$36", diff: 2,
    solves: "Scoop reminders that fire on use, not on a fixed schedule — plus early warning on cat health.",
    detail: "A motion sensor per box, counted in HA. Tells you when boxes actually need attention. The real payoff is health: a sharp change in one cat's visit frequency is an early urinary-issue signal, and urinary issues are exactly how a house ends up with a permanent odor problem." },
  { id: "s8", tier: "Comfort", title: "Smart thermostat + filter tracking", cost: "$130", diff: 1,
    solves: "Filter reminders based on actual runtime hours, not the calendar.",
    detail: "Track blower hours in HA and have it tell you when the filter is genuinely spent. With three cats that will be sooner than the box claims." },
  { id: "s9", tier: "Selling", title: "Exterior lights on schedule", cost: "$50", diff: 1,
    solves: "Evening showings and empty-house security.",
    detail: "Smart bulbs or a smart plug on path lighting, on an astronomical-sunset schedule. A lit house at a 6pm winter showing photographs and feels completely different from a dark one." },
  { id: "s10", tier: "System", title: "The Huddle reminder", cost: "$0", diff: 1,
    solves: "The keystone habit — the one that keeps every other habit alive.",
    detail: "A single weekly automation: at Sunday dinner time, the tablet flips to the Huddle screen and the speakers announce it. One notification, one time a week. Do not add more notifications than this — a system that nags gets ignored, then gets turned off." },
];
