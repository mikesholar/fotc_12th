import type { ScheduleEvent } from "../types/schedule";

export const ALL_TEAMS = "all";

export const filterEventsByTeam = (
  events: readonly ScheduleEvent[],
  teamId: string,
): readonly ScheduleEvent[] => {
  if (teamId === ALL_TEAMS) return events;
  return events.filter(
    (event) => event.teams === ALL_TEAMS || event.teams.includes(teamId),
  );
};
