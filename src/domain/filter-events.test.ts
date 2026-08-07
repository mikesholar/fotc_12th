import { describe, expect, it } from "vitest";
import { filterEventsByTeam } from "./filter-events";
import { getMockEvent } from "../test/factories";

const events = [
  getMockEvent({ id: "everyone", teams: "all" }),
  getMockEvent({ id: "ours", teams: ["hold-the-line"] }),
  getMockEvent({ id: "theirs", teams: ["salt-and-sand"] }),
];

describe("Filtering the schedule by team", () => {
  it("shows every event when no team is selected", () => {
    const visible = filterEventsByTeam(events, "all");

    expect(visible.map((e) => e.id)).toEqual(["everyone", "ours", "theirs"]);
  });

  it("shows gym-wide events alongside the selected team's own events", () => {
    const visible = filterEventsByTeam(events, "hold-the-line");

    expect(visible.map((e) => e.id)).toEqual(["everyone", "ours"]);
  });

  it("hides events belonging only to other teams", () => {
    const visible = filterEventsByTeam(events, "hold-the-line");

    expect(visible.map((e) => e.id)).not.toContain("theirs");
  });

  it("still shows gym-wide events for a team with no events of its own", () => {
    const visible = filterEventsByTeam(events, "tide-and-timber");

    expect(visible.map((e) => e.id)).toEqual(["everyone"]);
  });
});
