import { ReactNode, useRef, useEffect } from 'react';
import { IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './ModalShell.css';

type ModalShellProps = {
  /** Icon rendered inside the header circle */
  headerIcon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  onBack?: () => void;
  children: ReactNode;
};

const ModalShell = ({ headerIcon, title, subtitle, onClose, onBack, children }: ModalShellProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  return (
    <>
      <div className="modal-shell-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        className="modal-shell-card"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {onBack && (
          <IconButton
            aria-label="Back"
            size="small"
            className="modal-shell-back-btn"
            onClick={onBack}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
        )}

        <IconButton
          aria-label="Close dialog"
          size="small"
          className="modal-shell-close-btn"
          onClick={onClose}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>

        <div className="modal-shell-header-icon" aria-hidden="true">
          {headerIcon}
        </div>

        <Typography variant="h6" component="h2" className="modal-shell-title">
          {title}
        </Typography>

        {subtitle && (
          <Typography className="modal-shell-subtitle">
            {subtitle}
          </Typography>
        )}

        {children}
      </div>
    </>
  );
};

export default ModalShell;
