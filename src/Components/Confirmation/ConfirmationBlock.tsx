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

// Simple section wrapper without header styling (for basic sections)
type ConfirmationSectionParams = PropsWithChildren<{
  title: ReactNode;
  stepName: QuestionName;
  editAriaLabel: MessageDescriptor;
  noReturn?: boolean;
  editUrlEnding?: string;
}>;

export function ConfirmationSection({
  title,
  stepName,
  editAriaLabel,
  noReturn = false,
  editUrlEnding = '',
  children,
}: ConfirmationSectionParams) {
  const { whiteLabel, uuid } = useParams();
  const { formatMessage } = useIntl();
  const stepNumber = useStepNumber(stepName);
  const locationState = noReturn ? undefined : { routedFromConfirmationPg: true };

  return (
    <div className="simple-confirmation-section">
      <div className="simple-section-header">
        <h2>{title}</h2>
        <Link
          to={`/${whiteLabel}/${uuid}/step-${stepNumber}/${editUrlEnding}`}
          state={locationState}
          className="edit-button-simple"
          aria-label={formatMessage(editAriaLabel)}
        >
          <Edit title={formatMessage(editAriaLabel)} />
        </Link>
      </div>
      <div className="simple-section-content">{children}</div>
    </div>
  );
}

// Full ConfirmationBlock with styled header (for household member details table)
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
    <div className="confirmation-section">
      <div className="confirmation-section-header">
        <h2>
          <div className="confirmation-icon">{icon}</div>
          {title}
        </h2>
        <Link
          to={`/${whiteLabel}/${uuid}/step-${stepNumber}/${editUrlEnding}`}
          state={locationState}
          className="edit-button"
          aria-label={formatMessage(editAriaLabel)}
        >
          <Edit title={formatMessage(editAriaLabel)} />
        </Link>
      </div>
      <div className="confirmation-section-content">{children}</div>
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
    <div className="confirmation-row">
      {label && <div className="confirmation-row-label">{label}</div>}
      <div className="confirmation-row-value">{value}</div>
    </div>
  );
}

export function formatToUSD(num: number, significantFigures: number = 2) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    // minimumFractionDigits: 0,
    maximumFractionDigits: significantFigures,
  }).format(num);
}
