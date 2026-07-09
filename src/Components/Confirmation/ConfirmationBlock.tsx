import { Pencil } from 'lucide-react';
import { PropsWithChildren, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QuestionName } from '../../Types/Questions';
import './Confirmation.css';
import { useStepNumber } from '../../Assets/stepDirectory';
import { MessageDescriptor, useIntl } from 'react-intl';
export { formatToUSD } from '../../utils/formatCurrency';

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
    <div className="confirmation-section">
      <div className="confirmation-section-header">
        <h2>
          <div className="confirmation-icon">{icon}</div>
          {title}
        </h2>
        <Link
          to={`/${whiteLabel}/${uuid}/step-${stepNumber}/${editUrlEnding}`}
          state={locationState}
          className="edit-button-simple"
          aria-label={formatMessage(editAriaLabel)}
        >
          <Pencil aria-hidden={true} />
        </Link>
      </div>
      <div className="confirmation-section-content">{children}</div>
    </div>
  );
}

type ConfirmationItemParams = {
  label?: ReactNode;
  value: ReactNode;
  editLink?: ReactNode;
};

// be sure to include the ":" in the label
export function ConfirmationItem({ label, value, editLink }: ConfirmationItemParams) {
  return (
    <div className="confirmation-row">
      {label && <div className="confirmation-row-label">{label}</div>}
      <div className="confirmation-row-value">
        <div className="confirmation-row-value-content">{value}</div>
        {editLink && <div className="confirmation-row-value-edit">{editLink}</div>}
      </div>
    </div>
  );
}
