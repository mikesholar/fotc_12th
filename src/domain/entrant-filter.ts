import type { Individual, Schedule, Team } from "../types/schedule";

export const ALL = "all";

export type EntrantType = "team" | "individual";

export type FilterOption = {
  readonly id: string;
  readonly label: string;
};

const TYPE_PREFIX = "type:";
const DIVISION_PREFIX = "div:";

export const divisionFilterId = (division: string): string => `${DIVISION_PREFIX}${division}`;

export type FilterBar = {
  readonly types: readonly FilterOption[];
  readonly divisions: readonly FilterOption[];
  readonly activeType?: EntrantType;
};

type Entrant = Team | Individual;

const TYPE_LABELS: Record<EntrantType, string> = { team: "Teams", individual: "Individuals" };

const TEAM_PREFIX = /^team\s+/i;

const LEVELS: readonly RegExp[] = [/pro|rx/i, /intermediate/i, /novice/i, /\d/];
const TEEN = /teen/i;

const levelOf = (division: string): number => {
  if (TEEN.test(division)) return LEVELS.length;
  const level = LEVELS.findIndex((pattern) => pattern.test(division));
  return level === -1 ? LEVELS.length + 1 : level;
};

const firstNumberIn = (division: string): number =>
  Number.parseInt(division.replace(TEAM_PREFIX, "").match(/\d+/)?.[0] ?? "0", 10);

const byLevel = (a: string, b: string): number =>
  levelOf(a) - levelOf(b) || firstNumberIn(a) - firstNumberIn(b) || a.localeCompare(b);

const divisionsOf = (entrants: readonly Entrant[]): readonly string[] =>
  [
    ...new Set(
      entrants
        .map((entrant) => entrant.division)
        .filter((division): division is string => division !== undefined),
    ),
  ].sort(byLevel);

const entrantsOfType = (schedule: Schedule, type: EntrantType): readonly Entrant[] =>
  type === "team" ? schedule.teams : schedule.individuals;

const typeOfFilter = (schedule: Schedule, filterId: string): EntrantType | undefined => {
  if (filterId === `${TYPE_PREFIX}team`) return "team";
  if (filterId === `${TYPE_PREFIX}individual`) return "individual";
  if (!filterId.startsWith(DIVISION_PREFIX)) return undefined;
  const isTeamDivision = schedule.teams.some(
    (team) => team.division !== undefined && divisionFilterId(team.division) === filterId,
  );
  return isTeamDivision ? "team" : "individual";
};

const divisionOption =
  (stripTeamPrefix: boolean) =>
  (division: string): FilterOption => ({
    id: divisionFilterId(division),
    label: stripTeamPrefix ? division.replace(TEAM_PREFIX, "") : division,
  });

export const buildFilterBar = (schedule: Schedule, selected: string): FilterBar => {
  const all: FilterOption = { id: ALL, label: "All" };
  const hasBothTypes = schedule.teams.length > 0 && schedule.individuals.length > 0;

  if (!hasBothTypes) {
    return {
      types: [all],
      divisions: divisionsOf([...schedule.teams, ...schedule.individuals]).map(
        divisionOption(false),
      ),
    };
  }

  const activeType = typeOfFilter(schedule, selected);
  const types: readonly EntrantType[] = ["team", "individual"];

  return {
    types: [all, ...types.map((type) => ({ id: `${TYPE_PREFIX}${type}`, label: TYPE_LABELS[type] }))],
    divisions:
      activeType === undefined
        ? []
        : divisionsOf(entrantsOfType(schedule, activeType)).map(
            divisionOption(activeType === "team"),
          ),
    activeType,
  };
};

export const matchesFilter = (
  entrant: Team | Individual,
  type: EntrantType,
  filterId: string,
): boolean => {
  if (filterId === ALL) return true;
  if (filterId.startsWith(TYPE_PREFIX)) return filterId === `${TYPE_PREFIX}${type}`;
  if (filterId.startsWith(DIVISION_PREFIX)) {
    return entrant.division !== undefined && divisionFilterId(entrant.division) === filterId;
  }
  return false;
};

export const entrantIdsMatching = (
  schedule: Schedule,
  filterId: string,
): typeof ALL | readonly string[] => {
  if (filterId === ALL) return ALL;

  const fromTeams = schedule.teams
    .filter((team) => matchesFilter(team, "team", filterId))
    .map((team) => team.id);

  const fromIndividuals = schedule.individuals
    .filter((individual) => matchesFilter(individual, "individual", filterId))
    .map((individual) => individual.id);

  return [...fromTeams, ...fromIndividuals];
};
