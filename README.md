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

Edit it on github.com, commit, and the change is live on the next page load — the
file is served as a static asset, so it does **not** wait for a rebuild.

### Adding a team

```json
{
  "id": "new-team",
  "name": "New Team",
  "division": "Team M/F · Rx",
  "color": "#4ADE80",
  "athletes": ["First Last", "Second Person"]
}
```

`id` must be unique — events refer to teams by it. `color` drives the card edge and
filter dot; pick something distinct from the other teams.

### Adding an event

```json
{
  "id": "unique-id",
  "kind": "release",
  "title": "Workout 6 released",
  "start": "2026-10-29T19:00:00-04:00",
  "phase": "qualifier",
  "week": 5,
  "teams": "all",
  "location": "Online · FOTC YouTube",
  "notes": "Optional detail line.",
  "link": "https://competitioncorner.net/events/19273"
}
```

| Field | Notes |
|---|---|
| `kind` | `release` (cyan) · `due` (coral) · `comp` (white) · `milestone` (grey) |
| `start` | ISO 8601 **with offset**. Eastern is `-04:00` in October, `-05:00` in January |
| `phase` | `qualifier` or `championship` — drives the hero stat row |
| `teams` | `"all"` for gym-wide, or an array of team ids like `["hold-the-line"]` |
| `end`, `week`, `location`, `notes`, `link` | All optional |

### If you make a typo

The page shows a red card listing exactly what's wrong and which field it's in,
rather than going blank. Unknown team ids and end-before-start are both caught.

## Adding championship heat times

When FOTC publishes heats, add one event per team with `phase: "championship"` and
`teams: ["that-team-id"]`. They group under January automatically, and the team
filter starts doing real work.

## Development

```bash
npm install
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

### Known assumption

FOTC has said one qualifier week carries two scored workouts but not which one.
The seed data assumes **Week 3** (`wod34-release` / `wod34-due`). Change those two
entries if they announce differently.
