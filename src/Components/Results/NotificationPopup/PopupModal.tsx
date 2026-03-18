import { Alert, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRef, useEffect } from 'react';
import './Popup.css';

type PopupModalProps = {
  onClose: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
  containerClassName?: string;
  backdropClassName?: string;
  closeButtonClassName?: string;
};

const PopupModal = ({
  onClose,
  ariaLabel = 'Popup dialog',
  children,
  containerClassName = '',
  backdropClassName = '',
  closeButtonClassName = '',
}: PopupModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <>
      <div
        className={`popup-backdrop${backdropClassName ? ` ${backdropClassName}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        className={`popup-modal-container${containerClassName ? ` ${containerClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        <Alert
          severity="info"
          icon={false}
          action={
            <IconButton
              aria-label="Close dialog"
              color="inherit"
              size="small"
              onClick={onClose}
              className={`popup-modal-close-btn${closeButtonClassName ? ` ${closeButtonClassName}` : ''}`}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          {children}
        </Alert>
      </div>
    </>
  );
};

export default PopupModal;
