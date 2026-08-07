import { describe, expect, it } from "vitest";
import { filterEventsByEntrant } from "./filter-events";
import { getMockEvent } from "../test/factories";

const events = [
  getMockEvent({ id: "everyone", entrants: "all" }),
  getMockEvent({ id: "ours", entrants: ["hold-the-line"] }),
  getMockEvent({ id: "theirs", entrants: ["salt-and-sand"] }),
  getMockEvent({ id: "solo", entrants: ["indy-jamie-fox"] }),
];

describe("Filtering the schedule by entrant", () => {
  it("shows every event when nothing is selected", () => {
    const visible = filterEventsByEntrant(events, "all");

    expect(visible.map((e) => e.id)).toEqual(["everyone", "ours", "theirs", "solo"]);
  });

  it("shows gym-wide events alongside the selected team's own events", () => {
    const visible = filterEventsByEntrant(events, "hold-the-line");

    expect(visible.map((e) => e.id)).toEqual(["everyone", "ours"]);
  });

  it("hides events belonging only to other entrants", () => {
    const visible = filterEventsByEntrant(events, "hold-the-line");

    expect(visible.map((e) => e.id)).not.toContain("theirs");
  });

  it("filters to an individual competitor the same way as a team", () => {
    const visible = filterEventsByEntrant(events, "indy-jamie-fox");

    expect(visible.map((e) => e.id)).toEqual(["everyone", "solo"]);
  });

  it("still shows gym-wide events for an entrant with nothing of their own", () => {
    const visible = filterEventsByEntrant(events, "tide-and-timber");

    expect(visible.map((e) => e.id)).toEqual(["everyone"]);
  });
});
