import { ALL_TEAMS } from "../domain/filter-events";
import type { Team } from "../types/schedule";

type TeamFilterProps = {
  readonly teams: readonly Team[];
  readonly selected: string;
  readonly onSelect: (teamId: string) => void;
};

export const TeamFilter = ({ teams, selected, onSelect }: TeamFilterProps) => (
  <div className="filters">
    <div className="wrap">
      <div className="chips" role="group" aria-label="Filter schedule by team">
        <span className="chips__label">Filter</span>
        <button
          type="button"
          className={`chip${selected === ALL_TEAMS ? " chip--on" : ""}`}
          aria-pressed={selected === ALL_TEAMS}
          onClick={() => onSelect(ALL_TEAMS)}
        >
          All teams
        </button>
        {teams.map((team) => (
          <button
            type="button"
            key={team.id}
            className={`chip${selected === team.id ? " chip--on" : ""}`}
            aria-pressed={selected === team.id}
            onClick={() => onSelect(team.id)}
          >
            <i className="chip__swatch" style={{ background: team.color }} />
            {team.name}
          </button>
        ))}
      </div>
    </div>
  </div>
);
