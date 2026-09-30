import { useState, useCallback, useRef } from 'react';
import { FormattedMessage } from 'react-intl';
import { Program } from '../../../Types/Results';
import { ColumnId } from './benefitsCodeUtils';
import BenefitDragCard from './BenefitDragCard';

type BenefitsColumnProps = {
  columnId: ColumnId;
  programs: Program[];
  onDrop: (programId: number, toColumn: ColumnId) => void;
  onSelectProgram: (program: Program) => void;
};

const COLUMN_LABELS: Record<ColumnId, { id: string; defaultMessage: string }> = {
  eligible: { id: 'benefitsManager.column.eligible', defaultMessage: 'Eligible' },
  applied: { id: 'benefitsManager.column.applied', defaultMessage: 'Applied' },
  receiving: { id: 'benefitsManager.column.receiving', defaultMessage: 'Receiving' },
  rejected: { id: 'benefitsManager.column.rejected', defaultMessage: 'Rejected' },
};

const COLUMN_COLORS: Record<ColumnId, string> = {
  eligible: '#2196f3',
  applied: '#ff9800',
  receiving: '#4caf50',
  rejected: '#f44336',
};

const BenefitsColumn = ({ columnId, programs, onDrop, onSelectProgram }: BenefitsColumnProps) => {
  const [dragOver, setDragOver] = useState(false);
  // Counts enter/leave pairs so hovering over a card inside the column doesn't flicker the highlight.
  const dragCounter = useRef(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      dragCounter.current = 0;
      const programId = Number(e.dataTransfer.getData('text/plain'));
      if (!isNaN(programId)) {
        onDrop(programId, columnId);
      }
    },
    [onDrop, columnId],
  );

  const label = COLUMN_LABELS[columnId];
  const color = COLUMN_COLORS[columnId];

  return (
    <div
      className={`benefits-column ${dragOver ? 'benefits-column-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="benefits-column-header" style={{ backgroundColor: color }}>
        <span className="benefits-column-title">
          <FormattedMessage id={label.id} defaultMessage={label.defaultMessage} />
        </span>
        <span className="benefits-column-count">{programs.length}</span>
      </div>
      <div className="benefits-column-body">
        {programs.map((program) => (
          <BenefitDragCard key={program.program_id} program={program} onSelect={onSelectProgram} />
        ))}
        {programs.length === 0 && (
          <div className="benefits-column-empty">
            <FormattedMessage id="benefitsManager.column.empty" defaultMessage="Drag benefits here" />
          </div>
        )}
      </div>
    </div>
  );
};

export default BenefitsColumn;
