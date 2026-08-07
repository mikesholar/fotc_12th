import { describe, expect, it } from "vitest";
import { formatDayLabel, formatEventTime } from "./format-event-time";

const WOD_DROP = "2026-10-01T19:00:00-04:00";

describe("Showing event times", () => {
  it("always labels the official time in Eastern, matching how FOTC publishes it", () => {
    const { et } = formatEventTime(WOD_DROP, "America/New_York");

    expect(et).toBe("7:00 PM ET");
  });

  it("adds the viewer's local time when they are in a different zone", () => {
    const { local } = formatEventTime(WOD_DROP, "America/Los_Angeles");

    expect(local).toBe("4:00 PM");
  });

  it("omits the local time for a viewer already on Eastern", () => {
    const { local } = formatEventTime(WOD_DROP, "America/New_York");

    expect(local).toBeUndefined();
  });

  it("labels the day using the viewer's own calendar date", () => {
    const label = formatDayLabel(WOD_DROP, "America/New_York");

    expect(label.weekday).toBe("Thu");
    expect(label.date).toBe("Oct 1");
  });

  it("rolls the day back for a viewer whose date differs from Eastern", () => {
    const lateDeadline = "2026-10-08T00:30:00-04:00";

    const label = formatDayLabel(lateDeadline, "America/Los_Angeles");

    expect(label.weekday).toBe("Wed");
    expect(label.date).toBe("Oct 7");
  });
});
