import { FormattedMessage, useIntl } from 'react-intl';
import ConfirmationBlock from '../../Confirmation/ConfirmationBlock';
import { Icon } from '../../Icon/Icon';
import { Context } from '../../Wrapper/Wrapper';
import { useContext } from 'react';

const UtilityStatus = () => {
  const { formData } = useContext(Context);
  const { energyCalculator } = formData;
  const notApplicable =
    !energyCalculator?.electricityIsDisconnected &&
    !energyCalculator?.hasPastDueEnergyBills &&
    !energyCalculator?.hasOldCar;
  const { formatMessage } = useIntl();
  const editUtilityStatusAriaLabel = {
    id: 'energyCalculator.confirmation.utilityStatus.edit-AL',
    defaultMessage: 'edit utility status',
  };
  const utilityStatusIconAlt = {
    id: 'energyCalculator.confirmation.utilityStatus.icon-AL',
    defaultMessage: 'utility status',
  };

  return (
    <ConfirmationBlock
      icon={
        <Icon
          name="file-warning"
          className="confirmation-lucide-icon"
          aria-label={formatMessage(utilityStatusIconAlt)}
        />
      }
      title={
        <FormattedMessage
          id="energyCalculator.confirmation.utilityStatus"
          defaultMessage="Disconnection Notice or Past Due Bill"
        />
      }
      editAriaLabel={editUtilityStatusAriaLabel}
      stepName="energyCalculatorUtilityStatus"
    >
      {energyCalculator?.electricityIsDisconnected && (
        <p style={{ marginBottom: '.5rem' }}>
          <FormattedMessage
            id="energyCalculator.confirmation.energyIsDisconnected"
            defaultMessage="Your electricity and/or gas is currently disconnected"
          />
        </p>
      )}
      {energyCalculator?.hasPastDueEnergyBills && (
        <p style={{ marginBottom: '.5rem' }}>
          <FormattedMessage
            id="energyCalculator.confirmation.hasPastDueEnergyBills"
            defaultMessage="You have a past-due electric or heating bill or you are low on fuel"
          />
        </p>
      )}
      {energyCalculator?.hasOldCar && (
        <p style={{ marginBottom: '.5rem' }}>
          <FormattedMessage
            id="energyCalculator.confirmation.hasOldCar"
            defaultMessage="You have a gas or diesel-powered vehicle that is 12+ years old or has failed an emissions test"
          />
        </p>
      )}
      {notApplicable && (
        <p>
          <FormattedMessage id="energyCalculator.confirmation.notApplicable" defaultMessage="Not applicable" />
        </p>
      )}
    </ConfirmationBlock>
  );
};
export default UtilityStatus;
