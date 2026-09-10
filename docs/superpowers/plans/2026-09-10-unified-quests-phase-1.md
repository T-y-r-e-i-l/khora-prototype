# Unified Quests (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Quest the primary playable unit (discover → accept → log → fulfill), while Epics remain mentor-led packages over the same `questIds[]`.

**Architecture:** Introduce a first-class quest catalog + `palinode.quests.v1` log store. Explore opens an accept overlay instead of hard-routing to Marketplace checkout. Marketplace enrollment continues to unlock mentor turn-in for epic-packaged quests and syncs those quests into the shared log. Mercurial styling marks free/discoverable quest nodes on the graph.

**Tech Stack:** Existing vanilla JS (`marketplace-data.js`, `marketplace.js`, `graph.js`, `app.js`), localStorage mocks, Playwright smokes in `.verify/`.

**Stance (locked):** Unify — one Quest model; Epic = packaging path. Canvas: `quests-epics-fit.canvas.tsx`. Source stories: Obsidian `Quest User Stories.md` (US1–2, 8–11 core in P1; XP/timed/social = P2/P3).

## Global Constraints

- Do not remove Marketplace Mentors / Epics / My Epics or mock checkout.
- Same Quest `id` is referenced by free discovery and by `EPICS[].questIds[]`.
- Keep mentor turn-in statuses (`Draft` → `Completed`) for enrolled epic quests; free quests use log statuses (`available` → `active` → `completed` | `abandoned`).
- No real Stripe, Khora quest API, community websockets, or LLM play methods in P1.
- Cache-bust touched assets in `index.html`; extend `.verify/marketplace.mjs` (and add `.verify/quests.mjs` if cleaner).
- Prefer extending existing files over new frameworks; new module `assets/js/quests.js` is allowed for the log store + overlay.

## File map

| File | Responsibility |
|------|----------------|
| `assets/js/marketplace-data.js` | Extend Quest seed fields; keep Epic.questIds[] |
| `assets/js/quests.js` | Quest log store, accept/decline/abandon, overview overlay API |
| `assets/js/marketplace.js` | On enroll, activate packaged quests in log; open learn if active+enrolled |
| `assets/js/graph.js` | Mercurial class; open → quest overview; Show on map |
| `assets/js/app.js` | Wire quest overlay; optional Quests nav entry |
| `index.html` | Overlay markup; Quests panel shell; cache-bust |
| `assets/css/app.css` | Overlay + log + Mercurial node styles |
| `.verify/quests.mjs` | Discover → accept → log → abandon smoke |

---

### Task 1: Extend Quest seed schema

**Files:**
- Modify: `assets/js/marketplace-data.js`
- Test: node one-liner / later `.verify/quests.mjs`

**Interfaces:**
- Produces: `questOf`, `hydrateQuest`, `allQuests` return objects with at least:
  `{ id, title, description, epicId, type, access, conceptIds, objectives, rewards }`
- `type`: `'course' | 'elenchos' | 'special'` (P1 seed mostly `'course'` + 2–3 free `'elenchos'`)
- `access`: `'free' | 'epic_required'`
- `objectives`: `string[]` (1–3 bullets)
- `rewards`: `{ exp: number, unlockLabel?: string }` (exp unused until P2, still show in overview)
- Keep every existing course quest `epicId` + Epic `questIds[]` valid

- [ ] **Step 1: Add fields to each QUESTS entry**

For existing course quests set `type: 'course'`, `access: 'epic_required'`, `objectives: [description]`, `rewards: { exp: 25 }`, `conceptIds: []`.

- [ ] **Step 2: Add 2–3 free discoverable quests**

Example free quest (no epic required):
```js
{
  id: 'q-free-dichotomy',
  epicId: null,
  title: 'Name what is up to you',
  description: 'From one recent note, split control from fortune.',
  type: 'elenchos',
  access: 'free',
  conceptIds: [], // optional local concept slug if one fits
  objectives: ['Pick a stuck moment', 'List what was yours to move', 'Write one freer next act'],
  rewards: { exp: 40, unlockLabel: 'Clarity practice mark' }
}
```

- [ ] **Step 3: Confirm hydrateQuest spreads new fields**

- [ ] **Step 4: Cache-bust `marketplace-data.js` in `index.html`**

---

### Task 2: Quest log store + public API

**Files:**
- Create: `assets/js/quests.js`
- Modify: `index.html` (script tag before marketplace.js or after data)

**Interfaces:**
- Produces `window.PalinodeQuests`:
  - `KEY = 'palinode.quests.v1'`
  - `getState()`, `list({ status })`, `get(questId)`
  - `discover(questId)` → marks available if unknown
  - `accept(questId)` → active; toast
  - `decline(questId)` → no log entry (or dismissed set)
  - `abandon(questId)` → abandoned; confirm handled by UI
  - `complete(questId, meta?)` → completed
  - `activateForEpic(epicId)` → accept all free-or-packaged quests in that epic’s `questIds` as active (called on enroll)
  - `isActive`, `isCompleted`, `canAccept(quest)` (false if `epic_required` and not enrolled)

```js
// store shape
{
  entries: {
    [questId]: {
      status: 'active' | 'completed' | 'abandoned',
      acceptedAt, updatedAt,
      progress: 0, // 0–1
      source: 'explore' | 'epic' | 'invite'
    }
  },
  dismissed: { [questId]: true }
}
```

- [ ] **Step 1: Create `quests.js` with load/save and API above**

- [ ] **Step 2: Wire script in `index.html` after `marketplace-data.js`**

- [ ] **Step 3: From `marketplace.js` `ensureEnrollment` / pay success, call `PalinodeQuests.activateForEpic(epicId)`**

- [ ] **Step 4: When marketplace `simulateReview` marks quest Completed, call `PalinodeQuests.complete(questId)`**

---

### Task 3: Accept / decline overview overlay

**Files:**
- Modify: `index.html` (scrim + panel)
- Modify: `assets/js/quests.js` (`openOverview(questId)`, `closeOverview`)
- Modify: `assets/css/app.css`
- Modify: `assets/js/graph.js` + `assets/js/app.js` (route opens here)

**Interfaces:**
- Consumes: `PalinodeMarketData.hydrateQuest`, `PalinodeMarketplace.isEnrolled`
- Produces: overlay with type label, description, objectives, special details (access, rewards), Accept / Decline

- [ ] **Step 1: Add `#quest-overview-scrim` markup** (mirror checkout scrim pattern)

- [ ] **Step 2: Implement `openOverview(questId)` rendering**

Accept enabled when `canAccept`; if `epic_required` and not enrolled, primary CTA is “View epic” → `PalinodeMarketplace.enter({ epicId })`.

- [ ] **Step 3: Accept → `accept` + toast + optionally `PalinodeGraph` focus start node / leave overlay**

- [ ] **Step 4: Decline → close without accepting**

- [ ] **Step 5: Change Explore quest click / `onOpenQuest` to `PalinodeQuests.openOverview(id)` instead of always `Marketplace.enter({ questId })`**

Keep Marketplace learn deep-link for enrolled active course quests via log detail “Continue”.

---

### Task 4: Quest log UI

**Files:**
- Modify: `index.html` (section under market or new wrap)
- Modify: `assets/js/quests.js` or `app.js` (nav)
- Modify: `assets/css/app.css`

**Interfaces:**
- Tabs/filters: Active | Completed | Abandoned
- Row actions: Open detail, Abandon (active), Show on map, Continue (if epic enrolled)

- [ ] **Step 1: Add Quests destination** — prefer a Marketplace board tab `Quests` **or** a sidenav item; pick **Marketplace tab “Quests”** to avoid nav-contract churn, unless sidenav already has spare capacity (then update `.verify/sidenav.mjs` / `nav-mobile.mjs`).

- [ ] **Step 2: Render filtered list from `PalinodeQuests.list`**

- [ ] **Step 3: Detail drawer/panel** with objectives + progress + Abandon confirm

- [ ] **Step 4: Show on map** → Explore corpus + select `quest:{id}` (reuse graph enter helpers)

- [ ] **Step 5: Smoke: accept from overlay → appears under Active**

---

### Task 5: Mercurial Explore markers + filter behavior

**Files:**
- Modify: `assets/js/graph.js`
- Modify: `assets/css/app.css`

- [ ] **Step 1: Add `gx-mercurial` class** for quests with `access === 'free'` (and active log quests)

- [ ] **Step 2: Distinct orb pulse/glow** (clarity accent; no emoji)

- [ ] **Step 3: Epics & Quests filter** continues to show epics + all quests; free quests inject even when filter off if `discover`/`available` — P1 minimum: free quests appear whenever Epics & Quests is on (already), plus always inject free quests (cap 6) alongside default mentors/epics

- [ ] **Step 4: Panel copy** shows type + Accept CTA via overview

---

### Task 6: Verification

**Files:**
- Create: `.verify/quests.mjs`
- Modify: `.verify/marketplace.mjs` (enroll still activates course quests; eq filter still works)

- [ ] **Step 1: Write Playwright flow**

1. Open Explore → Epics & Quests  
2. Click a free quest node → overview visible  
3. Accept → toast / Active list contains id  
4. Abandon → moves to Abandoned  
5. Enroll epic → packaged quests appear Active  
6. No pageerrors  

- [ ] **Step 2: Run** `node .verify/quests.mjs` and `node .verify/marketplace.mjs` — expect green

- [ ] **Step 3: Commit** (only when user asks)

```bash
git add assets/js/quests.js assets/js/marketplace-data.js assets/js/marketplace.js \
  assets/js/graph.js assets/js/app.js assets/css/app.css index.html .verify/quests.mjs
git commit -m "$(cat <<'EOF'
Add unified quest log with accept overlay and Mercurial nodes.

EOF
)"
```

---

## Phase 2 / 3 (not in this plan)

- P2: profile EXP/level, completion reward summary, locked concept nodes, mock discovery triggers (US5–7, US1 remainder)
- P3: timed quests, achievements, share artifacts, peer invites, community progress (US3, US12–14) after play-method design

## Done when

- Free quest: discover → accept → log → abandon works locally
- Epic enroll still works and syncs packaged quests into the same log
- Explore Mercurial free quests are visually distinct
- Verify scripts green
