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

  it("reads the quick links shown at the top of the page", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        links: [
          { label: "Rulebook", url: "https://example.com/rulebook.pdf" },
          { label: "Leaderboard", url: "https://example.com/results", note: "soon" },
        ],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.links).toHaveLength(2);
    expect(result.value.links[1]?.note).toBe("soon");
  });

  it("treats a schedule with no links as valid", () => {
    const result = validateSchedule(getMockRawSchedule({ links: undefined }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.links).toEqual([]);
  });

  it("rejects a link that is not a real URL", () => {
    const result = validateSchedule(
      getMockRawSchedule({ links: [{ label: "Rulebook", url: "rulebook.pdf" }] }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("url");
  });

  it("rejects a link with no label", () => {
    const result = validateSchedule(
      getMockRawSchedule({ links: [{ url: "https://example.com" }] }),
    );

    expect(result.ok).toBe(false);
  });

  it("rejects a payload that is not an object", () => {
    const result = validateSchedule("not a schedule");

    expect(result.ok).toBe(false);
  });
});

describe("Leaderboard standings on the roster", () => {
  const standing = {
    place: 3,
    fieldSize: 42,
    points: 12,
    workouts: [{ name: "Workout 1", rank: 3, result: "212 reps" }],
  };

  it("keeps each entrant's place and workout ranks", () => {
    const result = validateSchedule(
      getMockRawSchedule({
        teams: [getMockRawTeam({ standing })],
        individuals: [getMockRawIndividual({ standing })],
      }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.teams[0]?.standing).toEqual(standing);
    expect(result.value.individuals[0]?.standing).toEqual(standing);
  });

  it("keeps when the standings were last read", () => {
    const result = validateSchedule(
      getMockRawSchedule({ standingsUpdatedAt: "2026-10-08T12:00:00.000Z" }),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.standingsUpdatedAt).toBe("2026-10-08T12:00:00.000Z");
  });

  it("rejects a standing without a field size", () => {
    const result = validateSchedule(
      getMockRawSchedule({ teams: [getMockRawTeam({ standing: { place: 3, workouts: [] } })] }),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/teams\[0\].*fieldSize/);
  });
});
