import { calculateTotalValue, formatToUSD } from '../FormattedValue';
import { FormattedMessage, useIntl } from 'react-intl';
import ResultsTranslate from '../Translate/Translate';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { ProgramCategory } from '../../../Types/Results';
import { useContext } from 'react';
import { Context } from '../../Wrapper/Wrapper';
import { ICON_NAME_MAP } from '../helpers';
import { Icon } from '../../Icon/Icon';

type CategoryHeadingProps = {
  category: ProgramCategory;
  showAmount?: boolean;
};

const CategoryHeading = ({ category, showAmount }: CategoryHeadingProps) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();
  const translateNumber = useTranslateNumber();

  const iconKey = category.icon.toLowerCase();
  const lucideIconName = ICON_NAME_MAP[iconKey] ?? ICON_NAME_MAP['default'];

  const monthlyCategoryAmt = calculateTotalValue(category) / 12;
  const shouldShowAmount = showAmount ?? !getReferrer('uiOptions').includes('dont_show_category_values');

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
            <Icon name={lucideIconName} aria-hidden={true} />
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
        <p className="results-category-description">
          <ResultsTranslate translation={category.description} />
        </p>
      )}
    </div>
  );
};

export default CategoryHeading;
