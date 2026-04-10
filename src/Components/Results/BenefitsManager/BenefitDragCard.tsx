import { useCallback, useRef } from 'react';
import { Program } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { useFormatDisplayValue } from '../FormattedValue';

type BenefitDragCardProps = {
  program: Program;
  onSelect: (program: Program) => void;
};

const BenefitDragCard = ({ program, onSelect }: BenefitDragCardProps) => {
  const value = useFormatDisplayValue(program);
  const didDragRef = useRef(false);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      didDragRef.current = true;
      e.dataTransfer.setData('text/plain', String(program.program_id));
      e.dataTransfer.effectAllowed = 'move';
    },
    [program.program_id],
  );

  const handleMouseDown = useCallback(() => {
    didDragRef.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (!didDragRef.current) {
      onSelect(program);
    }
  }, [onSelect, program]);

  return (
    <div
      className="benefit-drag-card"
      draggable
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(program);
        }
      }}
    >
      <div className="benefit-drag-card-name">
        <ResultsTranslate translation={program.name} />
      </div>
      <div className="benefit-drag-card-value">{value}</div>
    </div>
  );
};

export default BenefitDragCard;
