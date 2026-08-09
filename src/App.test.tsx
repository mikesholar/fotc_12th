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
});
