import type { ScheduleEvent } from "../types/schedule";

export type MonthGroup = {
  readonly key: string;
  readonly label: string;
  readonly events: readonly ScheduleEvent[];
};

const monthKey = (iso: string): string => {
  const date = new Date(iso);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (iso: string): string =>
  new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

export const groupEventsByMonth = (
  events: readonly ScheduleEvent[],
): readonly MonthGroup[] => {
  const chronological = [...events].sort(
    (a, b) => Date.parse(a.start) - Date.parse(b.start),
  );

  return chronological.reduce<MonthGroup[]>((groups, event) => {
    const key = monthKey(event.start);
    const current = groups[groups.length - 1];

    if (current?.key === key) {
      return [
        ...groups.slice(0, -1),
        { ...current, events: [...current.events, event] },
      ];
    }

    return [...groups, { key, label: monthLabel(event.start), events: [event] }];
  }, []);
};
