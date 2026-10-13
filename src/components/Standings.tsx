import { Fragment, useState } from "react";
import { CutCheck } from "./CutCheck";
import {
  describePlace,
  formatUpdatedAt,
  matchesOnlyAnAthlete,
  matchesSearch,
  ordinal,
  rankByStanding,
  workoutNamesIn,
  type RankedEntrant,
} from "../domain/standings";
import type { AthleteResult } from "../types/schedule";

type StandingsProps = {
  readonly entrants: readonly RankedEntrant[];
  readonly updatedAt?: string;
  readonly timeZone: string;
};

const WorkoutCell = ({
  entrant,
  workoutName,
}: {
  readonly entrant: RankedEntrant;
  readonly workoutName: string;
}) => {
  const workout = entrant.standing?.workouts.find((w) => w.name === workoutName);
  if (workout?.rank === undefined) {
    return <td className="standings__pending">—</td>;
  }
  return (
    <td>
      <b>{ordinal(workout.rank)}</b>
      {workout.result && <span className="standings__result">{workout.result}</span>}
    </td>
  );
};

const AthleteRow = ({
  athlete,
  color,
  workoutNames,
}: {
  readonly athlete: AthleteResult;
  readonly color: string;
  readonly workoutNames: readonly string[];
}) => (
  <tr
    className="standings__athlete"
    aria-label={athlete.name}
    style={{ ["--tc" as string]: color }}
  >
    <td>{athlete.name}</td>
    <td />
    <td />
    {workoutNames.map((name) => {
      const result = athlete.workouts.find((w) => w.name === name)?.result;
      return result === undefined ? (
        <td key={name} className="standings__pending">
          —
        </td>
      ) : (
        <td key={name}>{result}</td>
      );
    })}
  </tr>
);

const emptyMessage = (query: string): string =>
  query.trim() === "" ? "Nobody matches this filter." : `No one matches “${query.trim()}”.`;

export const Standings = ({ entrants, updatedAt, timeZone }: StandingsProps) => {
  const [query, setQuery] = useState("");
  const [toggled, setToggled] = useState<Readonly<Record<string, boolean>>>({});
  const ranked = rankByStanding(
    entrants.filter((entrant) => entrant.standing !== undefined && matchesSearch(entrant, query)),
  );
  const workoutNames = workoutNamesIn(ranked);
  const isExpanded = (entrant: RankedEntrant): boolean =>
    toggled[entrant.id] ?? matchesOnlyAnAthlete(entrant, query);
  const toggle = (entrant: RankedEntrant): void =>
    setToggled((current) => ({ ...current, [entrant.id]: !isExpanded(entrant) }));

  return (
    <section className="section section--divided" aria-label="Where we stand" id="standings">
      <div className="section__head">
        <p className="eyebrow">Coastal Qualifier Leaderboard</p>
        <h2>Where We Stand</h2>
        <p>
          Place within each division, best first.
          {updatedAt && <> Updated {formatUpdatedAt(updatedAt, timeZone)}.</>}
        </p>
      </div>

      <label className="standings__search">
        <span>Search</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Team or athlete name"
          autoComplete="off"
        />
      </label>

      {ranked.length === 0 ? (
        <p className="empty">{emptyMessage(query)}</p>
      ) : (
        <div className="standings__scroll">
          <table className="standings">
            <thead>
              <tr>
                <th scope="col">Entrant</th>
                <th scope="col">Place</th>
                <th scope="col">Points</th>
                {workoutNames.map((name) => (
                  <th scope="col" key={name}>
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ranked.map((entrant) => {
                const athletes = entrant.standing?.athleteResults ?? [];
                const expanded = athletes.length > 0 && isExpanded(entrant);
                return (
                  <Fragment key={entrant.id}>
                    <tr aria-label={entrant.name} style={{ ["--tc" as string]: entrant.color }}>
                      <td>
                        <span className="standings__name">
                          {entrant.name}
                          {athletes.length > 0 && (
                            <button
                              type="button"
                              className="standings__toggle"
                              aria-expanded={expanded}
                              aria-label={`Show athletes for ${entrant.name}`}
                              onClick={() => toggle(entrant)}
                            >
                              <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true">
                                <path
                                  d="M2 4.5 6 8.5 10 4.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                />
                              </svg>
                            </button>
                          )}
                        </span>
                        <span className="standings__div">{entrant.division}</span>
                      </td>
                      <td className="standings__place">
                        {describePlace(entrant.standing)}
                        <CutCheck standing={entrant.standing} />
                      </td>
                      <td>{entrant.standing?.points ?? "—"}</td>
                      {workoutNames.map((name) => (
                        <WorkoutCell key={name} entrant={entrant} workoutName={name} />
                      ))}
                    </tr>
                    {expanded &&
                      athletes.map((athlete) => (
                        <AthleteRow
                          key={athlete.name}
                          athlete={athlete}
                          color={entrant.color}
                          workoutNames={workoutNames}
                        />
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
