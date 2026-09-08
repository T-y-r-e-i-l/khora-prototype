# Side navigation, and the journal views it makes room for

**Date:** 2026-09-07
**Status:** Approved, ready for planning

## Why

The top bar carries five controls that are not the same kind of thing. `Notes`
and `Insights` toggle panels, `New note` and `Share` act on a note, and only
`Explore` is a destination. Because they look identical, nothing in the header
can carry a meaningful active state, and there is nowhere to put a sixth item.

Zillow's web app solves this by splitting navigation by ownership rather than
importance. A 78px rail pinned to the left edge — their markup calls it
`product-nav` — holds what belongs to the user and accumulates over time:
Search, Updates, Favorites, Plan, Inbox. The marketing nav and the logo stay in
a top bar. The rail can carry an honest active state because every item in it
is the same kind of thing.

Palinode has two things that accumulate across the journal and currently have
nowhere to live: the shelf of works the whole journal has raised, and the
belief profile across 27 spectra. Both exist today only in note-scoped form as
tabs in the right rail, and the Beliefs tab already leaks the journal-wide
truth every time it prints "1 of 27 spectra placed in this journal". The rail
gives them a home.

## Reference geometry

Measured from zillow.com on 2026-09-07:

| Property | Value |
|---|---|
| Rail width | 78px |
| Item target | 56 × 56px (was measured as 40 wide; see note) |
| Active pill | 40 × 32px |
| Item pitch | 72px |
| Icon | 24px |
| Label | 10px, weight 400, below the icon |

Palinode's `.micro` is already 10px, so the label size enters no new type into
the scale. Palinode's labels are uppercase with `.18em` tracking, which is
wider than Zillow's sentence case; if `Explore` or `Profile` overflow 78px at
that tracking, reduce rail-label tracking to `.1em` rather than widening the
rail or shrinking below 9.5px.

## Architecture

### Layout

`#app` is currently `grid-template-rows: 52px 1fr` with `header.top` above
`.body`. The header is removed and `#app` becomes:

```
#app { grid-template-columns: var(--nav) minmax(0, 1fr); }
--nav: 78px;
```

`.body` keeps its own three-column grid and now runs the full window height,
gaining the 52px the header held.

### The rail

A `<nav class="sidenav">` as the first child of `#app`, top to bottom:

1. **Brand glyph** — the existing hexagon SVG, 22×26, centred, `title="Palinode"`.
   The wordmark and "Philosophical Reader" are dropped; 78px does not fit them.
   To be replaced with a real logo later.
2. **New note** — a 40px rounded square with a `+`, tinted, visually distinct
   from the destinations so it reads as an action. Not part of the active-state
   group.
3. **Hairline.**
4. **Destinations** — Notes, Explore, Shelf, Profile. Icon over label, exactly
   one active at a time, active marked by a tinted pill behind the icon in the
   category colour.

### What moves out of the nav

- **Share** joins the note it acts on, in the note's meta line beside the word
  count. It is meaningless with no note open, and the nav should not hold items
  that are dead half the time.
- **Insights** becomes a collapse chevron on the Reading rail's own left edge.
  A panel's show/hide control belongs to the panel.
- **Notes** stays a toggle for the Library column, but is now also the marker
  for "I am writing", so it reads as a destination that happens to show a
  panel. Its behaviour depends on where you are: from Shelf or Profile it
  returns to the `write` view and ensures the Library is visible; when already
  in `write` it toggles the Library open and closed without leaving the view.

### The view switch

The centre column today juggles `#empty`, `#editor-wrap`, and `#reading-room`
through `hidden` flags set from `openNote`, `openRoom`, and `closeRoom`. Two
more destinations would make that worse.

Introduce `setView(name)` in `app.js` as the only function permitted to change
what the centre shows, over four views:

| View | Shows |
|---|---|
| `write` | Prompt card plus editor, or the empty state when no note is open |
| `room` | Reading Room |
| `shelf` | Journal-wide shelf |
| `profile` | Journal-wide belief profile |

`openRoom` and `closeRoom` become callers of `setView` rather than managing
visibility themselves.

The rail's active item is derived, never tracked separately:

| Condition | Active item |
|---|---|
| Graph open | Explore, whatever the centre view is underneath |
| View is `write` | Notes |
| View is `shelf` | Shelf |
| View is `profile` | Profile |
| View is `room` | Whichever destination opened it — Notes or Shelf |

The Reading Room is reachable from both a note's insight cards and the Shelf,
so it keeps no item of its own and instead holds the origin that opened it.
Returning from the Room goes back to that origin.

### Explore

`#graph` is `position: fixed; inset: 0` and covers everything. A nav you cannot
reach from the graph is not persistent, so it becomes `inset: 0 0 0 var(--nav)`
and the rail stays visible and clickable with Explore active. `#gx-3d`,
`.gx-head`, and `.gx-panel` position themselves against `#graph`, so their
`var(--rail-r)` offsets continue to work unchanged.

Explore remains an overlay rather than a centre view because it takes over the
Library and Reading rails too, which no centre view does.

## The two new views

### Shelf

The journal-wide form of the Readings tab. `LIB.shelf()` already ranks works by
how many insights point at them; it is fed the union of insights from every
note instead of only the open one. Each card reuses the existing `.work`
markup and gains a line naming which notes raised it. Clicking opens the
Reading Room, which already exists and needs no change.

**Cost and caching.** This is one engine run per note when the view opens. The
engine is keyword and regex based and journals are small, but the work is
repeated on every visit. Analyses are memoized in memory, keyed by note id,
invalidated when that note's text changes. The cache is not persisted —
localStorage holds notes, not derived analysis.

### Profile

The 27 spectra from `Belief.scores()`, grouped by the `branch` field on each
entry in `BEL.SPECTRA`, with `Belief.coverage()` at the top.

Each axis shows its title, both poles, the continuum with the placed mark, and
how many of its items have been answered. Within each branch, placed axes lead
and unplaced ones sit dimmed below with a Place-yourself button wired to the
existing overlay.

The rule the whole belief feature rests on is unchanged here: only an answered
item moves a mark. This view reads `Belief.scores()` and never writes.

### Shared spectrum rendering

`specTrack` and `specPoles` are currently duplicated verbatim in `app.js`
(lines 533 and 548) and `graph.js` (lines 553 and 568). The Profile view would
be a third copy.

They move to a shared helper that `app.js`, `graph.js`, and the Profile view
all call. The two marks — dashed for a passage's tentative lean, solid for a
placement — must keep meaning the same thing in all four places they now
appear, and one renderer is how that is guaranteed.

`specLine` stays in `graph.js`; it is specific to the graph panel's phrasing
and has no second caller.

## Responsive

Below 900px the rail becomes a fixed bottom tab bar spanning the width, with
the same four destinations plus New note; the brand glyph is hidden.

The existing overlay rules for the rails reference the removed header:

```
.body.show-rail aside.rail { inset: 52px auto 0 0; }
.body.show-insights aside.insights { inset: 52px 0 0 auto; }
```

Both become `inset: 0 ...` with a bottom offset for the tab bar's height.

## Error handling and edge cases

- **No notes at all.** Shelf and Profile are reachable with an empty journal.
  Each shows an honest empty state in the manner the Beliefs tab already uses,
  not a blank panel.
- **Shelf with notes but no insights.** A note under roughly twelve words
  produces no insights; those notes contribute nothing and are not listed as
  having raised anything.
- **Profile with nothing placed.** Coverage reads `0 of 27` and every axis is
  in its unplaced state. This is a valid resting state, not an error.
- **Switching views with the graph open.** Choosing a centre destination from
  the rail closes the graph first, so the two never fight over the screen.
- **Answering an item from Profile.** Writes through `Belief.answer` exactly as
  the Beliefs tab and graph panel do, then re-renders the view and refreshes
  the graph if it is open, matching what `renderBeliefs` does today.

## Testing

Playwright suites in `.verify/`, following the existing three:

- **Nav** — the rail renders with its items; exactly one destination is active
  at a time; each destination switches the centre; New note creates a note;
  Notes returns to `write` from elsewhere and toggles the Library when already
  there; the Reading chevron toggles the right rail; Share appears with a note
  and not without one; the rail stays visible and clickable while the graph is
  open, and Explore reads active throughout; the Reading Room shows its origin
  as active and returns there.
- **Shelf** — works rank by journal-wide insight count, not the open note's;
  each card names the notes that raised it; clicking opens the Reading Room;
  the empty-journal state is honest.
- **Profile** — all 27 axes present and grouped by branch; coverage matches
  `Belief.coverage()`; placed axes lead their branch; answering from this view
  persists and moves the mark; nothing here writes a score from prose.
- **Regression** — the existing `beliefs`, `graph-spectra`, and `hover3d`
  suites keep passing, with selectors updated where the header's removal
  changes them.

## Out of scope

- Any change to the five-lane analysis or the engine's output contract.
- Any change to the rule that only answered items move a belief mark.
- A real logo. The glyph stands in until one exists.
- Collapsing the rail to a narrower or icon-only state; it is one fixed width.
- Persisting the selected view across reloads.
