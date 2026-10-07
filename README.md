# 12th State × FOTC — Road to Charleston

Schedule tracker for 12th State CrossFit teams competing in
[Fittest of the Coast](https://fittestofthecoast.com) — the Coastal Qualifier
(Oct 1–28, 2026) and the Charleston Championship (Jan 15–17, 2027).

**Live:** https://roadtocharleston.com

Served from GitHub Pages on a custom apex domain. Because the site is served from
the domain root rather than `/fotc_12th/`, `vite.config.ts` sets `base: "/"` and
`public/CNAME` pins the domain so it survives redeploys. Changing either will
break asset loading.

## Updating the schedule

Everything on the page comes from one file: **`public/data/schedule.json`**.

Everything except the roster, which comes from the leaderboard (see below).

Edit it on github.com, commit, and the change is live once the deploy finishes.

## The roster and leaderboard places

The roster is **not** edited by hand. It comes from the Competition Corner leaderboard
for the Coastal Qualifier (event `21880`): every team or individual whose affiliate looks
like "12th State" is listed, with their division, overall place, points and rank on each
workout.

`npm run standings` reads the leaderboard and writes `public/data/standings.json`
(gitignored). The deploy workflow runs it before every build, and a cron re-deploys
**every 30 minutes during October and November**, so places lag the leaderboard by at
most about half an hour. Trigger the workflow by hand from the Actions tab for an
immediate refresh.

The browser cannot read Competition Corner directly — its API sends no CORS headers —
which is why the fetch happens at build time rather than on page load.

Settings live in the `leaderboard` block of `schedule.json`:

```json
"leaderboard": {
  "eventId": 21880,
  "include": ["Chalk Dirty", "Brenda Mullaney"]
}
```

`include` lists entries (exact leaderboard name) registered under another gym that should
still count as ours. Ids are `cc-<participant id>` and stay stable for the season — use them
in an event's `entrants` to tag a championship heat.

Places are blank until FOTC reveals a workout's scores; until then cards say
"Awaiting scores".

### Adding an event

```json
{
  "id": "unique-id",
  "kind": "release",
  "title": "Workout 6 released",
  "start": "2026-10-29T19:00:00-04:00",
  "phase": "qualifier",
  "week": 5,
  "entrants": "all",
  "location": "Online · FOTC YouTube",
  "notes": "Optional detail line.",
  "link": "https://competitioncorner.net/ff/21880/results"
}
```

| Field | Notes |
|---|---|
| `kind` | `release` (cyan) · `due` (coral) · `comp` (white) · `milestone` (grey) |
| `start` | ISO 8601 **with offset**. Eastern is `-04:00` in October, `-05:00` in January |
| `phase` | `qualifier` or `championship` — drives the hero stat row |
| `entrants` | `"all"` for gym-wide, or an array of entrant ids from `standings.json`, like `["cc-1520726"]` |
| `end`, `week`, `location`, `notes`, `link` | All optional |

### If you make a typo

The page shows a red card listing exactly what's wrong and which field it's in,
rather than going blank. Unknown entrant ids, duplicate ids, unparseable dates and
end-before-start are all caught.

## The top link bar

The slim bar above the header comes from the `links` array in `schedule.json`:

```json
"links": [
  { "label": "Rulebook", "url": "https://fittestofthecoast.com/.../Rulebook.pdf" },
  { "label": "Leaderboard", "url": "https://competitioncorner.net/ff/21880/results",
    "note": "soon" }
]
```

`note` is optional and renders as a small cyan tag — use it to flag a link that is not
live yet, and delete it once the link works.

**The rulebook URL is version-stamped** (`..._7.27.2026.pdf`), so it will break when FOTC
reissues the rulebook. Grab the new address from
<https://fittestofthecoast.com/coastal-qualifier/> and paste it in. Remove the whole
`links` array and the bar disappears.

## The filter

The chip row starts with **All · Teams · Individuals**. Choosing Teams or Individuals reveals
that group's divisions after a divider (team divisions drop the repeated "Team" prefix),
ordered by level: RX, Intermediate, Novice, age groups youngest first, then Teen. Choosing a
division keeps its siblings on show and outlines its parent group. Everything is derived from
the leaderboard data, so a new division gets a chip automatically.

Filtering narrows the standings, the roster and the schedule. Gym-wide events (`"entrants": "all"`)
stay visible under every filter, since they apply to everyone.

## Adding championship heat times

When FOTC publishes heats, add one event per entrant with `phase: "championship"` and
`entrants: ["that-id"]`. They group under January automatically, and the filter starts
doing real work — right now every event is gym-wide, so filtering looks inert.

## Development

```bash
npm install
npm run standings  # fetch the roster and places — the page shows an error without it
npm run dev        # local dev server
npm test           # run the test suite
npm run test:watch
npm run typecheck
npm run lint
npm run build
```

Push to `main` and GitHub Actions runs lint, typecheck and tests before deploying.
A failure blocks the deploy.

## Design notes

- [Design spec](docs/superpowers/specs/2026-08-07-fotc-schedule-tracker-design.md)
- [Visual mockup](docs/superpowers/specs/2026-08-07-schedule-tracker-mockup.html)

### Known assumptions and gaps

- FOTC has said one qualifier week carries two scored workouts but not which one.
  The data assumes **Week 3** (`wod34-release` / `wod34-due`).
- The leaderboard roster differs from the gym's competitor spreadsheet: it includes
  every 12th State registration (51 at last count), not just the people on the sheet.
- Chalk Dirty and Brenda Mullaney register under CrossFit EXP, so they're pulled in via
  `include`.
- "Places" compare only within a division; the standings table orders entrants by how far
  up their own division they sit.
