import { useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ConfirmationBlock from '../../Confirmation/ConfirmationBlock';
import { Context } from '../../Wrapper/Wrapper';
import { ReactComponent as Fire } from '../../EnergyCalculator/Icons/Fire.svg';

import { FormattedMessageType } from '../../../Types/Questions';
import { OTHER_GAS_PROVIDERS } from '../providers';

export default function EnergyCalculatorGasProvider() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();

  const gasProvider = formData.energyCalculator?.gasProvider ?? 'other';

  let providerName: string | FormattedMessageType;
  if (formData.energyCalculator?.gasProviderName) {
    providerName = formData.energyCalculator.gasProviderName;
  } else if (OTHER_GAS_PROVIDERS[gasProvider]) {
    providerName = OTHER_GAS_PROVIDERS[gasProvider];
  } else {
    providerName = <FormattedMessage id="energyCalculator.gasProvider.other" defaultMessage="Other" />;
  }

  const editGasProviderAriaLabel = {
    id: 'energyCalculator.confirmation.gasProvider.edit-AL',
    defaultMessage: 'edit gas provider',
  };
  const gasProviderIconAlt = {
    id: 'energyCalculator.confirmation.gasProvider.icon-AL',
    defaultMessage: 'gas provider',
  };

  return (
    <ConfirmationBlock
      icon={<Fire className="confirmation-lucide-icon" title={formatMessage(gasProviderIconAlt)} />}
      title={<FormattedMessage id="energyCalculator.confirmation.gasProvider" defaultMessage="Gas Utility Provider" />}
      editAriaLabel={editGasProviderAriaLabel}
      stepName="energyCalculatorGasProvider"
    >
      {providerName}
    </ConfirmationBlock>
  );
}
