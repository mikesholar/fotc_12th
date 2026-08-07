import {
  EVENT_KINDS,
  PHASES,
  type EventKind,
  type Phase,
  type Result,
  type Schedule,
  type ScheduleEvent,
  type Team,
} from "../types/schedule";

type Unknown = Record<string, unknown>;

const isObject = (value: unknown): value is Unknown =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const readString = (source: Unknown, key: string, where: string, errors: string[]): string => {
  const value = source[key];
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${where}: "${key}" must be a non-empty string`);
    return "";
  }
  return value;
};

const readOptionalString = (
  source: Unknown,
  key: string,
  where: string,
  errors: string[],
): string | undefined => {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${where}: "${key}" must be a non-empty string when present`);
    return undefined;
  }
  return value;
};

const readEnum = <T extends string>(
  source: Unknown,
  key: string,
  allowed: readonly T[],
  where: string,
  errors: string[],
): T => {
  const value = source[key];
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    errors.push(`${where}: "${key}" must be one of ${allowed.join(", ")}`);
    return allowed[0] as T;
  }
  return value as T;
};

const isUsableDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

const readTeam = (raw: unknown, index: number, errors: string[]): Team => {
  const where = `teams[${index}]`;
  if (!isObject(raw)) {
    errors.push(`${where}: must be an object`);
    return { id: "", name: "", division: "", color: "", athletes: [] };
  }
  const athletesRaw = raw["athletes"];
  const athletes = Array.isArray(athletesRaw)
    ? athletesRaw.filter((a): a is string => typeof a === "string")
    : [];
  if (!Array.isArray(athletesRaw)) {
    errors.push(`${where}: "athletes" must be an array of names`);
  }
  return {
    id: readString(raw, "id", where, errors),
    name: readString(raw, "name", where, errors),
    division: readString(raw, "division", where, errors),
    color: readString(raw, "color", where, errors),
    athletes,
  };
};

const readEventTeams = (raw: Unknown, where: string, errors: string[]): "all" | string[] => {
  const value = raw["teams"];
  if (value === "all") return "all";
  if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
    return value as string[];
  }
  errors.push(`${where}: "teams" must be "all" or an array of team ids`);
  return [];
};

const readEvent = (raw: unknown, index: number, errors: string[]): ScheduleEvent => {
  const where = `events[${index}]`;
  if (!isObject(raw)) {
    errors.push(`${where}: must be an object`);
    return {
      id: "",
      kind: "milestone",
      title: "",
      start: "",
      phase: "qualifier",
      teams: [],
    };
  }

  const weekRaw = raw["week"];
  let week: number | undefined;
  if (weekRaw !== undefined) {
    if (typeof weekRaw !== "number" || !Number.isInteger(weekRaw) || weekRaw < 1) {
      errors.push(`${where}: "week" must be a positive whole number when present`);
    } else {
      week = weekRaw;
    }
  }

  const start = readString(raw, "start", where, errors);
  if (start !== "" && !isUsableDate(start)) {
    errors.push(`${where}: "start" is not a readable date — use ISO 8601, e.g. 2026-10-01T19:00:00-04:00`);
  }

  const end = readOptionalString(raw, "end", where, errors);
  if (end !== undefined && !isUsableDate(end)) {
    errors.push(`${where}: "end" is not a readable date — use ISO 8601`);
  } else if (end !== undefined && start !== "" && Date.parse(end) <= Date.parse(start)) {
    errors.push(`${where}: "end" must come after "start"`);
  }

  return {
    id: readString(raw, "id", where, errors),
    kind: readEnum<EventKind>(raw, "kind", EVENT_KINDS, where, errors),
    title: readString(raw, "title", where, errors),
    start,
    end,
    phase: readEnum<Phase>(raw, "phase", PHASES, where, errors),
    week,
    teams: readEventTeams(raw, where, errors),
    location: readOptionalString(raw, "location", where, errors),
    notes: readOptionalString(raw, "notes", where, errors),
    link: readOptionalString(raw, "link", where, errors),
  };
};

export const validateSchedule = (raw: unknown): Result<Schedule> => {
  const errors: string[] = [];

  if (!isObject(raw)) {
    return { ok: false, errors: ["schedule.json must contain a JSON object"] };
  }

  const gymRaw = raw["gym"];
  const gym = isObject(gymRaw)
    ? {
        name: readString(gymRaw, "name", "gym", errors),
        location: readString(gymRaw, "location", "gym", errors),
      }
    : { name: "", location: "" };
  if (!isObject(gymRaw)) errors.push('gym: must be an object with "name" and "location"');

  const teamsRaw = raw["teams"];
  if (!Array.isArray(teamsRaw)) errors.push('teams: must be an array');
  const teams = Array.isArray(teamsRaw)
    ? teamsRaw.map((team, i) => readTeam(team, i, errors))
    : [];

  const eventsRaw = raw["events"];
  if (!Array.isArray(eventsRaw)) errors.push('events: must be an array');
  const events = Array.isArray(eventsRaw)
    ? eventsRaw.map((event, i) => readEvent(event, i, errors))
    : [];

  const knownTeamIds = new Set(teams.map((team) => team.id));
  events.forEach((event, index) => {
    if (event.teams === "all") return;
    event.teams
      .filter((id) => !knownTeamIds.has(id))
      .forEach((id) =>
        errors.push(`events[${index}]: unknown team id "${id}" — no team in "teams" has that id`),
      );
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { gym, teams, events } };
};
