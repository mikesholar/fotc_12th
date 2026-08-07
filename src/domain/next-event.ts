import type { ScheduleEvent } from "../types/schedule";

export const findNextEvent = (
  events: readonly ScheduleEvent[],
  now: Date,
): ScheduleEvent | undefined =>
  events
    .filter((event) => Date.parse(event.start) > now.getTime())
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
