import { useEffect, useState } from "react";
import { loadSchedule } from "./data/load-schedule";
import { ALL, buildFilterOptions, entrantIdsMatching, matchesFilter } from "./domain/entrant-filter";
import { filterEventsForEntrants } from "./domain/filter-events";
import { resolveViewerTimeZone } from "./domain/format-event-time";
import { findNextEvent } from "./domain/next-event";
import { ErrorCard } from "./components/ErrorCard";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { NextUpCard } from "./components/NextUpCard";
import { QuickLinks } from "./components/QuickLinks";
import { Roster } from "./components/Roster";
import { ScheduleBoard } from "./components/ScheduleBoard";
import { Standings } from "./components/Standings";
import { EntrantFilter } from "./components/EntrantFilter";
import type { Schedule } from "./types/schedule";

const TICK_MS = 30_000;

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly schedule: Schedule }
  | { readonly status: "error"; readonly errors: readonly string[] };

const App = () => {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [selectedEntrant, setSelectedEntrant] = useState<string>(ALL);
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
      {state.status === "ready" && <QuickLinks links={state.schedule.links} />}
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
  const visibleEvents = filterEventsForEntrants(
    schedule.events,
    entrantIdsMatching(schedule, selectedEntrant),
  );
  const nextEvent = findNextEvent(visibleEvents, now);
  const visibleTeams = schedule.teams.filter((team) =>
    matchesFilter(team, "team", selectedEntrant),
  );
  const visibleIndividuals = schedule.individuals.filter((individual) =>
    matchesFilter(individual, "individual", selectedEntrant),
  );

  return (
    <>
      <Hero schedule={schedule} />
      <EntrantFilter
        options={buildFilterOptions(schedule)}
        selected={selectedEntrant}
        onSelect={onSelectEntrant}
      />
      <div className="wrap">
        {nextEvent && <NextUpCard event={nextEvent} now={now} timeZone={timeZone} />}
      </div>
      <div className="wrap">
        <Standings
          entrants={[...visibleTeams, ...visibleIndividuals]}
          updatedAt={schedule.standingsUpdatedAt}
          timeZone={timeZone}
        />
        <ScheduleBoard events={visibleEvents} entrants={entrants} timeZone={timeZone} />
        <Roster teams={visibleTeams} individuals={visibleIndividuals} />
      </div>
    </>
  );
};

export default App;
