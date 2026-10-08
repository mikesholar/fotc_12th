import { useState } from "react";
import { CutCheck } from "./CutCheck";
import {
  describePlace,
  formatUpdatedAt,
  matchesSearch,
  ordinal,
  rankByStanding,
  workoutNamesIn,
  type RankedEntrant,
} from "../domain/standings";

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

const emptyMessage = (query: string): string =>
  query.trim() === "" ? "Nobody matches this filter." : `No one matches “${query.trim()}”.`;

export const Standings = ({ entrants, updatedAt, timeZone }: StandingsProps) => {
  const [query, setQuery] = useState("");
  const ranked = rankByStanding(
    entrants.filter((entrant) => entrant.standing !== undefined && matchesSearch(entrant, query)),
  );
  const workoutNames = workoutNamesIn(ranked);

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
              {ranked.map((entrant) => (
                <tr key={entrant.id} aria-label={entrant.name}>
                  <td style={{ ["--tc" as string]: entrant.color }}>
                    <span className="standings__name">{entrant.name}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
