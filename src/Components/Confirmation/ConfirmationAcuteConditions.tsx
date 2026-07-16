import { ReactNode, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import { ConfirmationItem } from './ConfirmationBlock';
import { RowEditLink } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';

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

  return (
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
}
