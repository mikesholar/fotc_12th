import type { Individual, Team } from "../types/schedule";

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const DivisionLine = ({ division }: { readonly division?: string }) =>
  division ? (
    <div className="entrant__div">{division}</div>
  ) : (
    <div className="entrant__div entrant__div--tbd">Division TBD</div>
  );

type RosterProps = {
  readonly teams: readonly Team[];
  readonly individuals: readonly Individual[];
};

export const Roster = ({ teams, individuals }: RosterProps) => (
  <section className="section section--divided" aria-label="Who's competing" id="teams">
    <div className="section__head">
      <p className="eyebrow">The Roster</p>
      <h2>Who's Competing</h2>
      <p>
        {teams.length} {teams.length === 1 ? "team" : "teams"} and {individuals.length}{" "}
        {individuals.length === 1 ? "individual" : "individuals"} repping 12th State.
      </p>
    </div>

    <h3 className="roster__label">Teams</h3>
    <div className="teamgrid">
      {teams.map((team) => (
        <div className="teamcard" key={team.id} style={{ ["--tc" as string]: team.color }}>
          <DivisionLine division={team.division} />
          <h4>{team.name}</h4>
          <ul>
            {team.athletes.map((athlete) => (
              <li key={athlete}>
                <span className="av" aria-hidden="true">
                  {initialsOf(athlete)}
                </span>
                {athlete}
              </li>
            ))}
          </ul>
          {team.note && <p className="entrant__note">{team.note}</p>}
        </div>
      ))}
    </div>

    {individuals.length > 0 && (
      <>
        <h3 className="roster__label roster__label--spaced">Individuals</h3>
        <div className="teamgrid teamgrid--tight">
          {individuals.map((individual) => (
            <div
              className="teamcard teamcard--solo"
              key={individual.id}
              style={{ ["--tc" as string]: individual.color }}
            >
              <DivisionLine division={individual.division} />
              <h4>
                <span className="av av--inline" aria-hidden="true">
                  {initialsOf(individual.name)}
                </span>
                {individual.name}
              </h4>
              {individual.note && <p className="entrant__note">{individual.note}</p>}
            </div>
          ))}
        </div>
      </>
    )}
  </section>
);
