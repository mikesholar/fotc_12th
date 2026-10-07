import type { Individual, Result, Standing, Team, WorkoutStanding } from "../types/schedule";

export type StandingsFile = {
  readonly updatedAt: string;
  readonly teams: readonly Team[];
  readonly individuals: readonly Individual[];
};

type BuildStandingsOptions = {
  readonly tabs: readonly unknown[];
  readonly include: readonly string[];
  readonly fetchedAt: string;
};

export type LeaderboardConfig = {
  readonly eventId: number;
  readonly include: readonly string[];
};

type Unknown = Record<string, unknown>;

type LeaderboardWorkout = { readonly key: string; readonly name: string };

type LeaderboardEntry = {
  readonly id: string;
  readonly name: string;
  readonly isTeam: boolean;
  readonly division: string;
  readonly athletes: readonly string[];
  readonly standing: Standing;
};

const GYM_AFFILIATE = /12\s*th\s+state/i;

const PALETTE = [
  "#FF5959", "#27CFE6", "#FFC24B", "#8B7CF6", "#4ADE80", "#F472B6",
  "#38BDF8", "#FB923C", "#A3E635", "#2DD4BF", "#E879F9", "#FACC15",
] as const;

const isObject = (value: unknown): value is Unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const text = (value: unknown): string =>
  typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";

const leadingNumber = (value: unknown): number | undefined => {
  const parsed = Number.parseInt(text(value), 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const colorAt = (index: number): string => PALETTE[index % PALETTE.length] ?? PALETTE[0];

const readWorkouts = (raw: unknown): readonly LeaderboardWorkout[] =>
  Array.isArray(raw)
    ? raw
        .filter(isObject)
        .filter((workout) => workout["showDetails"] === true)
        .map((workout) => ({ key: text(workout["key"]), name: text(workout["name"]) }))
    : [];

const readWorkoutStanding = (
  scores: unknown,
  workout: LeaderboardWorkout,
  place: number | undefined,
): WorkoutStanding => {
  const score = isObject(scores) ? scores[workout.key] : undefined;
  const rank = isObject(score) ? leadingNumber(score["rank"]) : undefined;
  const result = isObject(score) ? text(score["res"]) : "";
  const isRevealed = place !== undefined && rank !== undefined && result !== "-";
  return {
    name: workout.name,
    rank: isRevealed ? rank : undefined,
    result: isRevealed && result !== "" ? result : undefined,
  };
};

const athletesOf = (athlete: Unknown): readonly string[] => {
  const teammates = athlete["teammates"];
  if (Array.isArray(teammates) && teammates.length > 0) {
    return teammates.filter(isObject).map((mate) => text(mate["athleteName"]));
  }
  return [text(athlete["name"])];
};

const isOurs = (athlete: Unknown, include: readonly string[]): boolean =>
  GYM_AFFILIATE.test(text(athlete["affiliate"])) || include.includes(text(athlete["name"]));

const readTab = (
  raw: unknown,
  index: number,
  include: readonly string[],
  errors: string[],
): readonly LeaderboardEntry[] => {
  const group = isObject(raw) ? raw["scoringGroup"] : undefined;
  const division = isObject(group) ? text(group["caption"]) : "";
  const where = division || `tab ${index}`;

  if (!isObject(raw) || !isObject(group) || division === "") {
    errors.push(`${where}: leaderboard tab has no division caption`);
    return [];
  }
  const athletes = raw["athletes"];
  if (!Array.isArray(athletes)) {
    errors.push(`${where}: "athletes" must be a list`);
    return [];
  }

  const workouts = readWorkouts(raw["workouts"]);
  const isTeam = group["team"] === true;

  return athletes
    .filter(isObject)
    .filter((athlete) => isOurs(athlete, include))
    .map((athlete) => {
      const place = leadingNumber(athlete["place"]);
      return {
        id: `cc-${text(athlete["ptcpID"])}`,
        name: text(athlete["name"]),
        isTeam,
        division,
        athletes: athletesOf(athlete),
        standing: {
          place,
          fieldSize: athletes.length,
          points: place === undefined ? undefined : leadingNumber(athlete["totalPoints"]),
          workouts: workouts.map((workout) =>
            readWorkoutStanding(athlete["workoutScores"], workout, place),
          ),
        },
      };
    });
};

const uniqueById = (entries: readonly LeaderboardEntry[]): readonly LeaderboardEntry[] => [
  ...new Map(entries.map((entry) => [entry.id, entry])).values(),
];

const byName = (a: LeaderboardEntry, b: LeaderboardEntry): number =>
  a.name.localeCompare(b.name);

export const buildStandings = ({
  tabs,
  include,
  fetchedAt,
}: BuildStandingsOptions): Result<StandingsFile> => {
  const errors: string[] = [];
  const entries = uniqueById(tabs.flatMap((tab, i) => readTab(tab, i, include, errors)));
  if (errors.length > 0) return { ok: false, errors };

  const teams = entries
    .filter((entry) => entry.isTeam)
    .sort(byName)
    .map(
      (entry, i): Team => ({
        id: entry.id,
        name: entry.name,
        division: entry.division,
        color: colorAt(i),
        athletes: entry.athletes,
        standing: entry.standing,
      }),
    );

  const individuals = entries
    .filter((entry) => !entry.isTeam)
    .sort(byName)
    .map(
      (entry, i): Individual => ({
        id: entry.id,
        name: entry.name,
        division: entry.division,
        color: colorAt(i),
        standing: entry.standing,
      }),
    );

  return { ok: true, value: { updatedAt: fetchedAt, teams, individuals } };
};

export const readLeaderboardConfig = (schedule: unknown): Result<LeaderboardConfig> => {
  const raw = isObject(schedule) ? schedule["leaderboard"] : undefined;
  const eventId = isObject(raw) ? raw["eventId"] : undefined;
  if (!isObject(raw) || typeof eventId !== "number" || !Number.isInteger(eventId)) {
    return {
      ok: false,
      errors: ['leaderboard: "eventId" must be the number in the Competition Corner address, e.g. 21880'],
    };
  }
  const include = Array.isArray(raw["include"])
    ? raw["include"].filter((name): name is string => typeof name === "string")
    : [];
  return { ok: true, value: { eventId, include } };
};
