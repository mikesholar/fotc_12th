import { describe, expect, it } from "vitest";
import { findNextEvent } from "./next-event";
import { getMockEvent } from "../test/factories";

const NOW = new Date("2026-10-09T12:00:00-04:00");

describe("Finding the next event", () => {
  it("picks the soonest event that has not started yet", () => {
    const events = [
      getMockEvent({ id: "past", start: "2026-10-01T19:00:00-04:00" }),
      getMockEvent({ id: "soonest", start: "2026-10-14T21:00:00-04:00" }),
      getMockEvent({ id: "later", start: "2026-10-15T19:00:00-04:00" }),
    ];

    expect(findNextEvent(events, NOW)?.id).toBe("soonest");
  });

  it("finds the next event even when the list is out of order", () => {
    const events = [
      getMockEvent({ id: "later", start: "2026-10-22T19:00:00-04:00" }),
      getMockEvent({ id: "soonest", start: "2026-10-14T21:00:00-04:00" }),
    ];

    expect(findNextEvent(events, NOW)?.id).toBe("soonest");
  });

  it("returns nothing once every event is in the past", () => {
    const events = [getMockEvent({ id: "past", start: "2026-10-01T19:00:00-04:00" })];

    expect(findNextEvent(events, NOW)).toBeUndefined();
  });

  it("returns nothing when there are no events at all", () => {
    expect(findNextEvent([], NOW)).toBeUndefined();
  });
});
