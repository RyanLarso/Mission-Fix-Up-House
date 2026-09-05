/* Mission Control — app logic
 * Design rules encoded here, in order of importance:
 *  1. Due dates ROLL from when you last did a thing, never from a fixed
 *     calendar. Missing a week slides the schedule; it never creates a debt
 *     pile, because a wall of red is how these systems die.
 *  2. Assignment is computed, not decided by a person. Nobody has to nag.
 *  3. Streaks measure weeks at 70%+, not perfect days. Designed to survive a
 *     bad week, because there will be bad weeks.
 */
(function () {
  "use strict";

  /* ===================== dates ===================== */
  const DAY = 86400000;
  const iso = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  };
  const today = () => iso(new Date());
  const parse = (s) => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
  const addDays = (s, n) => iso(new Date(parse(s).getTime() + n * DAY));
  /* Monday-anchored week id, so a week doesn't roll over mid-weekend */
  const weekId = (s) => {
    const d = parse(s), dow = (d.getDay() + 6) % 7;
    return iso(new Date(d.getTime() - dow * DAY));
  };
  const fmtMoney = (n) =>
    n >= 1000 ? "$" + (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k" : "$" + Math.round(n);

  /* ===================== state ===================== */
  const BLANK = () => ({
    settings: {
      listTarget: HOUSE.listTarget,
      zoneStart: weekId(today()),
      huddleDay: 0, // Sunday
      houseName: HOUSE.name,
    },
    people: JSON.parse(JSON.stringify(PEOPLE)),
    tasks: {},     // id -> {lastDone, prevDone, assignee}
    projects: {},  // id -> {status, cost, note}
    log: [],       // {t, p, d} capped
  });

  let state = BLANK();
  let store = null;          // storage adapter
  let view = "today";
  let expanded = {};         // row id -> bool (mobile "why" toggles)

  const LS_KEY = "mission-control-v1";

  /* -- storage adapter: localStorage baseline, shared db when granted ------ */
  const LocalStore = {
    kind: "local",
    async init() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) state = Object.assign(BLANK(), JSON.parse(raw));
      } catch (e) { /* private mode, corrupted value: start clean */ }
    },
    async push() {
      try { localStorage.setItem(LS_KEY, JSON.stringify(state)); }
      catch (e) { /* quota or blocked storage — the session still works */ }
    },
    watch() {},
  };

  function DbStore(db) {
    const DOCS = {
      settings: db.doc("house/settings"),
      people:   db.doc("house/people"),
      tasks:    db.doc("house/tasks"),
      projects: db.doc("house/projects"),
      log:      db.doc("house/log"),
    };
    /* Split across documents so two people checking things off at the same
       time don't clobber each other. Writes are last-writer-wins, so the
       smaller the document, the smaller the collision surface. */
    return {
      kind: "shared",
      async init() {
        await LocalStore.init(); // instant paint from cache, then reconcile
        const snaps = await Promise.all(
          Object.values(DOCS).map((d) => d.get().catch(() => null))
        );
        const keys = Object.keys(DOCS);
        let any = false;
        snaps.forEach((s, i) => {
          if (s && s.exists) {
            const body = s.data() || {};
            const k = keys[i];
            if (k === "people") state.people = body.list || state.people;
            else if (k === "log") state.log = body.entries || [];
            else state[k] = Object.assign(state[k] || {}, body);
            any = true;
          }
        });
        if (!any) await this.push(); // first run seeds the shared store
      },
      async push(only) {
        const jobs = [];
        const want = only || ["settings", "people", "tasks", "projects", "log"];
        if (want.includes("settings")) jobs.push(DOCS.settings.set(state.settings));
        if (want.includes("people"))   jobs.push(DOCS.people.set({ list: state.people }));
        if (want.includes("tasks"))    jobs.push(DOCS.tasks.set(state.tasks));
        if (want.includes("projects")) jobs.push(DOCS.projects.set(state.projects));
        if (want.includes("log"))      jobs.push(DOCS.log.set({ entries: state.log.slice(-1200) }));
        LocalStore.push();
        await Promise.all(jobs.map((p) => p.catch(() => {})));
      },
      watch() {
        const bind = (key, ref, apply) =>
          ref.onSnapshot((s) => {
            if (!s.exists || s.metadata.hasPendingWrites) return;
            apply(s.data() || {});
            LocalStore.push();
            render();
          }, () => {});
        bind("settings", DOCS.settings, (b) => { state.settings = Object.assign(state.settings, b); });
        bind("people",   DOCS.people,   (b) => { if (b.list) state.people = b.list; });
        bind("tasks",    DOCS.tasks,    (b) => { state.tasks = b; });
        bind("projects", DOCS.projects, (b) => { state.projects = b; });
        bind("log",      DOCS.log,      (b) => { state.log = b.entries || []; });
      },
    };
  }

  let pushTimer = null;
  function save(scope) {
    /* Debounced: five people tapping through a Sunday huddle shouldn't
       generate fifty writes. */
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => store && store.push(scope), 250);
    LocalStore.push();
  }

  /* ===================== derived ===================== */
  const RIDX = {};
  RHYTHM.forEach((t, i) => { RIDX[t.id] = i; });

  const ts = (id) => (state.tasks[id] = state.tasks[id] || {});
  const ps = (id) => (state.projects[id] = state.projects[id] || { status: "todo" });

  function taskStatus(t) {
    const st = ts(t.id);
    if (!st.lastDone) return { code: "new", days: 0, label: "not started" };
    const since = daysBetween(st.lastDone, today());
    const over = since - t.cadence;
    if (over < 0) return { code: "ok", days: -over, label: `due in ${-over}d` };
    if (over === 0) return { code: "due", days: 0, label: "due today" };
    return { code: over > t.cadence ? "late" : "due", days: over, label: `${over}d over` };
  }

  const isDue = (t) => {
    const s = taskStatus(t);
    return s.code === "new" || s.code === "due" || s.code === "late";
  };

  function currentZone() {
    const wk = Math.max(0, Math.round((parse(weekId(today())) - parse(state.settings.zoneStart)) / (7 * DAY)));
    return ZONES[wk % ZONES.length];
  }

  function eligible(t) {
    const tier = t.tier || 1;
    const list = state.people.filter((p) => (p.tier || 1) >= tier);
    return list.length ? list : state.people;
  }

  /* Deterministic weekly rotation — no stored assignment, no arguments about
     whose turn it is. The app decides; that is the whole point. */
  function assignedTo(t) {
    const manual = ts(t.id).assignee;
    if (manual) {
      const p = state.people.find((x) => x.id === manual);
      if (p) return p;
    }
    const pool = eligible(t);
    const wk = Math.round(parse(weekId(today())).getTime() / (7 * DAY));
    return pool[(wk + (RIDX[t.id] || 0)) % pool.length];
  }

  function logDone(taskId, personId) {
    state.log.push({ t: taskId, p: personId || null, d: today() });
    if (state.log.length > 1200) state.log = state.log.slice(-1200);
  }

  /* ---- the Floor: done-ness, weekly score, forgiving streak ---- */
  function floorDone(f) {
    const period = f.per === "day" ? today() : weekId(today());
    return state.log.some((e) =>
      e.t === f.id && (f.per === "day" ? e.d === period : weekId(e.d) === period)
    );
  }
  const FLOOR_TARGET = FLOOR.reduce((n, f) => n + (f.per === "day" ? 7 : 1), 0);

  function weekScore(wid) {
    let hit = 0;
    for (const f of FLOOR) {
      const days = new Set(
        state.log.filter((e) => e.t === f.id && weekId(e.d) === wid).map((e) => e.d)
      );
      hit += f.per === "day" ? Math.min(days.size, 7) : Math.min(days.size, 1);
    }
    return hit / FLOOR_TARGET;
  }

  function streak() {
    /* Counts BACK from last week, so the week in progress never breaks it. */
    let n = 0, wid = weekId(addDays(today(), -7));
    while (n < 104) {
      if (weekScore(wid) >= 0.7) { n++; wid = weekId(addDays(wid, -7)); }
      else break;
    }
    return n;
  }

  const daysToList = () => Math.max(0, daysBetween(today(), state.settings.listTarget));

  function missionStats() {
    let done = 0, spent = 0, budget = 0, value = 0, hrs = 0, left = 0;
    for (const p of PROJECTS) {
      const st = ps(p.id);
      const cost = st.cost != null ? st.cost : p.cost;
      budget += cost;
      if (st.status === "done") { done++; spent += cost; value += p.value || 0; }
      else { hrs += p.hrs || 0; left++; }
    }
    return { done, total: PROJECTS.length, spent, budget, value, hrs, left };
  }

  /* ===================== rendering ===================== */
  const el = (h) => { const d = document.createElement("div"); d.innerHTML = h.trim(); return d.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function avatar(p, cls) {
    if (!p) return `<button class="who unset" data-act="cycle" title="Assign">?</button>`;
    return `<button class="${cls || "who"}" style="background:${esc(p.color)}" title="${esc(p.name)}" data-act="cycle">${esc(p.short)}</button>`;
  }

  function taskRow(t, opts) {
    const st = taskStatus(t), who = assignedTo(t), done = st.code === "ok";
    const zone = t.zone === "rotating" ? currentZone().name : null;
    const pillCls = st.code === "late" ? "late" : st.code === "ok" ? "ok" : "due";
    return `
      <div class="row ${done ? "done" : ""}" data-task="${t.id}">
        <button class="check" aria-pressed="${done}" data-act="toggle" aria-label="Mark ${esc(t.title)} done">✓</button>
        <div class="row-body">
          <div class="row-title">${esc(t.title)}${zone ? ` <span style="color:var(--teal)">— ${esc(zone)}</span>` : ""}</div>
          <div class="row-sub">
            <span class="pill ${t.tag === "cats" || t.tag === "flies" ? t.tag : ""}">${esc(t.tag)}</span>
            <span style="margin-left:6px">every ${t.cadence}d · ${t.min} min</span>
            ${opts && opts.hideStatus ? "" : ` · <span class="pill ${pillCls}">${esc(st.label)}</span>`}
          </div>
          ${t.why ? `<div class="row-why ${expanded[t.id] ? "show" : ""}" data-act="why">${esc(t.why)}</div>` : ""}
        </div>
        <div class="row-side">${avatar(who)}</div>
      </div>`;
  }

  /* ---------- TODAY ---------- */
  function viewToday() {
    const due = RHYTHM.filter(isDue);
    const zone = currentZone();
    const sc = weekScore(weekId(today())), str = streak();
    const perPerson = {};
    due.forEach((t, i) => {
      const p = assignedTo(t);
      if (p) perPerson[p.id] = (perPerson[p.id] || 0) + t.min;
    });

    return `
      <div class="section">
        <div class="floor">
          <div class="floor-head">
            <h3>The Floor</h3>
            <span class="pill ${sc >= 0.7 ? "ok" : "due"}">${Math.round(sc * 100)}% this week</span>
            <span class="score">${str} week${str === 1 ? "" : "s"} held</span>
          </div>
          <p class="floor-note">The five things that keep the house from losing ground. On a bad week
            — sick kid, work crunch, holidays — do only these and you have not fallen behind.
            A streak counts any week you hit 70%, not a perfect one.</p>
          <div class="floor-list">
            ${FLOOR.map((f) => {
              const d = floorDone(f);
              return `<div class="row ${d ? "done" : ""}" data-floor="${f.id}">
                <button class="check" aria-pressed="${d}" data-act="floor" aria-label="Mark ${esc(f.title)} done">✓</button>
                <div class="row-body">
                  <div class="row-title">${esc(f.title)}</div>
                  <div class="row-sub">${esc(f.detail)}</div>
                </div>
                <div class="row-side"><span class="pill">${f.per === "day" ? "daily" : "weekly"}</span></div>
              </div>`;
            }).join("")}
          </div>
        </div>
      </div>

      <div class="section">
        <div class="h-row">
          <h2>Today's board</h2>
          <span class="meta">${due.length} due · zone of the week: ${esc(zone.name)}</span>
        </div>
        <div class="people">
          ${state.people.map((p) => `
            <div class="person">
              <div class="av" style="background:${esc(p.color)}">${esc(p.short)}</div>
              <div style="min-width:0">
                <div class="nm">${esc(p.name)}</div>
                <div class="ct">${perPerson[p.id] ? `${perPerson[p.id]} min queued` : "clear"}</div>
              </div>
            </div>`).join("")}
        </div>
      </div>

      <div class="section">
        ${due.length
          ? `<div class="floor-list">${due.map((t) => taskRow(t)).join("")}</div>`
          : `<div class="panel empty">Nothing due. The rhythm is holding — go do a Mission block instead.</div>`}
      </div>

      <div class="section">
        <div class="note"><b>Zone this week: ${esc(zone.name)}.</b> ${esc(zone.note)}
          Six zones on a six-week loop — one deep pass a week and the whole house gets real
          attention every month and a half, without anyone ever facing a whole-house clean.</div>
      </div>`;
  }

  /* ---------- RHYTHM ---------- */
  function viewRhythm() {
    const groups = [
      { k: "Daily and near-daily", f: (t) => t.cadence <= 3 },
      { k: "Weekly", f: (t) => t.cadence > 3 && t.cadence <= 10 },
      { k: "Every few weeks", f: (t) => t.cadence > 10 && t.cadence <= 60 },
      { k: "Seasonal and annual", f: (t) => t.cadence > 60 },
    ];
    return `
      <div class="section">
        <div class="h-row"><h2>The Rhythm</h2>
          <span class="meta">${RHYTHM.length} recurring jobs · ${RHYTHM.filter(isDue).length} due now</span></div>
        <p class="lede">Everything that keeps the house steady, forever. Due dates roll forward from
          the last time a job was actually done — miss a week and it slides, it never turns into a
          backlog of red. Tap any row to see why it earns its place.</p>
      </div>
      ${groups.map((g) => {
        const list = RHYTHM.filter(g.f);
        if (!list.length) return "";
        return `<div class="section">
          <div class="eyebrow">${esc(g.k)}</div>
          <div class="floor-list">${list.map((t) => taskRow(t)).join("")}</div>
        </div>`;
      }).join("")}
      <div class="section">
        <div class="eyebrow">Zone rotation</div>
        <div class="panel scroll-x"><table class="grid">
          <thead><tr><th>Week</th><th>Zone</th><th>Floor</th><th>What makes it different</th></tr></thead>
          <tbody>${ZONES.map((z, n) => {
            const cur = currentZone().id === z.id;
            return `<tr${cur ? ' style="background:var(--teal-soft)"' : ""}>
              <td class="num">${n + 1}${cur ? " ←" : ""}</td>
              <td><b>${esc(z.name)}</b></td><td class="num">${z.floor}</td>
              <td style="color:var(--ink-2)">${esc(z.note)}</td></tr>`;
          }).join("")}</tbody>
        </table></div>
      </div>`;
  }

  /* ---------- MISSION ---------- */
  function viewMission() {
    const s = missionStats(), d = daysToList();
    return `
      <div class="section">
        <div class="h-row"><h2>The Mission</h2>
          <span class="meta">target listing ${esc(state.settings.listTarget)}</span></div>
        <p class="lede">The finite clock. ${PROJECTS.length} projects across five phases, ordered so that
          things needing lead time start early and things that decay happen last.</p>
      </div>

      <div class="section">
        <div class="stats">
          <div class="stat"><div class="k">Days to list</div><div class="v">${d}</div>
            <div class="n">${Math.floor(d / 7)} weekends left</div></div>
          <div class="stat"><div class="k">Projects done</div><div class="v">${s.done}<span style="color:var(--ink-3);font-size:15px">/${s.total}</span></div>
            <div class="n">${s.left} remaining</div></div>
          <div class="stat"><div class="k">Spent</div><div class="v">${fmtMoney(s.spent)}</div>
            <div class="n">of ${fmtMoney(s.budget)} planned</div></div>
          <div class="stat"><div class="k">Est. value added</div><div class="v" style="color:var(--good)">${fmtMoney(s.value)}</div>
            <div class="n">directional, not a promise</div></div>
          <div class="stat"><div class="k">Work left</div><div class="v">${s.hrs}<span style="color:var(--ink-3);font-size:15px">h</span></div>
            <div class="n">≈ ${Math.ceil(s.hrs / 3)} three-hour blocks</div></div>
        </div>
        <div style="margin-top:10px" class="bar amber"><i style="width:${Math.round((s.done / s.total) * 100)}%"></i></div>
      </div>

      ${(() => {
        /* The most useful thing this screen can tell you is whether the plan
           fits in the time you actually have. Most project lists don't, and
           people find out in month ten. */
        const wks = Math.max(1, Math.floor(d / 7));
        const need = s.hrs / wks;
        const tight = need > 6, ok = need <= 3.5;
        return `<div class="section">
          <div class="note" style="border-left-color:var(--${tight ? "risk" : ok ? "good" : "warn"})">
            <b>Capacity check: ${need.toFixed(1)} hours a week for ${wks} weeks.</b>
            ${ok
              ? "That fits inside a single protected Saturday block. This plan is realistic — hold the weekly block and you'll land it."
              : tight
              ? `That's roughly ${Math.ceil(need / 3)} three-hour blocks every week, on top of running the house with five people in it. This list as written does not fit. Before it becomes a month-ten crisis, do one of three things: push the listing date, hire out the biggest hour-sinks (interior paint is 60 hours and painters are cheap relative to that), or cut the optional Phase 3 items — the stone veneer and path lighting are the two most cuttable things on the list.`
              : "That's about one solid weekend block a week, which is achievable but leaves no slack. Protect the block, and hire out interior paint if the schedule slips."}
          </div>
        </div>`;
      })()}

      <div class="section">
        <div class="note"><b>Read the ROI numbers as a ranking, not a promise.</b> They come from
          national cost-versus-value style reporting, they move year to year and market to market,
          and the same reports note that sellers often recoup well under what the averages suggest.
          What reliably works on a twelve-month clock is condition and presentation, not renovation.
          A useful guardrail: no single project should exceed about 30% of the home's value.</div>
      </div>

      ${PHASES.map((ph, pi) => {
        const list = PROJECTS.filter((p) => p.ph === ph.id);
        const done = list.filter((p) => ps(p.id).status === "done").length;
        return `
        <div class="phase ${ph.hue}">
          <div class="spine"><div class="num">${ph.n}</div>${pi < PHASES.length - 1 ? '<div class="line"></div>' : ""}</div>
          <div class="phase-body">
            <div class="phase-head">
              <h3>${esc(ph.name)}</h3>
              <span class="win">${esc(ph.window)}</span>
              <span class="pill ${done === list.length ? "ok" : ""}" style="margin-left:auto">${done}/${list.length}</span>
            </div>
            <p class="phase-thesis">${esc(ph.thesis)}</p>
            <div class="proj-list">
              ${list.map((p) => {
                const st = ps(p.id), isDone = st.status === "done";
                const cost = st.cost != null ? st.cost : p.cost;
                return `<div class="proj ${isDone ? "done" : ""}" data-proj="${p.id}">
                  <button class="check" aria-pressed="${isDone}" data-act="proj" aria-label="Mark ${esc(p.title)} done">✓</button>
                  <div class="proj-main">
                    <div class="proj-title">${esc(p.title)}
                      ${p.decays ? '<span class="pill due" style="margin-left:6px">do last</span>' : ""}
                      ${p.lead ? `<span class="pill mission" style="margin-left:6px">${p.lead}wk lead</span>` : ""}</div>
                    <div class="proj-why ${expanded[p.id] ? "show" : ""}" data-act="why">${esc(p.why)}</div>
                    ${p.roi ? `<div class="proj-roi">${esc(p.roi)}</div>` : ""}
                  </div>
                  <div class="proj-nums">
                    <div class="c">${cost ? fmtMoney(cost) : "free"}</div>
                    <div class="h">${p.hrs}h</div>
                  </div>
                </div>`;
              }).join("")}
            </div>
          </div>
        </div>`;
      }).join("")}`;
  }

  /* ---------- CATS ---------- */
  function viewCats() {
    const catTasks = RHYTHM.filter((t) => t.tag === "cats");
    return `
      <div class="section">
        <div class="h-row"><h2>Three Cats, Two Floors</h2><span class="meta">layered defense</span></div>
        <p class="lede">Six layers, ordered by leverage. The top of the list is worth more than the
          bottom: hair you catch on a brush never has to be cleaned off anything. And the last layer
          is the one that decides your sale — for a household with pets, odor is the single biggest
          deal-killer buyers report.</p>
      </div>
      <div class="section layers">
        ${CAT_PLAN.map((c, n) => `
          <div class="layer">
            <div class="lh">
              <span class="lnum">${esc(c.layer.split(".")[0].padStart(2, "0"))}</span>
              <h4>${esc(c.title)}</h4>
              <span class="win">${esc(c.win)}</span>
            </div>
            <p>${esc(c.detail)}</p>
          </div>`).join("")}
      </div>
      <div class="section">
        <div class="eyebrow">The recurring jobs this creates</div>
        <div class="floor-list">${catTasks.map((t) => taskRow(t)).join("")}</div>
      </div>
      <div class="section">
        <div class="note"><b>One warning that matters more than everything above.</b> You cannot smell
          your own house. Nose-blindness is real and total, and it is why sellers get blindsided.
          Before you list, have someone who owns no animals walk through and tell you the truth.
          And never mask: a buyer who smells air freshener assumes something is being hidden, which
          costs you more than the original smell would have.</div>
      </div>`;
  }

  /* ---------- FLIES ---------- */
  function viewFlies() {
    const flyTasks = RHYTHM.filter((t) => t.tag === "flies");
    return `
      <div class="section">
        <div class="h-row"><h2>The Fly Campaign</h2><span class="meta">horse property next door</span></div>
        <p class="lede">The hard constraint first: the manure is not on your land. Source control is by
          far the biggest lever in fly management, and you do not own it. So the strategy is
          interception, exclusion, and one genuinely worthwhile conversation with a neighbor.</p>
      </div>
      <div class="section layers">
        ${FLY_PLAN.map((f) => `
          <div class="layer flies ${f.key ? "key" : ""}">
            <div class="lh">
              <span class="lnum">${esc(f.when)}</span>
              <h4>${esc(f.title)}</h4>
              ${f.key ? '<span class="win">highest leverage</span>' : ""}
            </div>
            <p>${esc(f.detail)}</p>
          </div>`).join("")}
      </div>
      <div class="section">
        <div class="eyebrow">The recurring jobs this creates</div>
        <div class="floor-list">${flyTasks.map((t) => taskRow(t)).join("")}</div>
      </div>`;
  }

  /* ---------- SMART ---------- */
  function viewSmart() {
    const tiers = [...new Set(SMART.map((s) => s.tier))];
    return `
      <div class="section">
        <div class="h-row"><h2>Homemade Smart Home</h2><span class="meta">local, cheap, and portable</span></div>
        <p class="lede">Every item here is chosen against a problem you actually have, and every item
          unplugs and moves with you. Nothing hardwired, nothing on a subscription, nothing that
          becomes a fixture you leave behind.</p>
      </div>
      <div class="section">
        <div class="note"><b>Be honest about what this does and doesn't do.</b> Smart home gear rarely
          shows up in an appraisal — do not expect it to raise your sale price. Its value here is
          different and better: it automates the maintenance system so it survives a busy week, it
          prevents the disasters that would wreck your sale year, and it makes your life easier
          right now. Then it comes with you.</div>
      </div>
      ${tiers.map((tier) => `
        <div class="section">
          <div class="eyebrow">${esc(tier)}</div>
          <div class="smart-grid">
            ${SMART.filter((s) => s.tier === tier).map((s) => `
              <div class="gadget">
                <div class="gh"><h4>${esc(s.title)}</h4><span class="cost">${esc(s.cost)}</span></div>
                <div class="solves">${esc(s.solves)}</div>
                <p>${esc(s.detail)}</p>
                <div class="gf">
                  <span class="pill">build effort</span>
                  <span class="diff">${[1, 2, 3].map((n) => `<i class="${n <= s.diff ? "on" : ""}"></i>`).join("")}</span>
                </div>
              </div>`).join("")}
          </div>
        </div>`).join("")}
      <div class="section">
        <div class="eyebrow">Suggested build order</div>
        <div class="panel scroll-x"><table class="grid">
          <thead><tr><th>Order</th><th>Build</th><th class="num">Cost</th><th>Why this one next</th></tr></thead>
          <tbody>
            <tr><td class="num">1</td><td><b>Leak sensors</b></td><td class="num">$90</td><td style="color:var(--ink-2)">Do this before anything else. Pure downside protection during the sale year, and it needs no hub.</td></tr>
            <tr><td class="num">2</td><td><b>Robot vacuums ×2</b></td><td class="num">$250–600</td><td style="color:var(--ink-2)">The single biggest daily quality-of-life change in the house.</td></tr>
            <tr><td class="num">3</td><td><b>Home Assistant + Zigbee stick</b></td><td class="num">$130–210</td><td style="color:var(--ink-2)">The hub everything else plugs into. A weekend to set up.</td></tr>
            <tr><td class="num">4</td><td><b>Wall tablet</b></td><td class="num">$80–150</td><td style="color:var(--ink-2)">Makes the system visible to five people instead of one. This is the piece that makes it stick.</td></tr>
            <tr><td class="num">5</td><td><b>Door + leak + litter sensors</b></td><td class="num">$100</td><td style="color:var(--ink-2)">Cheap Zigbee battery sensors, now that the hub exists.</td></tr>
            <tr><td class="num">6</td><td><b>ESPHome air quality sensor</b></td><td class="num">$35</td><td style="color:var(--ink-2)">The fun one. Save it for when the boring wins are already banked.</td></tr>
          </tbody>
        </table></div>
      </div>`;
  }

  /* ---------- HUDDLE ---------- */
  function viewHuddle() {
    const z = currentZone(), s = missionStats(), sc = weekScore(weekId(today()));
    const nextZone = ZONES[(ZONES.indexOf(z) + 1) % ZONES.length];
    return `
      <div class="section">
        <div class="h-row"><h2>The Sunday Huddle</h2><span class="meta">20 minutes · the keystone habit</span></div>
        <p class="lede">If you keep exactly one thing from this entire app, keep this. Twenty minutes,
          same time every week, anchored to a meal you already eat together. Habits stick when they
          are attached to something that already reliably happens — the anchor does the work that
          willpower otherwise has to.</p>
      </div>
      <div class="section panel panel-pad">
        <div class="huddle-step"><div class="t">0–3 min</div><div>
          <h4>Read the Floor out loud</h4>
          <p>Week just ended: <b>${Math.round(sc * 100)}%</b>. Say the number, don't editorialize. Nobody
            gets a lecture. The number is information, not a verdict.</p></div></div>
        <div class="huddle-step"><div class="t">3–7 min</div><div>
          <h4>Name what broke</h4>
          <p>One question only: what got in the way? If the same job fails three weeks running, the job
            is wrong, not the person. Cut it, shrink it, or move it to someone else.</p></div></div>
        <div class="huddle-step"><div class="t">7–10 min</div><div>
          <h4>Flip the zone</h4>
          <p>This week was <b>${esc(z.name)}</b>. Next up: <b>${esc(nextZone.name)}</b>. One deep pass, one
            zone, everything else stays on light duty.</p></div></div>
        <div class="huddle-step"><div class="t">10–16 min</div><div>
          <h4>Claim the Mission block</h4>
          <p>${s.left} projects left, roughly ${Math.ceil(s.hrs / 3)} three-hour blocks of work, and
            ${Math.floor(daysToList() / 7)} weeks until listing. Pick <em>one</em> project for this
            week's block and say out loud who is doing it and when. One is enough. One a week finishes
            this list.</p></div></div>
        <div class="huddle-step"><div class="t">16–20 min</div><div>
          <h4>Pay out and stop</h4>
          <p>Whatever the allowance or reward structure is, settle it here, in public, on time. Then
            close the app. A huddle that runs long stops happening — protect the twenty minutes by
            ending at twenty minutes.</p></div></div>
      </div>
      <div class="section">
        <div class="eyebrow">Why systems like this usually fail</div>
        <div class="layers">
          <div class="layer"><div class="lh"><h4>The setup cliff</h4></div>
            <p>A perfect chore chart gets built on a Saturday and dies in three weeks, because the
              effort all landed up front. This one ships filled in — nothing to configure before it
              starts working.</p></div>
          <div class="layer"><div class="lh"><h4>The manager trap</h4></div>
            <p>One parent becomes the assigner, and assigning is more work than doing. Resentment
              follows, then collapse. Here the rotation is computed and visible to everyone: the app
              assigns, so no person has to.</p></div>
          <div class="layer"><div class="lh"><h4>All-or-nothing collapse</h4></div>
            <p>Miss three days, everything turns red, abandon the whole thing. That's why due dates roll
              instead of accumulating, and why a streak survives at 70%. Design for your worst week,
              not your best — you will have both.</p></div>
          <div class="layer"><div class="lh"><h4>No visible win</h4></div>
            <p>Nothing ever tells you it's working. So: weeks held, projects closed, value added,
              blocks remaining. Progress you can point at during the huddle.</p></div>
        </div>
      </div>`;
  }

  /* ---------- SETTINGS ---------- */
  function viewSetup() {
    return `
      <div class="section">
        <div class="h-row"><h2>Household</h2>
          <span class="meta">${store && store.kind === "shared" ? "syncing across devices" : "saved on this device"}</span></div>
        <p class="lede">Put real names in. A chore board with "Kid 2" on it does not survive contact
          with an actual kid.</p>
      </div>
      <div class="section panel panel-pad">
        <div style="display:grid;gap:12px">
          ${state.people.map((p, i) => `
            <div style="display:flex;gap:10px;align-items:center">
              <div class="av" style="flex:none;width:34px;height:34px;border-radius:50%;background:${esc(p.color)};color:#fff;display:grid;place-items:center;font-family:var(--f-mono);font-size:12px;font-weight:600">${esc(p.short)}</div>
              <input data-person="${i}" data-k="name" value="${esc(p.name)}" placeholder="Name"
                style="flex:1;min-width:0;font:inherit;padding:8px 10px;border-radius:4px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">
              <input data-person="${i}" data-k="short" value="${esc(p.short)}" maxlength="3" placeholder="ID"
                style="width:64px;font-family:var(--f-mono);font-size:13px;padding:8px;border-radius:4px;border:1px solid var(--line);background:var(--surface);color:var(--ink);text-align:center">
              <select data-person="${i}" data-k="tier"
                style="font:inherit;font-size:13px;padding:8px;border-radius:4px;border:1px solid var(--line);background:var(--surface);color:var(--ink)">
                <option value="1"${p.tier === 1 ? " selected" : ""}>Little kid</option>
                <option value="2"${p.tier === 2 ? " selected" : ""}>Big kid</option>
                <option value="3"${p.tier === 3 ? " selected" : ""}>Grown-up</option>
              </select>
            </div>`).join("")}
        </div>
      </div>
      <div class="section">
        <div class="eyebrow">The clock</div>
        <div class="panel panel-pad" style="display:flex;gap:16px;flex-wrap:wrap">
          <div class="field"><label>Target listing date</label>
            <input type="date" id="set-target" value="${esc(state.settings.listTarget)}"></div>
          <div class="field"><label>Zone rotation started</label>
            <input type="date" id="set-zone" value="${esc(state.settings.zoneStart)}"></div>
        </div>
      </div>
      <div class="section">
        <div class="eyebrow">Your data</div>
        <div class="panel panel-pad">
          <p style="font-size:13px;color:var(--ink-2);margin-bottom:12px;max-width:70ch">
            ${store && store.kind === "shared"
              ? "This board is shared: everyone who opens the link sees the same state, live. Checking something off on the kitchen tablet updates every phone in the house."
              : "This board is stored in this browser only. Export a backup before clearing site data, or open it as a published link to sync across the whole family."}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn" id="btn-export">Export backup</button>
            <button class="btn" id="btn-import">Import backup</button>
            <button class="btn" id="btn-reset">Reset all progress</button>
          </div>
        </div>
      </div>`;
  }

  /* ===================== chrome ===================== */
  const TABS = [
    { id: "today",   label: "Today",   fn: viewToday },
    { id: "rhythm",  label: "Rhythm",  fn: viewRhythm },
    { id: "mission", label: "Mission", fn: viewMission },
    { id: "cats",    label: "Cats",    fn: viewCats },
    { id: "flies",   label: "Flies",   fn: viewFlies },
    { id: "smart",   label: "Smart",   fn: viewSmart },
    { id: "huddle",  label: "Huddle",  fn: viewHuddle },
    { id: "setup",   label: "Setup",   fn: viewSetup },
  ];

  function render() {
    const dueN = RHYTHM.filter(isDue).length;
    const d = daysToList();
    document.getElementById("tabs").innerHTML =
      `<div class="tabs-in">${TABS.map((t) => `
        <button class="tab" role="tab" aria-selected="${view === t.id}" data-tab="${t.id}">${t.label}${
          t.id === "today" && dueN ? `<span class="dot">${dueN}</span>` : ""
        }</button>`).join("")}</div>`;
    document.getElementById("countdown").innerHTML =
      `<b>${d}</b> days to list`;
    document.getElementById("sync").className = "sync" + (store && store.kind === "shared" ? " live" : "");
    document.getElementById("sync").textContent = store && store.kind === "shared" ? "shared" : "this device";
    const main = document.getElementById("main");
    main.innerHTML = (TABS.find((t) => t.id === view) || TABS[0]).fn();
    main.scrollTop = 0;
  }

  /* ===================== events ===================== */
  document.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { view = tab.dataset.tab; render(); window.scrollTo(0, 0); return; }

    const act = e.target.closest("[data-act]");
    if (!act) return;
    const kind = act.dataset.act;

    /* --- recurring task --- */
    const rowEl = act.closest("[data-task]");
    if (rowEl) {
      const t = RHYTHM.find((x) => x.id === rowEl.dataset.task);
      if (!t) return;
      if (kind === "toggle") {
        const st = ts(t.id);
        if (taskStatus(t).code === "ok") { st.lastDone = st.prevDone || null; }
        else {
          st.prevDone = st.lastDone || null;
          st.lastDone = today();
          logDone(t.id, (assignedTo(t) || {}).id);
        }
        save(); render(); return;
      }
      if (kind === "cycle") {
        const pool = eligible(t), cur = assignedTo(t);
        const idx = pool.findIndex((p) => p.id === (cur || {}).id);
        ts(t.id).assignee = pool[(idx + 1) % pool.length].id;
        save(["tasks"]); render(); return;
      }
      if (kind === "why") { expanded[t.id] = !expanded[t.id]; render(); return; }
    }

    /* --- floor item --- */
    const fEl = act.closest("[data-floor]");
    if (fEl && kind === "floor") {
      const f = FLOOR.find((x) => x.id === fEl.dataset.floor);
      if (!f) return;
      if (floorDone(f)) {
        const period = f.per === "day" ? today() : weekId(today());
        state.log = state.log.filter((en) =>
          !(en.t === f.id && (f.per === "day" ? en.d === period : weekId(en.d) === period)));
      } else logDone(f.id, null);
      save(["log"]); render(); return;
    }

    /* --- mission project --- */
    const pEl = act.closest("[data-proj]");
    if (pEl) {
      const p = PROJECTS.find((x) => x.id === pEl.dataset.proj);
      if (!p) return;
      if (kind === "proj") {
        const st = ps(p.id);
        st.status = st.status === "done" ? "todo" : "done";
        if (st.status === "done") st.doneOn = today();
        save(["projects"]); render(); return;
      }
      if (kind === "why") { expanded[p.id] = !expanded[p.id]; render(); return; }
    }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset && t.dataset.person != null) {
      const p = state.people[+t.dataset.person];
      if (!p) return;
      p[t.dataset.k] = t.dataset.k === "tier" ? +t.value : t.value;
      save(["people"]);
      if (t.dataset.k !== "name") render();
      return;
    }
    if (t.id === "set-target") { state.settings.listTarget = t.value; save(["settings"]); render(); }
    if (t.id === "set-zone")   { state.settings.zoneStart = weekId(t.value); save(["settings"]); render(); }
  });

  document.addEventListener("click", (e) => {
    if (e.target.id === "btn-export") {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mission-control-${today()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }
    if (e.target.id === "btn-import") {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "application/json";
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            state = Object.assign(BLANK(), JSON.parse(r.result));
            save(); render();
          } catch (err) { alert("That file isn't a Mission Control backup."); }
        };
        r.readAsText(f);
      };
      inp.click();
    }
    if (e.target.id === "btn-reset") {
      if (confirm("Clear all check-offs, project status and history? Names and dates are kept.")) {
        const keep = { settings: state.settings, people: state.people };
        state = Object.assign(BLANK(), keep);
        save(); render();
      }
    }
    if (e.target.id === "btn-theme") {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "dark" ? "light" : cur === "light" ? "" : "dark";
      if (next) document.documentElement.setAttribute("data-theme", next);
      else document.documentElement.removeAttribute("data-theme");
      try { localStorage.setItem("mc-theme", next); } catch (err) {}
    }
  });

  /* ===================== boot ===================== */
  try {
    const th = localStorage.getItem("mc-theme");
    if (th) document.documentElement.setAttribute("data-theme", th);
  } catch (e) {}

  function seedSchedule() {
    /* A fresh install with no history would mark all 38 jobs due at once — the
       exact wall of red this whole design exists to avoid. So on first run each
       job is placed at a deterministic point inside its own cycle (golden-ratio
       spread, so it's even and reproducible rather than random). Week one then
       looks like an ordinary week instead of an emergency. */
    if (Object.keys(state.tasks).length) return;
    RHYTHM.forEach((t, i) => {
      // Daily and near-daily jobs are due immediately — that IS the normal state,
      // and a Today board with nothing on it teaches people to stop opening it.
      // Everything slower gets placed at its own point in its cycle so the long
      // jobs arrive a few at a time instead of all in week one.
      const frac = (i * 0.6180339887) % 1;
      const offset = t.cadence <= 3 ? t.cadence : Math.round(t.cadence * frac);
      state.tasks[t.id] = { lastDone: addDays(today(), -offset), prevDone: null };
    });
  }

  (async function boot() {
    store = LocalStore;
    await LocalStore.init();
    seedSchedule();
    render();

    /* Shared sync lights up if the viewer can run it; the page is fully
       usable either way, so nothing above waits on this. */
    if (window.claude && typeof window.claude.use === "function") {
      try {
        const db = await window.claude.use("db");
        if (db) {
          const shared = DbStore(db);
          await shared.init();
          store = shared;
          shared.watch();
          render();
        }
      } catch (e) { /* stay local */ }
    }
  })();
})();
