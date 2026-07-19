import { ReactNode, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import { ConfirmationItem } from './ConfirmationBlock';
import { RowEditLink } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';
import { useStepNumber } from '../../Assets/stepDirectory';
import { Icon } from '../Icon/Icon';

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

export default function ConfirmationAcuteConditions() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');
  const hasBenefitsStepNumber = useStepNumber('hasBenefits', false);
  const needsSectionHeader = hasBenefitsStepNumber === -1;

  const acuteConditionsValue = () => {
    const allNeeds = Object.entries(formData.acuteHHConditions).filter(([, value]) => value === true);

    if (allNeeds.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    return (
      <ul className="confirmation-acute-need-list">
        {allNeeds.map(([key]) => {
          const option = acuteConditionOptions[key];
          const label =
            option?.text?.props && 'id' in option.text.props ? formatMessage({ ...option.text.props }) : key;
          return <li key={key}>{label}</li>;
        })}
      </ul>
    );
  };

  const row = (
    <ConfirmationItem
      label={
        <FormattedMessage
          id="confirmation.displayAllFormData-acuteHHConditions"
          defaultMessage="Additional Resources"
        />
      }
      value={acuteConditionsValue()}
      editLink={
        <RowEditLink
          stepName="acuteHHConditions"
          ariaLabel={formatMessage({
            id: 'confirmation.acuteConditions.edit-AL',
            defaultMessage: 'edit immediate needs',
          })}
        />
      }
    />
  );

  if (needsSectionHeader) {
    return (
      <div className="simple-confirmation-section">
        <div className="simple-section-header">
          <h2>
            <Icon name="shield-check" aria-hidden={true} />
            <FormattedMessage
              id="confirmation.benefitsAndAdditionalInfo"
              defaultMessage="Benefits & Additional Information"
            />
          </h2>
        </div>
        <div className="simple-section-content">{row}</div>
      </div>
    );
  }

  return row;
}
