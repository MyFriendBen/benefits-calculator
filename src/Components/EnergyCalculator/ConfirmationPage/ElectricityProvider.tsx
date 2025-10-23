import { useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ConfirmationBlock from '../../Confirmation/ConfirmationBlock';
import { Context } from '../../Wrapper/Wrapper';
import { ReactComponent as Lightbulb } from '../../EnergyCalculator/Icons/Lightbulb.svg';
import { FormattedMessageType } from '../../../Types/Questions';
import { OTHER_ELECTRIC_PROVIDERS } from '../providers';

export default function EnergyCalculatorElectricityProvider() {
  const { formData } = useContext(Context);
  const { formatMessage } = useIntl();

  const electricProvider = formData.energyCalculator?.electricProvider ?? 'other';

  let providerName: string | FormattedMessageType;
  if (formData.energyCalculator?.electricProviderName) {
    providerName = formData.energyCalculator?.electricProviderName;
  } else if (OTHER_ELECTRIC_PROVIDERS[electricProvider]) {
    providerName = OTHER_ELECTRIC_PROVIDERS[electricProvider];
  } else {
    providerName = <FormattedMessage id="energyCalculator.electricityProvider.other" defaultMessage="Other" />;
  }

  const editElectricityProviderAriaLabel = {
    id: 'energyCalculator.confirmation.electricityProvider.edit-AL',
    defaultMessage: 'edit electricity provider',
  };
  const electricityProviderIconAlt = {
    id: 'energyCalculator.confirmation.electricityProvider.icon-AL',
    defaultMessage: 'electricity provider',
  };

  return (
    <ConfirmationBlock
      icon={<Lightbulb className="confirmation-lucide-icon" title={formatMessage(electricityProviderIconAlt)} />}
      title={
        <FormattedMessage
          id="energyCalculator.confirmation.electricityProvider"
          defaultMessage="Electric Utility Provider"
        />
      }
      editAriaLabel={editElectricityProviderAriaLabel}
      stepName="energyCalculatorElectricityProvider"
    >
      {providerName}
    </ConfirmationBlock>
  );
}
