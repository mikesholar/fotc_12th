import { describe, expect, it } from "vitest";
import { filterEventsForEntrants } from "./filter-events";
import { ALL } from "./entrant-filter";
import { getMockEvent } from "../test/factories";

const events = [
  getMockEvent({ id: "everyone", entrants: "all" }),
  getMockEvent({ id: "ours", entrants: ["hold-the-line"] }),
  getMockEvent({ id: "theirs", entrants: ["salt-and-sand"] }),
  getMockEvent({ id: "solo", entrants: ["indy-jamie-fox"] }),
];

describe("Filtering the schedule to a set of entrants", () => {
  it("shows every event when nothing is narrowed", () => {
    const visible = filterEventsForEntrants(events, ALL);

    expect(visible.map((e) => e.id)).toEqual(["everyone", "ours", "theirs", "solo"]);
  });

  it("keeps gym-wide events whatever the selection", () => {
    const visible = filterEventsForEntrants(events, ["hold-the-line"]);

    expect(visible.map((e) => e.id)).toContain("everyone");
  });

  it("keeps an event when any of the selected entrants is on it", () => {
    const visible = filterEventsForEntrants(events, ["hold-the-line", "indy-jamie-fox"]);

    expect(visible.map((e) => e.id)).toEqual(["everyone", "ours", "solo"]);
  });

  it("drops events belonging only to entrants outside the selection", () => {
    const visible = filterEventsForEntrants(events, ["hold-the-line"]);

    expect(visible.map((e) => e.id)).not.toContain("theirs");
  });

  it("still shows gym-wide events when the selection matches nobody", () => {
    const visible = filterEventsForEntrants(events, []);

    expect(visible.map((e) => e.id)).toEqual(["everyone"]);
  });
});
