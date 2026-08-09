import { describe, expect, it } from "vitest";
import { ALL, buildFilterOptions, entrantIdsMatching, matchesFilter } from "./entrant-filter";
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

describe("Filtering by division or entry type", () => {
  it("offers everyone, both entry types, then each division alphabetically", () => {
    const labels = buildFilterOptions(schedule).map((option) => option.label);

    expect(labels).toEqual([
      "All",
      "Teams",
      "Individuals",
      "Intermediate",
      "Novice",
      "Teen",
    ]);
  });

  it("lists each division once even when several entrants share it", () => {
    const novice = buildFilterOptions(schedule).filter((o) => o.label === "Novice");

    expect(novice).toHaveLength(1);
  });

  it("omits the entry-type options when there are no individuals", () => {
    const teamsOnly = getMockSchedule({ individuals: [], events: [] });

    const labels = buildFilterOptions(teamsOnly).map((option) => option.label);

    expect(labels).not.toContain("Individuals");
  });

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
