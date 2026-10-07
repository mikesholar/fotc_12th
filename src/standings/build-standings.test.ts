import { describe, expect, it } from "vitest";
import { buildStandings, readLeaderboardConfig, type StandingsFile } from "./build-standings";
import {
  getMockRawDivisionTab,
  getMockRawIndividualTab,
  getMockRawLeaderboardIndividual,
  getMockRawLeaderboardTeam,
  getMockRawWorkout,
  getMockRawWorkoutScore,
} from "../test/leaderboard-factories";

const FETCHED_AT = "2026-10-08T12:00:00.000Z";

const build = (tabs: readonly unknown[], include: readonly string[] = []): StandingsFile => {
  const result = buildStandings({ tabs, include, fetchedAt: FETCHED_AT });
  if (!result.ok) throw new Error(result.errors.join("\n"));
  return result.value;
};

describe("Building the roster from the leaderboard", () => {
  it("lists 12th State teams with their athletes and division", () => {
    const standings = build([getMockRawDivisionTab()]);

    expect(standings.teams).toEqual([
      expect.objectContaining({
        id: "cc-1600001",
        name: "Hold the Line",
        division: "Team Novice Co-Ed",
        athletes: ["Jordan Reese", "Morgan Cade"],
      }),
    ]);
    expect(standings.individuals).toEqual([]);
  });

  it("lists 12th State individuals separately from teams", () => {
    const standings = build([getMockRawIndividualTab()]);

    expect(standings.individuals).toEqual([
      expect.objectContaining({ id: "cc-1500001", name: "Jamie Fox", division: "Novice Male" }),
    ]);
    expect(standings.teams).toEqual([]);
  });

  it("leaves out athletes from other gyms", () => {
    const standings = build([
      getMockRawIndividualTab({
        athletes: [getMockRawLeaderboardIndividual({ affiliate: "CROSSFIT LOWCO" })],
      }),
    ]);

    expect(standings.individuals).toEqual([]);
  });

  it("recognises the gym however the athlete spelled it", () => {
    const spellings = ["12TH STATE", "12TH STATE CROSFIT", "12th State CrossFit"];
    const standings = build([
      getMockRawIndividualTab({
        athletes: spellings.map((affiliate, i) =>
          getMockRawLeaderboardIndividual({ affiliate, ptcpID: String(i), name: `Athlete ${i}` }),
        ),
      }),
    ]);

    expect(standings.individuals).toHaveLength(3);
  });

  it("includes entries registered under another gym when named in the include list", () => {
    const standings = build(
      [
        getMockRawDivisionTab({
          athletes: [getMockRawLeaderboardTeam({ name: "Chalk Dirty", affiliate: "CROSSFIT EXP" })],
        }),
      ],
      ["Chalk Dirty"],
    );

    expect(standings.teams.map((team) => team.name)).toEqual(["Chalk Dirty"]);
  });

  it("lists an entrant once even when two leaderboard tabs share a division", () => {
    const standings = build([getMockRawIndividualTab(), getMockRawIndividualTab()]);

    expect(standings.individuals).toHaveLength(1);
  });

  it("tidies stray spaces in division names", () => {
    const standings = build([
      getMockRawDivisionTab({
        scoringGroup: { divisionId: 147831, caption: "Team 55+  Co-Ed ", team: true },
      }),
    ]);

    expect(standings.teams[0]?.division).toBe("Team 55+ Co-Ed");
  });

  it("gives every entrant a distinct colour", () => {
    const standings = build([
      getMockRawIndividualTab({
        athletes: [0, 1, 2].map((i) =>
          getMockRawLeaderboardIndividual({ ptcpID: String(i), name: `Athlete ${i}` }),
        ),
      }),
    ]);

    const colors = standings.individuals.map((individual) => individual.color);
    expect(new Set(colors).size).toBe(3);
    colors.forEach((color) => expect(color).toMatch(/^#[0-9A-F]{6}$/i));
  });

  it("stamps when the leaderboard was read", () => {
    expect(build([getMockRawDivisionTab()]).updatedAt).toBe(FETCHED_AT);
  });
});

describe("Reading places from the leaderboard", () => {
  it("records overall place out of the whole division, with points", () => {
    const others = [1, 2, 3].map((i) =>
      getMockRawLeaderboardTeam({ ptcpID: `other-${i}`, affiliate: "ELSEWHERE" }),
    );
    const standings = build([
      getMockRawDivisionTab({
        athletes: [getMockRawLeaderboardTeam({ place: "3", totalPoints: "12" }), ...others],
      }),
    ]);

    expect(standings.teams[0]?.standing).toEqual(
      expect.objectContaining({ place: 3, fieldSize: 4, points: 12 }),
    );
  });

  it("has no place before any scores are revealed", () => {
    const standings = build([getMockRawDivisionTab()]);

    expect(standings.teams[0]?.standing).toEqual(
      expect.objectContaining({ place: undefined, fieldSize: 1 }),
    );
  });

  it("records the rank and score on each announced workout", () => {
    const standings = build([
      getMockRawDivisionTab({
        workouts: [
          getMockRawWorkout(),
          getMockRawWorkout({ id: 132613, key: "workout_132613", name: "To Be Announced", showDetails: false }),
        ],
        athletes: [
          getMockRawLeaderboardTeam({
            place: "5",
            workoutScores: {
              workout_132104: getMockRawWorkoutScore({ rank: "5", res: "212 reps" }),
              workout_132613: getMockRawWorkoutScore({ workoutId: 132613 }),
            },
          }),
        ],
      }),
    ]);

    expect(standings.teams[0]?.standing?.workouts).toEqual([
      { name: "Workout 1", rank: 5, result: "212 reps" },
    ]);
  });

  it("leaves a workout unranked until its score is revealed", () => {
    const standings = build([getMockRawDivisionTab()]);

    expect(standings.teams[0]?.standing?.workouts).toEqual([
      { name: "Workout 1", rank: undefined, result: undefined },
    ]);
  });

  it("reads tied places like '4T' as fourth", () => {
    const standings = build([
      getMockRawDivisionTab({ athletes: [getMockRawLeaderboardTeam({ place: "4T" })] }),
    ]);

    expect(standings.teams[0]?.standing?.place).toBe(4);
  });
});

describe("Rejecting a leaderboard we cannot read", () => {
  it("explains which tab is malformed rather than writing a broken file", () => {
    const result = buildStandings({
      tabs: [getMockRawDivisionTab({ athletes: "nope" })],
      include: [],
      fetchedAt: FETCHED_AT,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/Team Novice Co-Ed.*athletes/);
  });
});

describe("Reading the leaderboard settings from schedule.json", () => {
  it("reads the event id and the extra entrants to include", () => {
    const result = readLeaderboardConfig({
      leaderboard: { eventId: 21880, include: ["Chalk Dirty"] },
    });

    expect(result).toEqual({ ok: true, value: { eventId: 21880, include: ["Chalk Dirty"] } });
  });

  it("treats a missing include list as nobody extra", () => {
    const result = readLeaderboardConfig({ leaderboard: { eventId: 21880 } });

    expect(result).toEqual({ ok: true, value: { eventId: 21880, include: [] } });
  });

  it("explains a missing event id", () => {
    const result = readLeaderboardConfig({ leaderboard: {} });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(" ")).toMatch(/leaderboard.*eventId/);
  });
});
