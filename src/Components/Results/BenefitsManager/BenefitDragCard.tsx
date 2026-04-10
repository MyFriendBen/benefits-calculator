import { useCallback } from 'react';
import { Program } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { useFormatDisplayValue } from '../FormattedValue';

type BenefitDragCardProps = {
  program: Program;
};

const BenefitDragCard = ({ program }: BenefitDragCardProps) => {
  const value = useFormatDisplayValue(program);

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', String(program.program_id));
      e.dataTransfer.effectAllowed = 'move';
    },
    [program.program_id],
  );

  return (
    <div className="benefit-drag-card" draggable onDragStart={handleDragStart}>
      <div className="benefit-drag-card-name">
        <ResultsTranslate translation={program.name} />
      </div>
      <div className="benefit-drag-card-value">{value}</div>
    </div>
  );
};

export default BenefitDragCard;
