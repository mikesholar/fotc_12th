import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { getMockRawEvent, getMockRawSchedule } from "./test/factories";

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

  it("shows a team's own events alongside gym-wide ones when filtered", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /hold the line/i }));

    expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument();
    expect(within(board()).getByText("Hold the Line heat one")).toBeInTheDocument();
    expect(within(board()).queryByText("Salt and Sand heat one")).not.toBeInTheDocument();
  });

  it("restores the full schedule when the filter is cleared", async () => {
    serve(scheduleOf());
    await renderApp();
    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /hold the line/i }));

    await userEvent.click(screen.getByRole("button", { name: /all teams/i }));

    expect(within(board()).getByText("Salt and Sand heat one")).toBeInTheDocument();
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

  it("filters the schedule down to an individual competitor", async () => {
    serve(
      scheduleOf([
        ...defaultEvents,
        getMockRawEvent({
          id: "solo-heat",
          kind: "comp",
          title: "Jamie Fox heat one",
          start: "2027-01-16T09:00:00-05:00",
          phase: "championship",
          entrants: ["indy-jamie-fox"],
        }),
      ]),
    );
    await renderApp();
    await waitFor(() => expect(within(board()).getByText("Workout 1 released")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /jamie fox/i }));

    expect(within(board()).getByText("Jamie Fox heat one")).toBeInTheDocument();
    expect(within(board()).queryByText("Hold the Line heat one")).not.toBeInTheDocument();
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
});
