import type { Result, Schedule } from "../types/schedule";
import { validateSchedule } from "./validate-schedule";

const SCHEDULE_PATH = "data/schedule.json";
const STANDINGS_PATH = "data/standings.json";

const dataUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;

const fetchJson = async (path: string, missingHint = ""): Promise<Result<unknown>> => {
  let response: Response;
  try {
    response = await fetch(dataUrl(path));
  } catch {
    return {
      ok: false,
      errors: [`Could not load ${path} — check your connection and refresh.`],
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      errors: [`Could not load ${path} — the server returned ${response.status}.${missingHint}`],
    };
  }

  try {
    return { ok: true, value: await response.json() };
  } catch {
    return {
      ok: false,
      errors: [`${path} is not valid JSON — check for a stray comma or bracket.`],
    };
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const withStandings = (schedule: unknown, standings: unknown): unknown => {
  if (!isObject(schedule) || !isObject(standings)) return schedule;
  return {
    ...schedule,
    teams: standings["teams"],
    individuals: standings["individuals"],
    standingsUpdatedAt: standings["updatedAt"],
  };
};

export const loadSchedule = async (): Promise<Result<Schedule>> => {
  const [schedule, standings] = await Promise.all([
    fetchJson(SCHEDULE_PATH),
    fetchJson(STANDINGS_PATH, " Run `npm run standings` to fetch it from the leaderboard."),
  ]);

  if (!schedule.ok) return schedule;
  if (!standings.ok) return standings;

  return validateSchedule(withStandings(schedule.value, standings.value));
};
