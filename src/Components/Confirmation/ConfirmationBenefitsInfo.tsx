import { ReactNode, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { HasBenefitsProgram } from '../../Types/ApiCalls';
import { FormattedMessageType } from '../../Types/Questions';
import { useConfig } from '../Config/configHook';
import { ConfirmationItem, RowEditLink } from './ConfirmationBlock';
import { Icon } from '../Icon/Icon';
import { Context } from '../Wrapper/Wrapper';
import { useStepNumber } from '../../Assets/stepDirectory';
import { useReferralOptions } from '../../hooks/useReferralOptions';

type IconAndFormattedMessageMap = {
  [key: string]: {
    text: FormattedMessageType;
    icon: ReactNode;
  };
};

export default function ConfirmationBenefitsInfo() {
  const { formData, hasBenefitsPrograms } = useContext(Context);
  const { formatMessage } = useIntl();
  const acuteConditionOptions = useConfig<IconAndFormattedMessageMap>('acute_condition_options');
  const { allOptions: referralOptions, loading: referralOptionsLoading } = useReferralOptions();

  const hasBenefitsStepNumber = useStepNumber('hasBenefits', false);
  const acuteConditionsStepNumber = useStepNumber('acuteHHConditions', false);

  const benefitsValue = () => {
    const selectedKeys = Array.from(formData.benefits);

    if (selectedKeys.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    const programsByKey = new Map(hasBenefitsPrograms.map((p) => [p.name_abbreviated, p]));

    const matched = selectedKeys
      .map((key) => ({ key, program: programsByKey.get(key) }))
      .filter((entry): entry is { key: string; program: HasBenefitsProgram } => entry.program !== undefined);

    if (matched.length === 0) {
      return <FormattedMessage id="confirmation.none" defaultMessage="None" />;
    }

    return (
      <ul className="confirmation-expense-list">
        {matched.map(({ key, program }) => (
          <li key={key}>
            <FormattedMessage id={program.name.label} defaultMessage={program.name.default_message} />
          </li>
        ))}
      </ul>
    );
  };

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

  const referralDisplayValue = () => {
    if (formData.referralSource === undefined) {
      return null;
    }
    return formData.referralSource in referralOptions
      ? formatMessage({
          id: `referralOptions.${formData.referralSource}`,
          defaultMessage: referralOptions[formData.referralSource],
        })
      : formData.referralSource;
  };

  const showBenefitsRow = hasBenefitsStepNumber !== -1;
  const showAcuteConditionsRow = acuteConditionsStepNumber !== -1;
  const showReferralRow = !referralOptionsLoading && formData.referralSource !== undefined;

  if (!showBenefitsRow && !showAcuteConditionsRow && !showReferralRow) {
    return null;
  }

  return (
    <div className="confirmation-section-container">
      <div className="confirmation-section-header">
        <h2>
          <span className="confirmation-icon">
            <Icon name="shield-check" aria-hidden={true} />
          </span>
          <FormattedMessage
            id="confirmation.benefitsAndAdditionalInfo"
            defaultMessage="Benefits & Additional Information"
          />
        </h2>
      </div>
      <div className="confirmation-section-content">
        {showBenefitsRow && (
          <ConfirmationItem
            label={
              <FormattedMessage
                id="confirmation.displayAllFormData-currentHHBenefitsText"
                defaultMessage="Current Household Benefits"
              />
            }
            value={benefitsValue()}
            editLink={
              <RowEditLink
                stepName="hasBenefits"
                ariaLabel={formatMessage({
                  id: 'confirmation.currentBenefits.edit-AL',
                  defaultMessage: 'edit benefits you already have',
                })}
              />
            }
          />
        )}
        {showAcuteConditionsRow && (
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
        )}
        {showReferralRow && (
          <ConfirmationItem
            label={
              <FormattedMessage
                id="confirmation.displayAllFormData-referralSourceText"
                defaultMessage="Referral Source"
              />
            }
            value={referralDisplayValue()}
            editLink={
              <RowEditLink
                stepName="referralSource"
                ariaLabel={formatMessage({
                  id: 'confirmation.referralSource.edit-AL',
                  defaultMessage: 'edit referral source',
                })}
              />
            }
          />
        )}
      </div>
    </div>
  );
}
