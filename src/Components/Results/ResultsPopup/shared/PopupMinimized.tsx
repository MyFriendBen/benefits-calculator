import { Alert, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './Popup.css';

type PopupMinimizedProps = {
  label: React.ReactNode;
  onRestore: () => void;
  onDismiss?: (e: React.MouseEvent) => void;
  ariaLabel?: string;
  className?: string;
  closeButtonClassName?: string;
};

const PopupMinimized = ({
  label,
  onRestore,
  onDismiss,
  ariaLabel = 'Restore popup',
  className = '',
  closeButtonClassName = '',
}: PopupMinimizedProps) => {
  return (
    <div
      className={`popup-minimized${className ? ` ${className}` : ''}`}
      onClick={onRestore}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRestore();
        }
      }}
      aria-label={ariaLabel}
    >
      <Alert
        severity="info"
        icon={false}
        action={
          onDismiss ? (
            <IconButton
              aria-label="Close popup"
              color="inherit"
              size="small"
              onClick={onDismiss}
              className={`popup-minimized-close-btn${closeButtonClassName ? ` ${closeButtonClassName}` : ''}`}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          ) : undefined
        }
      >
        <Typography variant="body2">{label}</Typography>
      </Alert>
    </div>
  );
};

export default PopupMinimized;
