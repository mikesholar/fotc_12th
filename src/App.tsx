import { useEffect, useState } from "react";
import { loadSchedule } from "./data/load-schedule";
import { ALL_TEAMS, filterEventsByTeam } from "./domain/filter-events";
import { resolveViewerTimeZone } from "./domain/format-event-time";
import { findNextEvent } from "./domain/next-event";
import { ErrorCard } from "./components/ErrorCard";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { NextUpCard } from "./components/NextUpCard";
import { ScheduleBoard } from "./components/ScheduleBoard";
import { TeamFilter } from "./components/TeamFilter";
import { TeamGrid } from "./components/TeamGrid";
import type { Schedule } from "./types/schedule";

const TICK_MS = 30_000;

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly schedule: Schedule }
  | { readonly status: "error"; readonly errors: readonly string[] };

const App = () => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selectedTeam, setSelectedTeam] = useState<string>(ALL_TEAMS);
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
          <ScheduleView schedule={state.schedule} selectedTeam={selectedTeam} onSelectTeam={setSelectedTeam} now={now} timeZone={timeZone} />
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
  readonly selectedTeam: string;
  readonly onSelectTeam: (teamId: string) => void;
  readonly now: Date;
  readonly timeZone: string;
};

const ScheduleView = ({
  schedule,
  selectedTeam,
  onSelectTeam,
  now,
  timeZone,
}: ScheduleViewProps) => {
  const visibleEvents = filterEventsByTeam(schedule.events, selectedTeam);
  const nextEvent = findNextEvent(visibleEvents, now);

  return (
    <>
      <Hero schedule={schedule} />
      <TeamFilter teams={schedule.teams} selected={selectedTeam} onSelect={onSelectTeam} />
      <div className="wrap">
        {nextEvent && <NextUpCard event={nextEvent} now={now} timeZone={timeZone} />}
      </div>
      <div className="wrap">
        <ScheduleBoard events={visibleEvents} teams={schedule.teams} timeZone={timeZone} />
        <TeamGrid teams={schedule.teams} />
      </div>
    </>
  );
};

export default App;
