import { useEffect, useState } from "react";
import { loadSchedule } from "./data/load-schedule";
import { ALL_ENTRANTS, filterEventsByEntrant } from "./domain/filter-events";
import { resolveViewerTimeZone } from "./domain/format-event-time";
import { findNextEvent } from "./domain/next-event";
import { ErrorCard } from "./components/ErrorCard";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { NextUpCard } from "./components/NextUpCard";
import { Roster } from "./components/Roster";
import { ScheduleBoard } from "./components/ScheduleBoard";
import { EntrantFilter } from "./components/EntrantFilter";
import type { Schedule } from "./types/schedule";

const TICK_MS = 30_000;

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly schedule: Schedule }
  | { readonly status: "error"; readonly errors: readonly string[] };

const App = () => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selectedEntrant, setSelectedEntrant] = useState<string>(ALL_ENTRANTS);
  const [now, setNow] = useState<Date>(() => new Date());
  const timeZone = resolveViewerTimeZone();

  useEffect(() => {
    let cancelled = false;
    void loadSchedule().then((result) => {
      if (cancelled) return;
      setState(
        result.ok
          ? { status: "ready", schedule: result.value }
          : { status: "error", errors: result.errors },
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <Header />
      <main>
        {state.status === "loading" && (
          <p className="loading" role="status">
            Loading the schedule…
          </p>
        )}

        {state.status === "error" && <ErrorCard errors={state.errors} />}

        {state.status === "ready" && (
          <ScheduleView
            schedule={state.schedule}
            selectedEntrant={selectedEntrant}
            onSelectEntrant={setSelectedEntrant}
            now={now}
            timeZone={timeZone}
          />
        )}
      </main>

      <footer className="ftr">
        <div className="wrap">
          {state.status === "ready" ? state.schedule.gym.name : "12th State CrossFit"} · Schedule
          data from{" "}
          <a href="https://fittestofthecoast.com" target="_blank" rel="noopener noreferrer">
            fittestofthecoast.com
          </a>
        </div>
      </footer>
    </>
  );
};

type ScheduleViewProps = {
  readonly schedule: Schedule;
  readonly selectedEntrant: string;
  readonly onSelectEntrant: (entrantId: string) => void;
  readonly now: Date;
  readonly timeZone: string;
};

const ScheduleView = ({
  schedule,
  selectedEntrant,
  onSelectEntrant,
  now,
  timeZone,
}: ScheduleViewProps) => {
  const entrants = [...schedule.teams, ...schedule.individuals];
  const visibleEvents = filterEventsByEntrant(schedule.events, selectedEntrant);
  const nextEvent = findNextEvent(visibleEvents, now);

  return (
    <>
      <Hero schedule={schedule} />
      <EntrantFilter
        teams={schedule.teams}
        individuals={schedule.individuals}
        selected={selectedEntrant}
        onSelect={onSelectEntrant}
      />
      <div className="wrap">
        {nextEvent && <NextUpCard event={nextEvent} now={now} timeZone={timeZone} />}
      </div>
      <div className="wrap">
        <ScheduleBoard events={visibleEvents} entrants={entrants} timeZone={timeZone} />
        <Roster teams={schedule.teams} individuals={schedule.individuals} />
      </div>
    </>
  );
};

export default App;
