import { ProgramCategory } from '../../../Types/Results';
import { useResultsContext } from '../Results';
import Filter from '../Filter/Filter';
import ProgramCard from './ProgramCard';
import CategoryHeading from '../CategoryHeading/CategoryHeading';
import { useMemo } from 'react';
import { calculateTotalValue, programValue } from '../FormattedValue';
import { ResultsMessage } from '../../Referrer/Referrer';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';
import EnergyCalculatorRebateCategoryList, {
  useEnergyCalculatorNeedsRebates,
} from '../../EnergyCalculator/Results/RebateCategories';
import DocumentSummary from '../DocumentSummary/DocumentSummary';

function sortProgramsIntoCategories(categories: ProgramCategory[]): ProgramCategory[] {
  // sort categories by total category value in decending order
  const sortedCategories = categories
    .filter((category) => category.programs.length > 0)
    .sort((a, b) => {
      // Temporary fix (MFB-1185): always push tax credit categories to the bottom,
      // regardless of their priority or estimated value.
      if (a.tax_category !== b.tax_category) {
        return a.tax_category ? 1 : -1;
      }

      const aPriority = a.priority === null ? Infinity : a.priority;
      const bPriority = b.priority === null ? Infinity : b.priority;

      if (bPriority !== aPriority) {
        return aPriority - bPriority;
      }

      return calculateTotalValue(b) - calculateTotalValue(a);
    });

  // sort programs in each category by decending estimated value
  for (const category of sortedCategories) {
    category.programs = [...category.programs].sort((a, b) => programValue(b) - programValue(a));
  }

  return sortedCategories;
}

const Programs = () => {
  const { programs, programCategories } = useResultsContext();

  const categories = useMemo(() => sortProgramsIntoCategories(programCategories), [programCategories]);

  const isEnergyCalculator = useIsEnergyCalculator();
  const needsRebates = useEnergyCalculatorNeedsRebates();

  return (
    <>
      <ResultsMessage />
      {!isEnergyCalculator && <Filter />}
      {isEnergyCalculator && <DocumentSummary programs={programs} />}
      {isEnergyCalculator && needsRebates && <EnergyCalculatorRebateCategoryList />}
      {categories.map((category) => {
        return (
          <div key={category.name.default_message}>
            <CategoryHeading category={category} />
            {category.programs.map((program) => {
              return <ProgramCard program={program} key={program.program_id} />;
            })}
          </div>
        );
      })}
      {isEnergyCalculator && !needsRebates && <EnergyCalculatorRebateCategoryList />}
    </>
  );
};

export default Programs;
