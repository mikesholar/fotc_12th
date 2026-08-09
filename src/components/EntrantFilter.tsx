import type { FilterOption } from "../domain/entrant-filter";

type EntrantFilterProps = {
  readonly options: readonly FilterOption[];
  readonly selected: string;
  readonly onSelect: (filterId: string) => void;
};

export const EntrantFilter = ({ options, selected, onSelect }: EntrantFilterProps) => (
  <div className="filters">
    <div className="wrap">
      <div className="chips" role="group" aria-label="Filter by division or entry type">
        <span className="chips__label">Filter</span>
        {options.map((option) => (
          <button
            type="button"
            key={option.id}
            className={`chip${selected === option.id ? " chip--on" : ""}`}
            aria-pressed={selected === option.id}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);
