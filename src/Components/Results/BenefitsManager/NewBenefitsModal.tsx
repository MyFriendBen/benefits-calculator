import CloseIcon from '@mui/icons-material/Close';
import CelebrationIcon from '@mui/icons-material/Celebration';
import { FormattedMessage, useIntl } from 'react-intl';
import { Program } from '../../../Types/Results';
import ResultsTranslate from '../Translate/Translate';
import { useFormatDisplayValue } from '../FormattedValue';

type NewBenefitsModalProps = {
  approvedProgram: Program;
  newBenefits: NewBenefit[];
  onSelectBenefit: (benefit: NewBenefit) => void;
  onClose: () => void;
};

export type NewBenefit = {
  id: number;
  name: string;
  value: string;
  description: string;
};

// Demo data: maps program external_name to unlocked benefits
// In production this would come from the API
const DEMO_UNLOCKED_BENEFITS: Record<string, NewBenefit[]> = {
  _default: [
    {
      id: 9001,
      name: 'Weatherization Assistance Program',
      value: '$450/year',
      description: 'Free home energy upgrades including insulation, air sealing, and furnace repair to reduce utility bills.',
    },
    {
      id: 9002,
      name: 'Free School Meals',
      value: '$180/month',
      description: 'Automatic eligibility for free breakfast and lunch for all children in the household at participating schools.',
    },
    {
      id: 9003,
      name: 'Childcare Assistance',
      value: '$600/month',
      description: 'Subsidized childcare for eligible families, covering a significant portion of daycare and after-school program costs.',
    },
  ],
};

export function getUnlockedBenefits(program: Program): NewBenefit[] {
  return DEMO_UNLOCKED_BENEFITS[program.external_name] ?? DEMO_UNLOCKED_BENEFITS['_default'];
}

function NewBenefitCard({ benefit, onClick }: { benefit: NewBenefit; onClick: () => void }) {
  return (
    <button type="button" className="new-benefit-card" onClick={onClick}>
      <div className="new-benefit-card-name">{benefit.name}</div>
      <div className="new-benefit-card-value">{benefit.value}</div>
      <div className="new-benefit-card-desc">{benefit.description}</div>
    </button>
  );
}

const NewBenefitsModal = ({ approvedProgram, newBenefits, onSelectBenefit, onClose }: NewBenefitsModalProps) => {
  const { formatMessage } = useIntl();

  return (
    <div className="new-benefits-overlay" onClick={onClose}>
      <div
        className="new-benefits-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={formatMessage({ id: 'newBenefits.ariaLabel', defaultMessage: 'New benefits unlocked' })}
      >
        <button
          type="button"
          className="new-benefits-close"
          onClick={onClose}
          aria-label={formatMessage({ id: 'newBenefits.close', defaultMessage: 'Close' })}
        >
          <CloseIcon />
        </button>

        <div className="new-benefits-header">
          <CelebrationIcon style={{ fontSize: '2.5rem', color: '#4caf50' }} />
          <h2 className="new-benefits-title">
            <FormattedMessage id="newBenefits.congrats" defaultMessage="Congratulations!" />
          </h2>
          <p className="new-benefits-subtitle">
            <FormattedMessage
              id="newBenefits.message"
              defaultMessage="Because you were approved for {program}, you're automatically eligible for {count} new benefits:"
              values={{
                program: <strong><ResultsTranslate translation={approvedProgram.name} /></strong>,
                count: <strong>{newBenefits.length}</strong>,
              }}
            />
          </p>
        </div>

        <div className="new-benefits-list">
          {newBenefits.map((benefit) => (
            <NewBenefitCard
              key={benefit.id}
              benefit={benefit}
              onClick={() => onSelectBenefit(benefit)}
            />
          ))}
        </div>

        <div className="new-benefits-footer">
          <button type="button" className="new-benefits-done-btn" onClick={onClose}>
            <FormattedMessage id="newBenefits.done" defaultMessage="Great, thanks!" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewBenefitsModal;
