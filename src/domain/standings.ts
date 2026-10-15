import type { CutLine, Individual, Standing, Team } from "../types/schedule";

export type RankedEntrant = Pick<Team | Individual, "id" | "name" | "division" | "color"> & {
  readonly athletes?: readonly string[];
  readonly standing?: Standing;
};

const normalise = (value: string): string => value.trim().toLowerCase();

const nameMatches = (name: string, needle: string): boolean => normalise(name).includes(needle);

export const matchesSearch = (entrant: RankedEntrant, query: string): boolean => {
  const needle = normalise(query);
  if (needle === "") return true;
  return [entrant.name, ...(entrant.athletes ?? [])].some((name) => nameMatches(name, needle));
};

export const matchesOnlyAnAthlete = (entrant: RankedEntrant, query: string): boolean => {
  const needle = normalise(query);
  if (needle === "" || nameMatches(entrant.name, needle)) return false;
  return (entrant.athletes ?? []).some((name) => nameMatches(name, needle));
};

const ORDINAL_SUFFIXES: Record<Intl.LDMLPluralRule, string> = {
  zero: "th",
  one: "st",
  two: "nd",
  few: "rd",
  many: "th",
  other: "th",
};

const ordinalRules = new Intl.PluralRules("en-US", { type: "ordinal" });

export const ordinal = (n: number): string => `${n}${ORDINAL_SUFFIXES[ordinalRules.select(n)]}`;

export const describePlace = (standing: Standing | undefined): string | undefined => {
  if (standing === undefined) return undefined;
  if (standing.place === undefined) return "Awaiting scores";
  return `${ordinal(standing.place)} of ${standing.fieldSize}`;
};

export const cutLineCleared = (standing: Standing | undefined): CutLine | undefined => {
  const place = standing?.place;
  if (standing === undefined || place === undefined) return undefined;
  return [...standing.cutLines].sort((a, b) => a.place - b.place).find((line) => place <= line.place);
};

export type SortColumn = "place" | "entrant" | "points" | `workout:${string}`;

export type SortDirection = "ascending" | "descending";

export type StandingsSort = {
  readonly column: SortColumn;
  readonly direction: SortDirection;
};

export const workoutColumn = (workoutName: string): SortColumn => `workout:${workoutName}`;

const shareOfField = (standing: Standing | undefined, place: number | undefined): number | undefined =>
  standing === undefined || place === undefined || standing.fieldSize === 0
    ? undefined
    : place / standing.fieldSize;

const workoutRank = (entrant: RankedEntrant, column: SortColumn): number | undefined =>
  entrant.standing?.workouts.find((w) => workoutColumn(w.name) === column)?.rank;

const sortValue = (entrant: RankedEntrant, column: SortColumn): number | string | undefined => {
  if (column === "entrant") return entrant.name;
  if (column === "place") return shareOfField(entrant.standing, entrant.standing?.place);
  if (column === "points") return entrant.standing?.points;
  return shareOfField(entrant.standing, workoutRank(entrant, column));
};

const compareValues = (a: number | string, b: number | string): number =>
  typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b));

const compareBy =
  ({ column, direction }: StandingsSort) =>
  (a: RankedEntrant, b: RankedEntrant): number => {
    const valueA = sortValue(a, column);
    const valueB = sortValue(b, column);
    if (valueA === undefined || valueB === undefined) {
      return Number(valueA === undefined) - Number(valueB === undefined) || a.name.localeCompare(b.name);
    }
    const sign = direction === "ascending" ? 1 : -1;
    return sign * compareValues(valueA, valueB) || a.name.localeCompare(b.name);
  };

export const sortStandings = <T extends RankedEntrant>(
  entrants: readonly T[],
  sort: StandingsSort,
): readonly T[] => [...entrants].sort(compareBy(sort));

export const nextSort = (current: StandingsSort, column: SortColumn): StandingsSort =>
  current.column === column && current.direction === "ascending"
    ? { column, direction: "descending" }
    : { column, direction: "ascending" };

export const workoutNamesIn = (entrants: readonly RankedEntrant[]): readonly string[] => [
  ...new Set(entrants.flatMap((entrant) => entrant.standing?.workouts ?? []).map((w) => w.name)),
];

export const formatUpdatedAt = (iso: string, timeZone: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(new Date(iso));
