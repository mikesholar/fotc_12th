import { describe, expect, it } from "vitest";
import { groupEventsByMonth } from "./group-events";
import { getMockEvent } from "../test/factories";

describe("Grouping the schedule by month", () => {
  it("groups events under the month they fall in", () => {
    const groups = groupEventsByMonth([
      getMockEvent({ id: "oct-1", start: "2026-10-01T19:00:00-04:00" }),
      getMockEvent({ id: "oct-28", start: "2026-10-28T21:00:00-04:00" }),
      getMockEvent({
        id: "jan",
        start: "2027-01-15T09:00:00-05:00",
        phase: "championship",
      }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.label).toBe("October 2026");
    expect(groups[0]?.events.map((e) => e.id)).toEqual(["oct-1", "oct-28"]);
    expect(groups[1]?.label).toBe("January 2027");
  });

  it("orders months and the events inside them oldest first", () => {
    const groups = groupEventsByMonth([
      getMockEvent({ id: "jan", start: "2027-01-15T09:00:00-05:00", phase: "championship" }),
      getMockEvent({ id: "oct-28", start: "2026-10-28T21:00:00-04:00" }),
      getMockEvent({ id: "oct-1", start: "2026-10-01T19:00:00-04:00" }),
    ]);

    expect(groups.map((g) => g.label)).toEqual(["October 2026", "January 2027"]);
    expect(groups[0]?.events.map((e) => e.id)).toEqual(["oct-1", "oct-28"]);
  });

  it("produces no groups for an empty schedule", () => {
    expect(groupEventsByMonth([])).toEqual([]);
  });
});
