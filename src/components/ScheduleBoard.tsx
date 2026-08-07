import { groupEventsByMonth } from "../domain/group-events";
import type { ScheduleEvent, Team } from "../types/schedule";
import { EventRow } from "./EventRow";

type ScheduleBoardProps = {
  readonly events: readonly ScheduleEvent[];
  readonly teams: readonly Team[];
  readonly timeZone: string;
};

export const ScheduleBoard = ({ events, teams, timeZone }: ScheduleBoardProps) => {
  const groups = groupEventsByMonth(events);

  return (
    <section className="section" aria-label="Schedule" id="schedule-board">
      <div className="section__head">
        <h2>The Schedule</h2>
        <p>
          Five scored workouts over four weeks. The coloured edge tells you what it is at a
          glance — cyan for a workout drop, coral for a deadline, white for the competition floor.
        </p>
      </div>

      {groups.length === 0 && <p className="empty">No events match this filter yet.</p>}

      {groups.map((group) => (
        <div key={group.key}>
          <div className="monthbar">
            <h3>{group.label}</h3>
            <span>
              {group.events.length} {group.events.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          {group.events.map((event) => (
            <EventRow key={event.id} event={event} teams={teams} timeZone={timeZone} />
          ))}
        </div>
      ))}
    </section>
  );
};
