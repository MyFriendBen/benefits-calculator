import { useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { HasBenefitsProgram } from '../../Types/ApiCalls';
import { ConfirmationItem } from './ConfirmationBlock';
import { RowEditLink } from './ConfirmationBlock';
import { Icon } from '../Icon/Icon';
import { Context } from '../Wrapper/Wrapper';

export default function ConfirmationBenefitsInfo() {
  const { formData, hasBenefitsPrograms } = useContext(Context);
  const { formatMessage } = useIntl();

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
      <div className="simple-section-content">
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
      </div>
    </div>
  );
}
