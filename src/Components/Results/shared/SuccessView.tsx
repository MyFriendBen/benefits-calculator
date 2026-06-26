import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { ReactNode } from 'react';
import ModalShell from './ModalShell';

type SuccessViewProps = {
  title: ReactNode;
  subtitle: ReactNode;
  doneLabel: ReactNode;
  onClose: () => void;
};

const SuccessView = ({ title, subtitle, doneLabel, onClose }: SuccessViewProps) => {
  return (
    <ModalShell headerIcon={<CheckCircleOutlineIcon />} title={title} subtitle={subtitle} onClose={onClose}>
      <div className="share-modal-success-actions">
        <button type="button" className="modal-primary-btn" onClick={onClose}>
          {doneLabel}
        </button>
      </div>
    </ModalShell>
  );
};

export default SuccessView;
