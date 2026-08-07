import type { Team } from "../types/schedule";

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

export const TeamGrid = ({ teams }: { readonly teams: readonly Team[] }) => (
  <section className="section section--divided" aria-label="Our teams" id="teams">
    <div className="section__head">
      <p className="eyebrow">The Roster</p>
      <h2>Our Teams</h2>
      <p>
        {teams.length} {teams.length === 1 ? "team" : "teams"} repping 12th State in the
        Coastal Qualifier.
      </p>
    </div>

    <div className="teamgrid">
      {teams.map((team) => (
        <div className="teamcard" key={team.id} style={{ ["--tc" as string]: team.color }}>
          <div className="teamcard__div">{team.division}</div>
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
        </div>
      ))}
    </div>
  </section>
);
