import { useIntl } from 'react-intl';
import { useState, useEffect } from 'react';
import { getAllLongTermPrograms, getAllNearTermPrograms } from '../../apiCalls';
import { Translation } from '../../Types/Results';
import ResultsTranslate from '../Results/Translate/Translate';
import LoadingPage from '../LoadingPage/LoadingPage';
import './CurrentBenefits.css';
import QuestionHeader from '../QuestionComponents/QuestionHeader';
import { useTranslateNumber } from '../../Assets/languageOptions';
import { useParams } from 'react-router-dom';
import { useConfig } from '../Config/configHook';
import { FormattedMessageType } from '../../Types/Questions';
import { headingOptionsMappings } from '../Results/CategoryHeading/CategoryHeading';
import { ReactComponent as CashAssistance } from '../../Assets/icons/Programs/CategoryHeading/cashAssistant.svg';

export const iconCategoryMap: { [key: string]: React.ComponentType } = {
  default: CashAssistance,  
  ...headingOptionsMappings,
};

export type Program = {
  name: Translation;
  description: Translation;
};

export type Category = {
  name: Translation;
  icon: string;
  programs: Program[];
};

function programCount(categories: Category[]) {
  let count = 0;

  for (const category of categories) {
    count += category.programs.length;
  }

  return count;
}

const CurrentBenefits = () => {
  const [programCategories, setProgramCategories] = useState<Category[]>([]);
  const [urgentNeedCategories, setUrgentNeedCategories] = useState<Category[]>([]);
  const [progamsLoaded, setProgramsLoaded] = useState(false);
  const [urgentNeedsLoaded, setUrgentNeedsLoaded] = useState(false);
  const { whiteLabel } = useParams();
  const { title, program_heading, urgent_need_heading } = useConfig<{
    title: FormattedMessageType;
    program_heading: FormattedMessageType;
    urgent_need_heading: FormattedMessageType;
  }>('current_benefits');
  const intl = useIntl();

  if (whiteLabel === undefined) {
    throw new Error('white label is not defined');
  }

  const normalizeString = (str: Translation) => {
    return intl
      .formatMessage({
        id: str.label,
        defaultMessage: str.default_message,
      })
      .toUpperCase();
  };

  function sortNames<T extends { name: Translation }>(a: T, b: T): number {
    const nameA = normalizeString(a.name);
    const nameB = normalizeString(b.name);

    if (nameA < nameB) {
      return -1;
    }
    if (nameA > nameB) {
      return 1;
    }

    return 0;
  }

  const sortAlphabetically = (categories: Category[]) => {
    return [...categories]
      .map((category) => {
        return {
          ...category,
          programs: category.programs.sort(sortNames),
        };
      })
      .sort(sortNames);
  };

  useEffect(() => {
    getAllLongTermPrograms(whiteLabel).then((programs: Category[]) => {
      const sorted = sortAlphabetically(programs);
      setProgramCategories(sorted);
      setProgramsLoaded(true);
    });

    getAllNearTermPrograms(whiteLabel).then((urgentNeeds: Category[]) => {
      const sorted = sortAlphabetically(urgentNeeds);
      setUrgentNeedCategories(sorted);
      setUrgentNeedsLoaded(true);
    });
  }, []);

  const displayProgramSection = (program: Program, index: number) => {
    return (
      <div className="bottom-margin" key={index}>
        <p className="program-name">
          <ResultsTranslate translation={program.name} />
        </p>
        <p>
          <ResultsTranslate translation={program.description} />
        </p>
      </div>
    );
  };

  const displayProgramsByCategory = (categories: Category[]) => {
    const categoryHeaderIconAndPrograms = Object.values(categories).map((category, index) => {
      const { name, programs, icon } = category;

      let CategoryIcon = iconCategoryMap[icon.toLowerCase()];

      if (CategoryIcon === undefined) {
        // NOTE: The urgent needs are mapped by the default_message of the name of the category,
        // if the name of the category changes, need to update the icon category map
        console.error(`No icon exists for ${icon} in category ${name.default_message}`);
        CategoryIcon = iconCategoryMap['default'];
      }

      return (
        <div key={index} className="category-section-container">
          <div className="category-heading-column">
            <div
              className="category-heading-icon"
              aria-label={intl.formatMessage({
                id: name.label,
                defaultMessage: name.default_message,
              })}
              role="img"
            >
              <CategoryIcon />
            </div>
            <h2 className="category-heading-text-style">
              <ResultsTranslate translation={name} />
            </h2>
          </div>
          <div className="programs-container">
            {programs.map((program: Program, index: number) => {
              return displayProgramSection(program, index);
            })}
          </div>
        </div>
      );
    });

    return <div>{categoryHeaderIconAndPrograms}</div>;
  };

  const translateNumber = useTranslateNumber();

  if (progamsLoaded && urgentNeedsLoaded) {
    return (
      <main className="current-benefits-container">
        <QuestionHeader>
          <div className="current-benefits-header">{title}</div>
        </QuestionHeader>
        {programCategories.length > 0 && (
          <div className="header-and-programs-container">
            <h2 className="long-near-term-header">
              {program_heading}
              {` (${translateNumber(programCount(programCategories))})`}
            </h2>
            {displayProgramsByCategory(programCategories)}
          </div>
        )}
        {urgentNeedCategories.length > 0 && (
          <div className="header-and-programs-container">
            <h2 className="long-near-term-header">
              {urgent_need_heading}
              {` (${translateNumber(programCount(urgentNeedCategories))})`}
            </h2>
            {displayProgramsByCategory(urgentNeedCategories)}
          </div>
        )}
      </main>
    );
  } else {
    return <LoadingPage />;
  }
};

export default CurrentBenefits;
