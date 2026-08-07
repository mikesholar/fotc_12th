import { describe, expect, it } from "vitest";
import { validateSchedule } from "./validate-schedule";
import {
  getMockRawEvent,
  getMockRawIndividual,
  getMockRawSchedule,
  getMockRawTeam,
} from "../test/factories";

describe("Schedule validation", () => {
  it("accepts a well-formed schedule", () => {
    const result = validateSchedule(getMockRawSchedule());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.gym.name).toBe("12th State CrossFit");
    expect(result.value.teams).toHaveLength(4);
    expect(result.value.events).toHaveLength(1);
  });

  it("rejects an event assigned to an entrant that does not exist", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        events: [getMockRawEvent({ entrants: ["hold-the-line", "ghost-team"] })],
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("ghost-team");
  });

  it("accepts an event assigned to an individual competitor", () => {
    const result = validateSchedule(
      getMockRawSchedule({ events: [getMockRawEvent({ entrants: ["indy-jamie-fox"] })] }),
    );

    expect(result.ok).toBe(true);
  });

  it("reads individual competitors alongside teams", () => {
    const result = validateSchedule(getMockRawSchedule());

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.individuals).toHaveLength(1);
    expect(result.value.individuals[0]?.name).toBe("Jamie Fox");
  });

  it("treats a roster with no individuals as valid", () => {
    const result = validateSchedule(getMockRawSchedule({ individuals: undefined }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.individuals).toEqual([]);
  });

  it("accepts a team whose division has not been decided", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        teams: [getMockRawTeam({ division: undefined })],
        events: [],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.teams[0]?.division).toBeUndefined();
  });

  it("rejects an id reused between a team and an individual", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        individuals: [getMockRawIndividual({ id: "hold-the-line" })],
        events: [],
      }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("hold-the-line");
  });

  it("rejects two teams sharing an id", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        teams: [getMockRawTeam(), getMockRawTeam({ name: "Different Name" })],
        events: [],
      }),
    );

    expect(result.ok).toBe(false);
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
