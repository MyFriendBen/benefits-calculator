import { useState, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Program } from '../../../Types/Results';
import { ColumnId } from './benefitsCodeUtils';
import BenefitDragCard from './BenefitDragCard';

type BenefitsColumnProps = {
  columnId: ColumnId;
  programs: Program[];
  onDrop: (programId: number, toColumn: ColumnId) => void;
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

const BenefitsColumn = ({ columnId, programs, onDrop }: BenefitsColumnProps) => {
  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef[1]((c) => {
      const next = c + 1;
      if (next === 1) setDragOver(true);
      return next;
    });
  }, []);

  const handleDragLeave = useCallback(() => {
    dragCounterRef[1]((c) => {
      const next = c - 1;
      if (next === 0) setDragOver(false);
      return next;
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      dragCounterRef[1](0);
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
          <BenefitDragCard key={program.program_id} program={program} />
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
