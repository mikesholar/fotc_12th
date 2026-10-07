import { afterEach, describe, expect, it, vi } from "vitest";
import { loadSchedule } from "./load-schedule";
import {
  getMockRawEvent,
  getMockRawIndividual,
  getMockRawSchedule,
  getMockRawTeam,
} from "../test/factories";
import { serveFiles } from "../test/serve-files";

const getMockRawStandings = (overrides?: Record<string, unknown>): Record<string, unknown> => ({
  updatedAt: "2026-10-08T12:00:00.000Z",
  teams: [getMockRawTeam({ id: "cc-1", name: "From The Leaderboard" })],
  individuals: [getMockRawIndividual({ id: "cc-2", name: "Solo From The Leaderboard" })],
  ...overrides,
});

const respondWith = (body: unknown, ok = true, status = 200): void => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status,
      json: async () => body,
    }),
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Loading the roster from the leaderboard standings", () => {
  it("takes the teams and individuals from the standings file", async () => {
    serveFiles({
      "schedule.json": getMockRawSchedule({ teams: undefined, individuals: undefined }),
      "standings.json": getMockRawStandings(),
    });

    const result = await loadSchedule();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.teams.map((team) => team.name)).toEqual(["From The Leaderboard"]);
    expect(result.value.individuals.map((i) => i.name)).toEqual(["Solo From The Leaderboard"]);
    expect(result.value.standingsUpdatedAt).toBe("2026-10-08T12:00:00.000Z");
  });

  it("lets schedule events refer to leaderboard entrants", async () => {
    serveFiles({
      "schedule.json": getMockRawSchedule({
        teams: undefined,
        individuals: undefined,
        events: [getMockRawEvent({ entrants: ["cc-1"] })],
      }),
      "standings.json": getMockRawStandings(),
    });

    const result = await loadSchedule();

    expect(result.ok).toBe(true);
  });

  it("explains how to create the standings file when it is missing", async () => {
    serveFiles({ "schedule.json": getMockRawSchedule() });

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/standings\.json.*npm run standings/);
  });
});

describe("Loading the schedule file", () => {
  it("returns the schedule when the file is valid", async () => {
    respondWith(getMockRawSchedule());

    const result = await loadSchedule();

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.gym.name).toBe("12th State CrossFit");
  });

  it("reports validation problems instead of returning a broken schedule", async () => {
    respondWith(getMockRawSchedule({ teams: "not an array" }));

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("teams");
  });

  it("reports a readable error when the file cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/could not load/i);
  });

  it("reports a readable error when the file is missing", async () => {
    respondWith(undefined, false, 404);

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toContain("404");
  });

  it("reports a readable error when the file is not valid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token }");
        },
      }),
    );

    const result = await loadSchedule();

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/not valid json/i);
  });
});
