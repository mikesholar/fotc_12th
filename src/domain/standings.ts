import type { Individual, Standing, Team } from "../types/schedule";

export type RankedEntrant = Pick<Team | Individual, "id" | "name" | "division" | "color"> & {
  readonly athletes?: readonly string[];
  readonly standing?: Standing;
};

const normalise = (value: string): string => value.trim().toLowerCase();

export const matchesSearch = (entrant: RankedEntrant, query: string): boolean => {
  const needle = normalise(query);
  if (needle === "") return true;
  return [entrant.name, ...(entrant.athletes ?? [])].some((name) =>
    normalise(name).includes(needle),
  );
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

const shareOfField = (standing: Standing | undefined): number =>
  standing?.place === undefined || standing.fieldSize === 0
    ? Number.POSITIVE_INFINITY
    : standing.place / standing.fieldSize;

export const rankByStanding = <T extends RankedEntrant>(entrants: readonly T[]): readonly T[] =>
  [...entrants].sort(
    (a, b) => shareOfField(a.standing) - shareOfField(b.standing) || a.name.localeCompare(b.name),
  );

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
