import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { validateSchedule } from "./validate-schedule";
import { readLeaderboardConfig } from "../standings/build-standings";

const shipped = (): Record<string, unknown> =>
  JSON.parse(readFileSync("public/data/schedule.json", "utf-8"));

describe("The schedule file we actually ship", () => {
  it("passes the same validation the browser runs, once the leaderboard roster is added", () => {
    const result = validateSchedule({ ...shipped(), teams: [], individuals: [] });

    if (!result.ok) {
      throw new Error(`public/data/schedule.json is invalid:\n  ${result.errors.join("\n  ")}`);
    }
    expect(result.ok).toBe(true);
  });

  it("tells the standings fetcher which leaderboard to read", () => {
    const result = readLeaderboardConfig(shipped());

    if (!result.ok) throw new Error(result.errors.join("\n"));
    expect(result.value.eventId).toBeGreaterThan(0);
  });
});
