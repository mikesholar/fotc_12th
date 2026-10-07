import { describe, expect, it } from "vitest";
import { ALL, buildFilterBar, entrantIdsMatching, matchesFilter } from "./entrant-filter";
import { getMockSchedule } from "../test/factories";

const schedule = getMockSchedule({
  teams: [
    {
      id: "novice-team",
      name: "Quarterly Gains",
      division: "Novice",
      color: "#FF5959",
      athletes: ["Mike Sholar", "Caroline Ortiz"],
    },
    {
      id: "intermediate-team",
      name: "From Wod to Wed",
      division: "Intermediate",
      color: "#27CFE6",
      athletes: ["Emily Moise", "Kyle Fiala"],
    },
    {
      id: "no-division-team",
      name: "Sarah / Debra",
      color: "#FFC24B",
      athletes: ["Sarah", "Debra"],
    },
  ],
  individuals: [
    { id: "indy-novice", name: "Jen Edwards", division: "Novice", color: "#4ADE80" },
    { id: "indy-teen", name: "Somi Kammer", division: "Teen", color: "#8B7CF6" },
  ],
  events: [],
});

const labelsOf = (options: readonly { readonly label: string }[]): readonly string[] =>
  options.map((option) => option.label);

const leaderboardSchedule = getMockSchedule({
  teams: [
    "Team Novice Co-Ed",
    "Team 45+ Co-Ed",
    "Team PRO/RX Men",
    "Team 35+ Co-Ed",
    "Team Intermediate Women",
  ].map((division, i) => ({
    id: `team-${i}`,
    name: `Team ${i}`,
    division,
    color: "#FF5959",
    athletes: ["A", "B"],
  })),
  individuals: [
    "Teen Girls (13-15)",
    "50-54 Male",
    "Novice Male",
    "35-39 Male",
    "PRO/RX Female",
    "Intermediate Men",
  ].map((division, i) => ({ id: `indy-${i}`, name: `Solo ${i}`, division, color: "#4ADE80" })),
  events: [],
});

describe("Grouping the filter chips by entry type", () => {
  it("starts with just everyone and the two entry types", () => {
    const bar = buildFilterBar(schedule, ALL);

    expect(labelsOf(bar.types)).toEqual(["All", "Teams", "Individuals"]);
    expect(bar.divisions).toEqual([]);
    expect(bar.activeType).toBeUndefined();
  });

  it("reveals only team divisions once Teams is chosen, without repeating 'Team'", () => {
    const bar = buildFilterBar(leaderboardSchedule, "type:team");

    expect(bar.activeType).toBe("team");
    expect(labelsOf(bar.divisions)).toEqual([
      "PRO/RX Men",
      "Intermediate Women",
      "Novice Co-Ed",
      "35+ Co-Ed",
      "45+ Co-Ed",
    ]);
  });

  it("reveals individual divisions by level, age groups youngest first, teens last", () => {
    const bar = buildFilterBar(leaderboardSchedule, "type:individual");

    expect(labelsOf(bar.divisions)).toEqual([
      "PRO/RX Female",
      "Intermediate Men",
      "Novice Male",
      "35-39 Male",
      "50-54 Male",
      "Teen Girls (13-15)",
    ]);
  });

  it("keeps a chosen division's siblings on show and its entry type marked", () => {
    const bar = buildFilterBar(leaderboardSchedule, "div:Team Novice Co-Ed");

    expect(bar.activeType).toBe("team");
    expect(labelsOf(bar.divisions)).toContain("45+ Co-Ed");
    expect(bar.divisions.map((option) => option.id)).toContain("div:Team Novice Co-Ed");
  });

  it("lists a division shared by teams and individuals under both", () => {
    expect(labelsOf(buildFilterBar(schedule, "type:team").divisions)).toContain("Novice");
    expect(labelsOf(buildFilterBar(schedule, "type:individual").divisions)).toContain("Novice");
  });

  it("shows every division straight away when there is only one entry type", () => {
    const teamsOnly = getMockSchedule({ individuals: [], events: [] });

    const bar = buildFilterBar(teamsOnly, ALL);

    expect(labelsOf(bar.types)).toEqual(["All"]);
    expect(labelsOf(bar.divisions)).toEqual(["Team M/F Rx"]);
  });
});

describe("Filtering by division or entry type", () => {
  it("matches every entrant when nothing is selected", () => {
    expect(entrantIdsMatching(schedule, ALL)).toBe(ALL);
  });

  it("narrows to teams only", () => {
    expect(entrantIdsMatching(schedule, "type:team")).toEqual([
      "novice-team",
      "intermediate-team",
      "no-division-team",
    ]);
  });

  it("narrows to individuals only", () => {
    expect(entrantIdsMatching(schedule, "type:individual")).toEqual(["indy-novice", "indy-teen"]);
  });

  it("narrows to a division across both teams and individuals", () => {
    expect(entrantIdsMatching(schedule, "div:Novice")).toEqual(["novice-team", "indy-novice"]);
  });

  it("excludes entrants with no division from every division filter", () => {
    const ids = entrantIdsMatching(schedule, "div:Novice");

    expect(ids).not.toContain("no-division-team");
  });

  it("returns nothing for a division that no longer exists", () => {
    expect(entrantIdsMatching(schedule, "div:Masters")).toEqual([]);
  });

  it("tells a component whether one entrant survives the current filter", () => {
    const team = schedule.teams[0];
    if (!team) throw new Error("fixture missing");

    expect(matchesFilter(team, "team", "div:Novice")).toBe(true);
    expect(matchesFilter(team, "team", "div:Teen")).toBe(false);
    expect(matchesFilter(team, "team", "type:individual")).toBe(false);
    expect(matchesFilter(team, "team", ALL)).toBe(true);
  });
});
