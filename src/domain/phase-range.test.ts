import { describe, expect, it } from "vitest";
import { phaseRange } from "./phase-range";
import { getMockEvent } from "../test/factories";

describe("Summarising a phase's date range", () => {
  it("collapses a range inside one month to a single month name", () => {
    const events = [
      getMockEvent({ id: "a", start: "2026-10-01T19:00:00-04:00" }),
      getMockEvent({ id: "b", start: "2026-10-28T21:00:00-04:00" }),
    ];

    expect(phaseRange(events, "qualifier")).toBe("Oct 1–28");
  });

  it("names both months when the range crosses a boundary", () => {
    const events = [
      getMockEvent({ id: "a", phase: "championship", start: "2026-12-30T09:00:00-05:00" }),
      getMockEvent({ id: "b", phase: "championship", start: "2027-01-02T09:00:00-05:00" }),
    ];

    expect(phaseRange(events, "championship")).toBe("Dec 30 – Jan 2");
  });

  it("shows a single date when the phase has only one event", () => {
    const events = [getMockEvent({ id: "a", start: "2026-10-01T19:00:00-04:00" })];

    expect(phaseRange(events, "qualifier")).toBe("Oct 1");
  });

  it("spans to an event's end date for a multi-day event", () => {
    const events = [
      getMockEvent({
        id: "champs",
        phase: "championship",
        start: "2027-01-15T08:00:00-05:00",
        end: "2027-01-17T18:00:00-05:00",
      }),
    ];

    expect(phaseRange(events, "championship")).toBe("Jan 15–17");
  });

  it("returns nothing when the phase has no events", () => {
    expect(phaseRange([], "championship")).toBeUndefined();
  });

  it("ignores events belonging to a different phase", () => {
    const events = [
      getMockEvent({ id: "a", start: "2026-10-01T19:00:00-04:00" }),
      getMockEvent({ id: "b", phase: "championship", start: "2027-01-15T09:00:00-05:00" }),
    ];

    expect(phaseRange(events, "championship")).toBe("Jan 15");
  });
});
