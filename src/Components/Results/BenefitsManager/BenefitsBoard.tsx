import { Program } from '../../../Types/Results';
import { ColumnId } from './benefitsCodeUtils';
import { ColumnMap } from './useBenefitsBoard';
import BenefitsColumn from './BenefitsColumn';

type BenefitsBoardProps = {
  columns: ColumnMap;
  moveProgram: (programId: number, toColumn: ColumnId) => void;
  allColumns: ColumnId[];
  onSelectProgram: (program: Program) => void;
};

const BenefitsBoard = ({ columns, moveProgram, allColumns, onSelectProgram }: BenefitsBoardProps) => {
  return (
    <div className="benefits-board">
      {allColumns.map((columnId) => (
        <BenefitsColumn
          key={columnId}
          columnId={columnId}
          programs={columns[columnId]}
          onDrop={moveProgram}
          onSelectProgram={onSelectProgram}
        />
      ))}
    </div>
  );
};

export default BenefitsBoard;
