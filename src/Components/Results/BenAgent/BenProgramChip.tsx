interface BenProgramChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export default function BenProgramChip({ label, selected, onClick }: BenProgramChipProps) {
  return (
    <button
      className={`ben-program-chip ${selected ? 'ben-program-chip--selected' : ''}`}
      onClick={onClick}
      type="button"
      aria-pressed={selected}
    >
      {selected && (
        <span className="ben-program-chip__check" aria-hidden="true">
          &#10003;{' '}
        </span>
      )}
      {label}
    </button>
  );
}
