import { describe, expect, it } from "vitest";
import { validateSchedule } from "./validate-schedule";
import { getMockRawEvent, getMockRawSchedule } from "../test/factories";

describe("Schedule validation", () => {
  it("accepts a well-formed schedule", () => {
    const result = validateSchedule(getMockRawSchedule());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.gym.name).toBe("12th State CrossFit");
    expect(result.value.teams).toHaveLength(4);
    expect(result.value.events).toHaveLength(1);
  });

  it("rejects an event assigned to a team that does not exist", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        events: [getMockRawEvent({ teams: ["hold-the-line", "ghost-team"] })],
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("ghost-team");
  });

  it("rejects an event that ends before it starts", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        events: [
          getMockRawEvent({
            start: "2027-01-17T09:00:00-05:00",
            end: "2027-01-15T09:00:00-05:00",
          }),
        ],
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/end/i);
  });

  it("rejects an event whose start is not a usable date", () => {
    const result = validateSchedule(
      getMockRawSchedule({ events: [getMockRawEvent({ start: "next thursday" })] }),
    );

    expect(result.ok).toBe(false);
  });

  it("reports the offending field when a required value is missing", () => {
    const result = validateSchedule(
      getMockRawSchedule({ events: [getMockRawEvent({ title: "" })] }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("title");
  });

  it("rejects a payload that is not an object", () => {
    const result = validateSchedule("not a schedule");

    expect(result.ok).toBe(false);
  });
});
