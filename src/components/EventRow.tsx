import { formatDayLabel, formatEventTime } from "../domain/format-event-time";
import type { ScheduleEvent, Team } from "../types/schedule";

const KIND_LABELS: Record<ScheduleEvent["kind"], string> = {
  release: "Workout drop",
  due: "Scores due",
  comp: "Competition floor",
  milestone: "Milestone",
};

type EventRowProps = {
  readonly event: ScheduleEvent;
  readonly teams: readonly Team[];
  readonly timeZone: string;
};

const AppliesTo = ({
  event,
  teams,
}: {
  readonly event: ScheduleEvent;
  readonly teams: readonly Team[];
}) => {
  if (event.teams === "all") {
    return <span className="pill pill--all">All {teams.length} teams</span>;
  }

  const named = event.teams
    .map((id) => teams.find((team) => team.id === id))
    .filter((team): team is Team => team !== undefined);

  return (
    <>
      {named.map((team) => (
        <span className="pill" key={team.id}>
          <i style={{ background: team.color }} />
          {team.name}
        </span>
      ))}
    </>
  );
};

export const EventRow = ({ event, teams, timeZone }: EventRowProps) => {
  const day = formatDayLabel(event.start, timeZone);
  const { et, local } = formatEventTime(event.start, timeZone);

  return (
    <article className={`row row--${event.kind}`}>
      <div className="row__date">
        <b>
          <span className="row__dow">{day.weekday}</span> {day.date}
        </b>
        <span className="row__time">
          {local ? `${local} local · ${et}` : et}
        </span>
        {event.week !== undefined && <span className="row__week">Week {event.week}</span>}
      </div>

      <div className="row__main">
        <div className="row__tags">
          <span className={`kind kind--${event.kind}`}>{KIND_LABELS[event.kind]}</span>
        </div>
        <h4>{event.title}</h4>
        {event.notes && <p>{event.notes}</p>}
        {event.link && (
          <p>
            <a className="row__link" href={event.link} target="_blank" rel="noopener noreferrer">
              Details ↗
            </a>
          </p>
        )}
      </div>

      <div className="row__side">
        <span className="row__who">Applies to</span>
        <AppliesTo event={event} teams={teams} />
      </div>
    </article>
  );
};
