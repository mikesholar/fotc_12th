import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSchedule } from "./validate-schedule";

const shipped = (): unknown =>
  JSON.parse(readFileSync("public/data/schedule.json", "utf-8"));

describe("The schedule file we actually ship", () => {
  it("passes the same validation the browser runs", () => {
    const result = validateSchedule(shipped());

    if (!result.ok) {
      throw new Error(`public/data/schedule.json is invalid:\n  ${result.errors.join("\n  ")}`);
    }
    expect(result.ok).toBe(true);
  });

  it("gives every entrant a colour, so no filter chip renders blank", () => {
    const result = validateSchedule(shipped());
    if (!result.ok) return;

    const entrants = [...result.value.teams, ...result.value.individuals];
    const missing = entrants.filter((entrant) => !/^#[0-9a-f]{6}$/i.test(entrant.color));

    expect(missing.map((entrant) => entrant.id)).toEqual([]);
  });

  it("has no empty teams", () => {
    const result = validateSchedule(shipped());
    if (!result.ok) return;

    const empty = result.value.teams.filter((team) => team.athletes.length === 0);

    expect(empty.map((team) => team.id)).toEqual([]);
  });
});
