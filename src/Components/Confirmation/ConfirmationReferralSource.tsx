import { useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useReferralOptions } from '../../hooks/useReferralOptions';
import { ConfirmationItem } from './ConfirmationBlock';
import { RowEditLink } from './ConfirmationBlock';
import { Context } from '../Wrapper/Wrapper';

export default function ConfirmationReferralSource() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();
  const { allOptions, loading } = useReferralOptions();

  if (formData.referralSource === undefined || loading) {
    return null;
  }

  const displayValue =
    formData.referralSource in allOptions
      ? formatMessage({
          id: `referralOptions.${formData.referralSource}`,
          defaultMessage: allOptions[formData.referralSource],
        })
      : formData.referralSource;

  return (
    <ConfirmationItem
      label={
        <FormattedMessage
          id="confirmation.displayAllFormData-referralSourceText"
          defaultMessage="Referral Source"
        />
      }
      value={displayValue}
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
  );
}
