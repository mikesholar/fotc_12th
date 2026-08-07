import type { Phase, ScheduleEvent } from "../types/schedule";

const EASTERN = "America/New_York";

const partsOf = (iso: string): { month: string; day: string } => {
  const parts = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: EASTERN,
  }).formatToParts(new Date(iso));

  const valueOf = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";

  return { month: valueOf("month"), day: valueOf("day") };
};

export const phaseRange = (
  events: readonly ScheduleEvent[],
  phase: Phase,
): string | undefined => {
  const inPhase = events
    .filter((event) => event.phase === phase)
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

  const first = inPhase[0];
  const last = inPhase[inPhase.length - 1];
  if (!first || !last) return undefined;

  const startsAt = first.start;
  const endsAt = last.end ?? last.start;

  const from = partsOf(startsAt);
  const to = partsOf(endsAt);

  if (from.month === to.month && from.day === to.day) return `${from.month} ${from.day}`;
  if (from.month === to.month) return `${from.month} ${from.day}–${to.day}`;
  return `${from.month} ${from.day} – ${to.month} ${to.day}`;
};
