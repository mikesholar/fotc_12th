import type { ScheduleEvent } from "../types/schedule";

export const ALL_ENTRANTS = "all";

export const filterEventsByEntrant = (
  events: readonly ScheduleEvent[],
  entrantId: string,
): readonly ScheduleEvent[] => {
  if (entrantId === ALL_ENTRANTS) return events;
  return events.filter(
    (event) => event.entrants === ALL_ENTRANTS || event.entrants.includes(entrantId),
  );
};
