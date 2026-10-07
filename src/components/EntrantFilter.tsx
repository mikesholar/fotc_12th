import type { FilterBar, FilterOption } from "../domain/entrant-filter";

type EntrantFilterProps = {
  readonly bar: FilterBar;
  readonly selected: string;
  readonly onSelect: (filterId: string) => void;
};

type ChipProps = {
  readonly option: FilterOption;
  readonly selected: string;
  readonly isParent?: boolean;
  readonly onSelect: (filterId: string) => void;
};

const Chip = ({ option, selected, isParent = false, onSelect }: ChipProps) => {
  const isOn = selected === option.id;
  const className = ["chip", isOn && "chip--on", isParent && !isOn && "chip--parent"]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isOn}
      onClick={() => onSelect(option.id)}
    >
      {option.label}
    </button>
  );
};

export const EntrantFilter = ({ bar, selected, onSelect }: EntrantFilterProps) => (
  <div className="filters">
    <div className="wrap">
      <div className="chips" role="group" aria-label="Filter by division or entry type">
        <span className="chips__label">Filter</span>
        {bar.types.map((option) => (
          <Chip
            key={option.id}
            option={option}
            selected={selected}
            isParent={option.id === `type:${bar.activeType}`}
            onSelect={onSelect}
          />
        ))}
        {bar.divisions.length > 0 && bar.types.length > 1 && (
          <span className="chips__divider" aria-hidden="true" />
        )}
        {bar.divisions.map((option) => (
          <Chip key={option.id} option={option} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </div>
  </div>
);
