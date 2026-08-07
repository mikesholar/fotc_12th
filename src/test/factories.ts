import { validateSchedule } from "../data/validate-schedule";
import type { Individual, Schedule, ScheduleEvent, Team } from "../types/schedule";

type Json = Record<string, unknown>;

export const getMockRawTeam = (overrides?: Json): Json => ({
  id: "hold-the-line",
  name: "Hold the Line",
  division: "Team M/F Rx",
  color: "#FF5959",
  athletes: ["Jordan Reese", "Morgan Cade"],
  ...overrides,
});

export const getMockRawIndividual = (overrides?: Json): Json => ({
  id: "indy-jamie-fox",
  name: "Jamie Fox",
  division: "Intermediate",
  color: "#4ADE80",
  ...overrides,
});

export const getMockRawEvent = (overrides?: Json): Json => ({
  id: "wod1-release",
  kind: "release",
  title: "Workout 1 released",
  start: "2026-10-01T19:00:00-04:00",
  phase: "qualifier",
  week: 1,
  entrants: "all",
  location: "Online · FOTC YouTube",
  ...overrides,
});

export const getMockRawRoster = (): Json[] => [
  getMockRawTeam(),
  getMockRawTeam({
    id: "salt-and-sand",
    name: "Salt & Sand",
    color: "#27CFE6",
    athletes: ["Avery Bowen", "Sam Delaney"],
  }),
  getMockRawTeam({
    id: "battery-brothers",
    name: "Battery Brothers",
    color: "#FFC24B",
    athletes: ["Tyler Knox", "Devon Pryor"],
  }),
  getMockRawTeam({
    id: "tide-and-timber",
    name: "Tide & Timber",
    color: "#8B7CF6",
    athletes: ["Riley Hart", "Emerson Vale"],
  }),
];

export const getMockRawSchedule = (overrides?: Json): Json => ({
  gym: { name: "12th State CrossFit", location: "Summerville, SC" },
  teams: getMockRawRoster(),
  individuals: [getMockRawIndividual()],
  events: [getMockRawEvent()],
  ...overrides,
});

const parseOrThrow = (raw: Json): Schedule => {
  const result = validateSchedule(raw);
  if (!result.ok) {
    throw new Error(`Invalid mock schedule — fix the factory:\n  ${result.errors.join("\n  ")}`);
  }
  return result.value;
};

export const getMockSchedule = (overrides?: Json): Schedule =>
  parseOrThrow(getMockRawSchedule(overrides));

export const getMockTeam = (overrides?: Json): Team => {
  const team = parseOrThrow(
    getMockRawSchedule({ teams: [getMockRawTeam(overrides)], individuals: [], events: [] }),
  ).teams[0];
  if (!team) throw new Error("Mock team factory produced no team");
  return team;
};

export const getMockIndividual = (overrides?: Json): Individual => {
  const individual = parseOrThrow(
    getMockRawSchedule({ individuals: [getMockRawIndividual(overrides)], events: [] }),
  ).individuals[0];
  if (!individual) throw new Error("Mock individual factory produced no individual");
  return individual;
};

export const getMockEvent = (overrides?: Json): ScheduleEvent => {
  const event = parseOrThrow(
    getMockRawSchedule({ events: [getMockRawEvent(overrides)] }),
  ).events[0];
  if (!event) throw new Error("Mock event factory produced no event");
  return event;
};
