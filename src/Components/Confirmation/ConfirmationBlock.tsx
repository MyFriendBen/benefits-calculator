import { ReactComponent as Edit } from '../../Assets/icons/General/edit.svg';
import { PropsWithChildren, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuestionName } from '../../Types/Questions';
import './Confirmation.css';
import { useStepNumber } from '../../Assets/stepDirectory';
import { MessageDescriptor, useIntl } from 'react-intl';

type ConfirmationBlockParams = PropsWithChildren<{
  icon: ReactNode;
  title: ReactNode;
  stepName: QuestionName;
  editAriaLabel: MessageDescriptor;
  noReturn?: boolean;
  editUrlEnding?: string;
}>;

export default function ConfirmationBlock({
  icon,
  title,
  stepName,
  editAriaLabel,
  noReturn = false,
  editUrlEnding = '',
  children,
}: ConfirmationBlockParams) {
  const { whiteLabel, uuid } = useParams();
  const { formatMessage } = useIntl();
  const stepNumber = useStepNumber(stepName);
  const locationState = noReturn ? undefined : { routedFromConfirmationPg: true };

  return (
    <div className="confirmation-block-container">
      <div className="confirmation-icon">{icon}</div>
      <div className="confirmation-block-content">
        <p className="section-title">{title}</p>
        {children}
      </div>
      <Link
        to={`/${whiteLabel}/${uuid}/step-${stepNumber}/${editUrlEnding}`}
        state={locationState}
        className="edit-button"
        aria-label={formatMessage(editAriaLabel)}
      >
        <Edit title={formatMessage(editAriaLabel)} />
      </Link>
    </div>
  );
}

type ConfirmationItemParams = {
  label?: ReactNode;
  value: ReactNode;
};

// be sure to include the ":" in the label
export function ConfirmationItem({ label, value }: ConfirmationItemParams) {
  return (
    <div className="section-p">
      {label && <strong>{label}</strong>} {value}
    </div>
  );
}

export function formatToUSD(num: number, significantFigures: number = Number.isInteger(num) ? 0 : 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: significantFigures,
  }).format(num);
}
