import { ALL_ENTRANTS } from "../domain/filter-events";
import type { Individual, Team } from "../types/schedule";

type EntrantFilterProps = {
  readonly teams: readonly Team[];
  readonly individuals: readonly Individual[];
  readonly selected: string;
  readonly onSelect: (entrantId: string) => void;
};

const Chip = ({
  id,
  name,
  color,
  selected,
  onSelect,
}: {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly selected: string;
  readonly onSelect: (entrantId: string) => void;
}) => (
  <button
    type="button"
    className={`chip${selected === id ? " chip--on" : ""}`}
    aria-pressed={selected === id}
    onClick={() => onSelect(id)}
  >
    <i className="chip__swatch" style={{ background: color }} />
    {name}
  </button>
);

export const EntrantFilter = ({
  teams,
  individuals,
  selected,
  onSelect,
}: EntrantFilterProps) => (
  <div className="filters">
    <div className="wrap">
      <div className="chips" role="group" aria-label="Filter schedule by team or individual">
        <span className="chips__label">Filter</span>
        <button
          type="button"
          className={`chip${selected === ALL_ENTRANTS ? " chip--on" : ""}`}
          aria-pressed={selected === ALL_ENTRANTS}
          onClick={() => onSelect(ALL_ENTRANTS)}
        >
          All teams
        </button>

        {teams.map((team) => (
          <Chip
            key={team.id}
            id={team.id}
            name={team.name}
            color={team.color}
            selected={selected}
            onSelect={onSelect}
          />
        ))}

        {individuals.length > 0 && <span className="chips__divider" aria-hidden="true" />}

        {individuals.map((individual) => (
          <Chip
            key={individual.id}
            id={individual.id}
            name={individual.name}
            color={individual.color}
            selected={selected}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  </div>
);
