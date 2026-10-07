import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import {
  getMockRawEvent,
  getMockRawIndividual,
  getMockRawSchedule,
  getMockRawTeam,
} from "./test/factories";
import { serveFiles } from "./test/serve-files";

const SEPTEMBER = new Date("2026-09-01T12:00:00-04:00");

const serve = (body: unknown): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body }),
  );
};

const defaultEvents = [
  getMockRawEvent({
    id: "wod1-release",
    title: "Workout 1 released",
    start: "2026-10-01T19:00:00-04:00",
    entrants: "all",
  }),
  getMockRawEvent({
    id: "wod1-due",
    kind: "due",
    title: "Workout 1 scores due",
    start: "2026-10-07T21:00:00-04:00",
    entrants: "all",
  }),
  getMockRawEvent({
    id: "hold-only",
    kind: "comp",
    title: "Hold the Line heat one",
    start: "2027-01-15T09:00:00-05:00",
    phase: "championship",
    entrants: ["hold-the-line"],
  }),
  getMockRawEvent({
    id: "salt-only",
    kind: "comp",
    title: "Salt and Sand heat one",
    start: "2027-01-15T11:00:00-05:00",
    phase: "championship",
    entrants: ["salt-and-sand"],
  }),
];

const scheduleOf = (events = defaultEvents): Record<string, unknown> =>
  getMockRawSchedule({ events });

const board = (): HTMLElement => screen.getByRole("region", { name: /^schedule$/i });
const roster = (): HTMLElement => screen.getByRole("region", { name: /who's competing/i });
const standingsSection = (): HTMLElement => screen.getByRole("region", { name: /where we stand/i });

const standingOf = (place: number | undefined, fieldSize: number, rank?: number) => ({
  place,
  fieldSize,
  points: place === undefined ? undefined : place * 4,
  workouts: [{ name: "Workout 1", rank, result: rank === undefined ? undefined : "212 reps" }],
});

const rankedSchedule = (): Record<string, unknown> =>
  getMockRawSchedule({
    teams: [
      getMockRawTeam({ standing: standingOf(10, 20, 10) }),
      getMockRawTeam({
        id: "salt-and-sand",
        name: "Salt & Sand",
        division: "Team Novice Co-Ed",
        athletes: ["Avery Bowen", "Sam Delaney"],
        standing: standingOf(3, 60, 3),
      }),
    ],
    individuals: [getMockRawIndividual({ standing: standingOf(undefined, 30) })],
    events: [],
  });

const serveRanked = (): void => {
  const schedule = rankedSchedule();
  serveFiles({
    "schedule.json": schedule,
    "standings.json": {
      updatedAt: "2026-10-08T16:00:00.000Z",
      teams: schedule["teams"],
      individuals: schedule["individuals"],
    },
  });
};

const renderApp = async (): Promise<void> => {
  render(<App />);
  await waitFor(() => expect(screen.getByRole("main")).toBeInTheDocument());
};

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(SEPTEMBER);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Road to Charleston", () => {
  it("puts the competition's own links at the very top", async () => {
    serve(
      getMockRawSchedule({
        links: [
          { label: "Rulebook", url: "https://fittestofthecoast.com/rulebook.pdf" },
          { label: "Leaderboard", url: "https://competitioncorner.net/ff/19273/results" },
        ],
      }),
    );

    await renderApp();

    const quickLinks = await screen.findByRole("navigation", { name: /competition links/i });
    const rulebook = within(quickLinks).getByRole("link", { name: /rulebook/i });

    expect(rulebook).toHaveAttribute("href", "https://fittestofthecoast.com/rulebook.pdf");
    expect(rulebook).toHaveAttribute("target", "_blank");
    expect(rulebook).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(within(quickLinks).getByRole("link", { name: /leaderboard/i })).toBeInTheDocument();
  });

  it("shows a link's note, so a not-yet-live link is not a surprise", async () => {
    serve(
      getMockRawSchedule({
        links: [
          { label: "Leaderboard", url: "https://competitioncorner.net/ff/19273/results", note: "soon" },
        ],
      }),
    );

    await renderApp();

    const quickLinks = await screen.findByRole("navigation", { name: /competition links/i });
    expect(within(quickLinks).getByText("soon")).toBeInTheDocument();
  });

  it("renders no link bar at all when the data has none", async () => {
    serve(getMockRawSchedule({ links: [] }));

    await renderApp();

    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());
    expect(screen.queryByRole("navigation", { name: /competition links/i })).not.toBeInTheDocument();
  });

  it("lists every scheduled event once the file loads", async () => {
    serve(scheduleOf());

    await renderApp();

    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());
    expect(within(board()).getByText("Workout 1 scores due")).toBeInTheDocument();
    expect(within(board()).getByText("Hold the Line heat one")).toBeInTheDocument();
  });

  it("groups events under the month they happen in, oldest first", async () => {
    serve(scheduleOf());

    await renderApp();

    await waitFor(() => expect(within(board()).getAllByRole("heading", { level: 3 })).toHaveLength(2));
    const months = within(board())
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(months).toEqual(["October 2026", "January 2027"]);
  });

  it("counts down to the soonest event still to come", async () => {
    serve(scheduleOf());

    await renderApp();

    const nextUp = await screen.findByRole("region", { name: /next up/i });
    expect(within(nextUp).getByText("Workout 1 released")).toBeInTheDocument();
  });

  it("narrows the roster to a division", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^team m\/f rx$/i }));

    expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument();
    expect(within(roster()).queryByText("Jamie Fox")).not.toBeInTheDocument();
  });

  it("narrows the roster to individuals only", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^individuals$/i }));

    expect(within(roster()).getByText("Jamie Fox")).toBeInTheDocument();
    expect(within(roster()).queryByText("Hold the Line")).not.toBeInTheDocument();
  });

  it("restores everything when the filter is cleared", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /^individuals$/i }));

    await userEvent.click(screen.getByRole("button", { name: /^all$/i }));

    expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument();
    expect(within(roster()).getByText("Jamie Fox")).toBeInTheDocument();
  });

  it("keeps gym-wide events visible under every filter", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^individuals$/i }));

    expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument();
    expect(within(board()).queryByText("Hold the Line heat one")).not.toBeInTheDocument();
  });

  it("describes only what is on screen when a filter hides the teams", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^individuals$/i }));

    expect(within(roster()).queryByText(/0 teams/i)).not.toBeInTheDocument();
    expect(within(roster()).getByText(/1 individual repping/i)).toBeInTheDocument();
  });

  it("offers no per-team chips, only divisions and entry types", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument());

    const filter = screen.getByRole("group", { name: /filter/i });

    expect(within(filter).queryByRole("button", { name: /^battery brothers$/i })).toBeNull();
  });

  it("lists the roster with each team's athletes", async () => {
    serve(scheduleOf());

    await renderApp();

    await waitFor(() => expect(within(roster()).getByText("Hold the Line")).toBeInTheDocument());
    expect(within(roster()).getByText("Jordan Reese")).toBeInTheDocument();
  });

  it("lists individual competitors as well as teams", async () => {
    serve(scheduleOf());

    await renderApp();

    await waitFor(() => expect(within(roster()).getByText("Jamie Fox")).toBeInTheDocument());
  });

  it("says a division is undecided rather than leaving it blank", async () => {
    serve(
      getMockRawSchedule({
        teams: [
          {
            id: "no-division",
            name: "Quarterly Gains",
            color: "#FF5959",
            athletes: ["Mike Sholar", "Caroline Ortiz"],
          },
        ],
        individuals: [],
        events: [],
      }),
    );

    await renderApp();

    await waitFor(() => expect(within(roster()).getByText("Quarterly Gains")).toBeInTheDocument());
    expect(within(roster()).getByText(/division tbd/i)).toBeInTheDocument();
  });

  it("explains what is wrong instead of rendering a blank page", async () => {
    serve(getMockRawSchedule({ events: [getMockRawEvent({ entrants: ["ghost-team"] })] }));

    await renderApp();

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/ghost-team/);
  });

  it("hides the countdown once every event is in the past", async () => {
    vi.setSystemTime(new Date("2027-06-01T12:00:00-04:00"));
    serve(scheduleOf());

    await renderApp();

    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());
    expect(screen.queryByRole("region", { name: /next up/i })).not.toBeInTheDocument();
  });

  it("shows each entrant's leaderboard place on their roster card", async () => {
    serveRanked();

    await renderApp();

    await waitFor(() => expect(within(roster()).getByText("Salt & Sand")).toBeInTheDocument());
    expect(within(roster()).getByText(/3rd of 60/)).toBeInTheDocument();
    expect(within(roster()).getByText(/10th of 20/)).toBeInTheDocument();
  });

  it("says a roster card is awaiting scores before any are revealed", async () => {
    serveRanked();

    await renderApp();

    await waitFor(() => expect(within(roster()).getByText("Jamie Fox")).toBeInTheDocument());
    expect(within(roster()).getByText(/awaiting scores/i)).toBeInTheDocument();
  });

  it("ranks our entrants best-first by how far up their division they are", async () => {
    serveRanked();

    await renderApp();

    await waitFor(() => expect(standingsSection()).toBeInTheDocument());
    const rows = within(standingsSection()).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0]?.textContent)).toEqual([
      expect.stringContaining("Salt & Sand"),
      expect.stringContaining("Hold the Line"),
      expect.stringContaining("Jamie Fox"),
    ]);
  });

  it("shows the rank on every workout in the standings", async () => {
    serveRanked();

    await renderApp();

    await waitFor(() => expect(standingsSection()).toBeInTheDocument());
    expect(
      within(standingsSection()).getByRole("columnheader", { name: "Workout 1" }),
    ).toBeInTheDocument();
    const saltRow = within(standingsSection()).getByRole("row", { name: /salt & sand/i });
    expect(within(saltRow).getByText("3rd")).toBeInTheDocument();
    expect(within(saltRow).getByText("212 reps")).toBeInTheDocument();
  });

  it("narrows the standings with the same filter as the roster", async () => {
    serveRanked();
    await renderApp();
    await waitFor(() => expect(standingsSection()).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /^individuals$/i }));

    expect(within(standingsSection()).queryByText("Salt & Sand")).not.toBeInTheDocument();
    expect(within(standingsSection()).getByText("Jamie Fox")).toBeInTheDocument();
  });

  it("says when the leaderboard was last read", async () => {
    serveRanked();

    await renderApp();

    await waitFor(() => expect(standingsSection()).toBeInTheDocument());
    expect(within(standingsSection()).getByText(/updated .*oct 8/i)).toBeInTheDocument();
  });
});
