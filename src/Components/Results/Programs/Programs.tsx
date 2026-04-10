import { Link } from 'react-router-dom';
import { ProgramCategory } from '../../../Types/Results';
import { findValidationForProgram, useResultsContext, useResultsLink } from '../Results';
import Filter from '../Filter/Filter';
import ProgramCard from './ProgramCard';
import CategoryHeading from '../CategoryHeading/CategoryHeading';
import { useCallback, useMemo } from 'react';
import { calculateTotalValue, programValue } from '../FormattedValue';
import { ResultsMessage } from '../../Referrer/Referrer';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';
import EnergyCalculatorRebateCategoryList, {
  useEnergyCalculatorNeedsRebates,
} from '../../EnergyCalculator/Results/RebateCategories';
import DocumentSummary from '../DocumentSummary/DocumentSummary';
import { FormattedMessage, useIntl } from 'react-intl';
import { useChatbotContext } from '../Chatbot/Chatbot';

function sortProgramsIntoCategories(categories: ProgramCategory[]): ProgramCategory[] {
  // sort categories by total category value in decending order
  const sortedCategories = categories
    .filter((category) => category.programs.length > 0)
    .sort((a, b) => {
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

const ValidationCategory = () => {
  const { programs, isAdminView, validations } = useResultsContext();

  const validationPrograms = useMemo(
    () => programs.filter((program) => findValidationForProgram(validations, program) !== undefined),
    [validations, programs],
  );

  const validationCategory = useMemo<ProgramCategory>(() => {
    return {
      external_name: 'validation_category',
      icon: '',
      name: { label: 'programs.categories.validation.header', default_message: 'Validations' },
      description: { label: '', default_message: '' },
      caps: [],
      programs: validationPrograms,
      priority: null,
      tax_category: false,
    };
  }, [validationPrograms]);

  if (!isAdminView || validationPrograms.length === 0) {
    return null;
  }

  return (
    <>
      <CategoryHeading category={validationCategory} />
      {validationPrograms.map((program, index) => {
        return <ProgramCard program={program} key={index} />;
      })}
    </>
  );
};

const GuideMeButton = () => {
  const { openWithMessage } = useChatbotContext();
  const { formatMessage } = useIntl();

  const handleClick = useCallback(() => {
    openWithMessage(
      formatMessage({
        id: 'chatbot.guideMeMessage',
        defaultMessage: 'Guide me through my benefits',
      }),
    );
  }, [openWithMessage, formatMessage]);

  return (
    <button type="button" className="guide-me-button" onClick={handleClick}>
      <FormattedMessage id="programs.guideMeButton" defaultMessage="Guide Me Through My Benefits" />
    </button>
  );
};

const ManageBenefitsButton = () => {
  const manageLink = useResultsLink('results/manage');

  return (
    <Link to={manageLink} className="manage-benefits-button">
      <FormattedMessage id="programs.manageBenefits" defaultMessage="Manage My Benefits" />
    </Link>
  );
};

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
      <ValidationCategory />
      <div className="results-action-buttons">
        <GuideMeButton />
        <ManageBenefitsButton />
      </div>
      {isEnergyCalculator && needsRebates && <EnergyCalculatorRebateCategoryList />}
      {categories.map((category) => {
        return (
          <div key={category.name.default_message}>
            <CategoryHeading category={category} />
            {category.programs.map((program, index) => {
              return <ProgramCard program={program} key={index} />;
            })}
          </div>
        );
      })}
      {isEnergyCalculator && !needsRebates && <EnergyCalculatorRebateCategoryList />}
    </>
  );
};

export default Programs;
