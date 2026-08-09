import type { ScheduleEvent } from "../types/schedule";
import { ALL } from "./entrant-filter";

export const filterEventsForEntrants = (
  events: readonly ScheduleEvent[],
  entrantIds: typeof ALL | readonly string[],
): readonly ScheduleEvent[] => {
  if (entrantIds === ALL) return events;

  const selected = new Set(entrantIds);
  return events.filter(
    (event) =>
      event.entrants === "all" || event.entrants.some((id) => selected.has(id)),
  );
};
