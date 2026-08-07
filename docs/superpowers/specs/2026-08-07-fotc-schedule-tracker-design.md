# 12th State × FOTC Schedule Tracker — Design

**Date:** 2026-08-07
**Status:** Approved
**Visual reference:** [`2026-08-07-schedule-tracker-mockup.html`](./2026-08-07-schedule-tracker-mockup.html)

## Purpose

A single-page app, served from GitHub Pages, that tracks 12th State CrossFit teams
through the Fittest of the Coast competition — the October 2026 online qualifier and
the January 2027 in-person championship.

The audience is gym members, athletes' families, and spectators. They want one answer:
**what's happening next, and does it involve my team?**

## Scope

**In scope:** schedule display, team roster, per-team filtering, a "next up" countdown.

**Explicitly out of scope:** scores, placements, leaderboards, results tracking. The app
answers *when*, never *how well*. This keeps the data file small enough to hand-edit and
avoids a standing obligation to update scores under time pressure during the qualifier.

## Source data

Taken from fittestofthecoast.com on 2026-08-07:

| | |
|---|---|
| Coastal Qualifier | Oct 1–28, 2026 |
| Format | Five scored workouts over four weeks (one week has two) |
| Workout release | Thursdays, 7:00 PM ET |
| Score deadline | Following Wednesday, 9:00 PM ET |
| Championship | Jan 15–17, 2027 |
| Venue | Charleston Convention Center, North Charleston, SC |

**Known unknown:** FOTC has published that one week carries two scored workouts but has
not said which. The seed data assumes **Week 3**. When FOTC announces, this is a one-line
change in `schedule.json` — no code change.

**Known gap:** championship heat times are unpublished. The January section renders a
single "TBA" entry until per-team heats exist.

## Architecture

Static SPA. No backend, no database, no API.

```
public/data/schedule.json     ← the file that gets edited
src/
  types/schedule.ts           ← TypeScript types (hand-written)
  data/
    validate-schedule.ts      ← runtime validation → Result
    load-schedule.ts          ← fetch + validate
  domain/
    next-event.ts             ← soonest future event
    filter-events.ts          ← team filtering
    group-events.ts           ← month grouping
    format-event-time.ts      ← local time + ET label
  components/
    Header, Hero, NextUpCard, TeamFilter,
    ScheduleBoard, EventRow, TeamGrid, ChampionshipCard, ErrorCard
  App.tsx
.github/workflows/deploy.yml
```

### The one load-bearing decision

`schedule.json` lives in **`public/data/`**, not `src/`, and is fetched at runtime.

A file imported from `src/` gets inlined into the JS bundle at build time, meaning every
roster correction or date fix requires a full CI run before it appears. As a static asset
it is served as-is: edit it on github.com, commit, and the next page load shows the change.
No rebuild, no deploy wait, no laptop required.

The cost is that the JSON is untyped at the boundary — hence runtime validation below.

## Data model

```ts
type EventKind = "release" | "due" | "comp" | "milestone";
type Phase = "qualifier" | "championship";

type Team = {
  readonly id: string;
  readonly name: string;
  readonly division: string;
  readonly color: string;        // hex, hand-assigned
  readonly athletes: readonly string[];
};

type ScheduleEvent = {
  readonly id: string;
  readonly kind: EventKind;
  readonly title: string;
  readonly start: string;        // ISO 8601 with explicit offset
  readonly end?: string;
  readonly phase: Phase;
  readonly week?: number;
  readonly teams: "all" | readonly string[];
  readonly location?: string;
  readonly notes?: string;
  readonly link?: string;
};

type Schedule = {
  readonly gym: { readonly name: string; readonly location: string };
  readonly teams: readonly Team[];
  readonly events: readonly ScheduleEvent[];
};
```

### Validation

No Zod — a hand-written validator returning `Result<Schedule, ValidationError[]>`.
It checks structural shape plus two rules that would otherwise fail silently:

1. **Every team id in `events[].teams` resolves to a real team.** A typo would otherwise
   make an event vanish from every filter with no error anywhere.
2. **`end` is after `start`** when present.

Duplicate team colors are *not* validated. With four teams it is easier to eyeball than
to encode, and a false-positive rule would be more annoying than the problem.

On failure the app renders `ErrorCard` — a coral-bordered card, in the site's own style,
naming the offending field and value. The person most likely to see it is whoever just
made the typo, quite possibly on a phone, so the message has to be readable and specific.

**Deviation from global guidelines:** `~/.claude/docs/typescript.md` calls for schema-first
development with Zod at trust boundaries, and `schedule.json` is exactly such a boundary.
Dropping Zod was an explicit call to keep the project light. The validator preserves the
behaviour that mattered (runtime checking, validated test factories); what is lost is
schema-derived types, so `types/schedule.ts` and `validate-schedule.ts` must be kept in
sync by hand. With ten fields this is a fair trade; if the model grows, revisit it.

### Time handling

Dates carry explicit Eastern offsets. The UI renders the **viewer's local time** with an
ET label beside it. Someone travelling doesn't miss a 9:00 PM ET deadline, and someone
local still sees the times they expect.

## UI

Mobile-first. The mockup is the visual specification.

**Layout:** agenda board — dense rows with sticky month headers and a colored left edge
per event kind (cyan = workout drop, coral = deadline, white = competition floor). Chosen
over a timeline rail because it scales to 30+ championship heat entries without becoming
a mile of scrolling.

**Sections:** Header → Hero (with stat row) → sticky team filter → Next Up countdown →
schedule board → team grid → championship card.

**Responsive behaviour:**

| Breakpoint | Behaviour |
|---|---|
| < 900px | Hamburger nav; hero type scales to 40px; stats become 2×2 |
| < 880px | Event rows collapse 3 columns → stack; date reflows to one inline line |
| < 820px | Next Up card stacks; countdown boxes go full-width thirds |
| < 700px | Filter chips scroll horizontally rather than wrapping |
| < 620px | Team grid single column |

**Design tokens** (extracted from the live FOTC site, not guessed):

```
--bg      #0A0C0D      display font   Archivo Black, uppercase
--surface #15191B      body font      Archivo
--coral   #FF5959      eyebrow        11.5px / 700 / .26em tracking / cyan
--cyan    #27CFE6      corners        square; 1px hairline rules
--muted   #94A3A8      texture        faint diagonal wave overlay
```

## Testing

Behaviour-driven, through the public API. Factory functions (`getMockEvent`, `getMockTeam`,
`getMockSchedule`) with `Partial<T>` overrides — no `let`, no `beforeEach`. Factories run
their output through the real validator so invalid test data fails loudly at construction.

Behaviours under test:

- Selecting a team shows `"all"` events plus that team's events, and hides the rest
- Selecting "All teams" restores the full list
- "Next up" picks the soonest event whose start is in the future
- "Next up" renders nothing once every event is past
- Malformed JSON renders the error card naming the bad field, not a blank page
- An event referencing an unknown team id is reported as a validation error
- Events group under the correct month header, chronologically ascending
- Event times render in local time with an ET label

Presentational components (`Hero`, `ChampionshipCard`, `Header`) are covered incidentally
through App-level tests rather than getting test files of their own — there is no behaviour
in them to document.

## Deployment

GitHub Actions on push to `main`: install → typecheck → lint → test → build → deploy to Pages.
A failing test or type error blocks the deploy.

- `vite.config.ts` sets `base: '/fotc_12th/'` for the project-Pages path
- `public/404.html` duplicates `index.html` so deep links survive if routes are added later

## Updating the schedule

Edit `public/data/schedule.json` on github.com and commit. Live on next page load.
Adding a team, correcting a name, fixing a date, or adding January heat times are all
data edits — none require touching code or waiting on CI.
