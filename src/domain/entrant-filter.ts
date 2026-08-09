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

const divisionsIn = (schedule: Schedule): readonly string[] => {
  const all = [...schedule.teams, ...schedule.individuals]
    .map((entrant) => entrant.division)
    .filter((division): division is string => division !== undefined);

  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
};

export const buildFilterOptions = (schedule: Schedule): readonly FilterOption[] => {
  const hasBothTypes = schedule.teams.length > 0 && schedule.individuals.length > 0;

  const typeOptions: FilterOption[] = hasBothTypes
    ? [
        { id: `${TYPE_PREFIX}team`, label: "Teams" },
        { id: `${TYPE_PREFIX}individual`, label: "Individuals" },
      ]
    : [];

  return [
    { id: ALL, label: "All" },
    ...typeOptions,
    ...divisionsIn(schedule).map((division) => ({
      id: divisionFilterId(division),
      label: division,
    })),
  ];
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
