import { ReactComponent as Food } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/food.svg';
import { ReactComponent as Residence } from '../../../Assets/icons/General/residence.svg';
import { ReactComponent as HealthCare } from '../../../Assets/icons/Programs/CategoryHeading/healthcare.svg';
import { ReactComponent as Transportation } from '../../../Assets/icons/Programs/CategoryHeading/transportation.svg';
import { ReactComponent as TaxCredits } from '../../../Assets/icons/Programs/CategoryHeading/taxCredits.svg';
import { ReactComponent as CashAssistance } from '../../../Assets/icons/Programs/CategoryHeading/cashAssistant.svg';
import { ReactComponent as ChildCareYouthEducation } from '../../../Assets/icons/Programs/CategoryHeading/childCareYouthEducation.svg';
import { ReactComponent as WaterHeater } from '../../EnergyCalculator/Icons/WaterHeater.svg';
import { ReactComponent as LightBulb } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/housing.svg';
import { ReactComponent as Heat } from '../../EnergyCalculator/Icons/Heat.svg';
import { ReactComponent as LowFuel } from '../../EnergyCalculator/Icons/LowFuel.svg';
import { ReactComponent as Talk } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/support.svg';
import { ReactComponent as Baby_supplies } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/baby_supplies.svg';
import { ReactComponent as Child_development } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/child_development.svg';
import { ReactComponent as Dental_care } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/dental_care.svg';
import { ReactComponent as Family_planning } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/family_planning.svg';
import { ReactComponent as Housing } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/housing.svg';
import { ReactComponent as Job_resources } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/job_resources.svg';
import { ReactComponent as Legal_services } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/legal_services.svg';
import { ReactComponent as Support } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/support.svg';
import { ReactComponent as Military } from '../../../Assets/icons/UrgentNeeds/AcuteConditions/military.svg';
import { calculateTotalValue, formatToUSD } from '../FormattedValue';
import { FormattedMessage, useIntl } from 'react-intl';
import ResultsTranslate from '../Translate/Translate';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { ProgramCategory } from '../../../Types/Results';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';

// NOTE: keys must be lower case
export const headingOptionsMappings: { [key: string]: React.ComponentType } = {
  housing: Residence,
  food: Food,
  health_care: HealthCare,
  transportation: Transportation,
  tax_credit: TaxCredits,
  cash: CashAssistance,
  child_care: ChildCareYouthEducation,
  water_heater: WaterHeater,
  light_bulb: LightBulb,
  heat: Heat,
  low_fuel: LowFuel,
  talk: Talk,
  food_groceries: Food,
  baby_supplies: Baby_supplies,
  managing_housing: Housing,
  behavioral_health: Support,
  child_development: Child_development,
  family_planning: Family_planning,
  job_resources: Job_resources,
  dental_care: Dental_care,
  legal_services: Legal_services,
  veteran_services: Military, 
};

type CategoryHeadingProps = {
  category: ProgramCategory;
  showAmount?: boolean;
};

const CategoryHeading = ({ category, showAmount }: CategoryHeadingProps) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();
  const translateNumber = useTranslateNumber();

  let IconComponent = headingOptionsMappings[category.icon];

  if (IconComponent === undefined) {
    // if there is a category not in the list of categories use a default icon
    IconComponent = CashAssistance;
  }

  const monthlyCategoryAmt = calculateTotalValue(category) / 12;
  const shouldShowAmount = showAmount ?? !getReferrer('featureFlags').includes('dont_show_category_values');

  const categoryImageAriaLabelProps = {
    id: category.name.label,
    defaultMessage: category.name.default_message,
  };
  const iconTranslation = intl.formatMessage({ id: 'categoryHeading.icon', defaultMessage: 'icon' });

  return (
    <div>
      <div className="category-heading-container">
        <div className="category-heading-column">
          <div
            className="category-heading-icon"
            aria-label={`${intl.formatMessage(categoryImageAriaLabelProps)} ${iconTranslation}`}
            role="img"
          >
            <IconComponent />
          </div>
          <h2 className="category-heading-text-style">
            <ResultsTranslate translation={category.name} />
          </h2>
        </div>
        {shouldShowAmount && monthlyCategoryAmt !== 0 && (
          <div className="box-right">
            <h2 className="category-heading-text-style normal-weight">
              {translateNumber(formatToUSD(monthlyCategoryAmt))}
              <FormattedMessage id="program-card-month-txt" defaultMessage="/month" />
            </h2>
          </div>
        )}
      </div>
      {category.description.default_message !== '' && (
        <p className="child-care-warning-text">
          <ResultsTranslate translation={category.description} />
        </p>
      )}
    </div>
  );
};

export default CategoryHeading;
