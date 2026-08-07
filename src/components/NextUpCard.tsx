import { formatDayLabel, formatEventTime } from "../domain/format-event-time";
import type { ScheduleEvent } from "../types/schedule";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type NextUpCardProps = {
  readonly event: ScheduleEvent;
  readonly now: Date;
  readonly timeZone: string;
};

const pad = (value: number): string => String(value).padStart(2, "0");

export const NextUpCard = ({ event, now, timeZone }: NextUpCardProps) => {
  const remaining = Math.max(0, Date.parse(event.start) - now.getTime());
  const day = formatDayLabel(event.start, timeZone);
  const { et, local } = formatEventTime(event.start, timeZone);

  const parts = [
    { value: String(Math.floor(remaining / DAY)), label: "Days" },
    { value: pad(Math.floor(remaining / HOUR) % 24), label: "Hrs" },
    { value: pad(Math.floor(remaining / MINUTE) % 60), label: "Min" },
  ];

  return (
    <section className="nextup" aria-label="Next up">
      <div className="nextup__body">
        <div className="nextup__tag">
          <i />
          Next up
        </div>
        <h3>{event.title}</h3>
        <div className="nextup__meta">
          {day.weekday}, {day.date} · {local ? `${local} local · ${et}` : et}
          {event.location ? ` · ${event.location}` : ""}
        </div>
      </div>

      <div className="countdown">
        {parts.map((part) => (
          <div className="cd" key={part.label}>
            <b>{part.value}</b>
            <span>{part.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
