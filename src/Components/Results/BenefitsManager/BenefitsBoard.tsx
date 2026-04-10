import { ColumnId } from './benefitsCodeUtils';
import { ColumnMap } from './useBenefitsBoard';
import BenefitsColumn from './BenefitsColumn';

type BenefitsBoardProps = {
  columns: ColumnMap;
  moveProgram: (programId: number, toColumn: ColumnId) => void;
  allColumns: ColumnId[];
};

const BenefitsBoard = ({ columns, moveProgram, allColumns }: BenefitsBoardProps) => {
  return (
    <div className="benefits-board">
      {allColumns.map((columnId) => (
        <BenefitsColumn
          key={columnId}
          columnId={columnId}
          programs={columns[columnId]}
          onDrop={moveProgram}
        />
      ))}
    </div>
  );
};

export default BenefitsBoard;
