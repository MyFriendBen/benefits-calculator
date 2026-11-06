import { useState } from 'react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import CloseIcon from '@mui/icons-material/Close';
import { ALL_NEEDS, NEEDS, NeedId } from './householdFinances';

type NeedsCardProps = {
  rankedNeeds: NeedId[];
  onChange: (needs: NeedId[]) => void;
};

function moveItem<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

// Same native drag-and-drop the board columns use, so the two interactions feel alike.
const NeedsCard = ({ rankedNeeds, onChange }: NeedsCardProps) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const available = ALL_NEEDS.filter((need) => !rankedNeeds.includes(need));

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  return (
    <section className="bm-panel" aria-labelledby="bm-needs-title">
      <h2 className="bm-panel-title" id="bm-needs-title">
        Your Biggest Needs
      </h2>
      <p className="bm-panel-subtitle">Drag to rank what matters most</p>
      <ol className="bm-needs-list">
        {rankedNeeds.map((need, index) => (
          <li
            key={need}
            className={`bm-need ${dragIndex === index ? 'bm-need-dragging' : ''} ${
              overIndex === index && dragIndex !== index ? 'bm-need-over' : ''
            }`}
            draggable
            tabIndex={0}
            aria-label={`${index + 1}. ${NEEDS[need].label}. Use the up and down arrow keys to reorder.`}
            onKeyDown={(e) => {
              const to = e.key === 'ArrowUp' ? index - 1 : e.key === 'ArrowDown' ? index + 1 : null;
              if (to !== null && to >= 0 && to < rankedNeeds.length) {
                e.preventDefault();
                onChange(moveItem(rankedNeeds, index, to));
              }
            }}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', need);
              setDragIndex(index);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== index) {
                onChange(moveItem(rankedNeeds, dragIndex, index));
              }
              endDrag();
            }}
            onDragEnd={endDrag}
          >
            <span className="bm-need-rank">{index + 1}</span>
            <span className="bm-need-label">{NEEDS[need].label}</span>
            <button
              type="button"
              className="bm-icon-btn bm-need-remove"
              aria-label={`Remove ${NEEDS[need].label}`}
              onClick={() => onChange(rankedNeeds.filter((n) => n !== need))}
            >
              <CloseIcon fontSize="inherit" />
            </button>
            <DragIndicatorIcon className="bm-need-grip" fontSize="small" aria-hidden="true" />
          </li>
        ))}
      </ol>
      {available.length > 0 &&
        (adding ? (
          <select
            className="bm-need-select"
            aria-label="Add a concern"
            autoFocus
            defaultValue=""
            onBlur={() => setAdding(false)}
            onChange={(e) => {
              onChange([...rankedNeeds, e.target.value as NeedId]);
              setAdding(false);
            }}
          >
            <option value="" disabled>
              Choose a concern…
            </option>
            {available.map((need) => (
              <option key={need} value={need}>
                {NEEDS[need].label}
              </option>
            ))}
          </select>
        ) : (
          <button type="button" className="bm-link-btn" onClick={() => setAdding(true)}>
            + Add a concern
          </button>
        ))}
    </section>
  );
};

export default NeedsCard;
