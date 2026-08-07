import { formatDayLabel, formatEventTime } from "../domain/format-event-time";
import type { Individual, ScheduleEvent, Team } from "../types/schedule";

type Entrant = Pick<Team | Individual, "id" | "name" | "color">;

const KIND_LABELS: Record<ScheduleEvent["kind"], string> = {
  release: "Workout drop",
  due: "Scores due",
  comp: "Competition floor",
  milestone: "Milestone",
};

type EventRowProps = {
  readonly event: ScheduleEvent;
  readonly entrants: readonly Entrant[];
  readonly timeZone: string;
};

const AppliesTo = ({
  event,
  entrants,
}: {
  readonly event: ScheduleEvent;
  readonly entrants: readonly Entrant[];
}) => {
  if (event.entrants === "all") {
    return <span className="pill pill--all">Everyone</span>;
  }

  const named = event.entrants
    .map((id) => entrants.find((entrant) => entrant.id === id))
    .filter((entrant): entrant is Entrant => entrant !== undefined);

  return (
    <>
      {named.map((entrant) => (
        <span className="pill" key={entrant.id}>
          <i style={{ background: entrant.color }} />
          {entrant.name}
        </span>
      ))}
    </>
  );
};

export const EventRow = ({ event, entrants, timeZone }: EventRowProps) => {
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
        <AppliesTo event={event} entrants={entrants} />
      </div>
    </article>
  );
};
