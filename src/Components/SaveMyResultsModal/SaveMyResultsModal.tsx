import { Snackbar } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import IconButton from '@mui/material/IconButton';
import { forwardRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import EmailTextfield from './EmailTextfield';
import PhoneTextfield from './PhoneTextfield';
import './SaveMyResultsModal.css';

type SaveMyResultsModalProps = {
  close: () => void;
};

const SaveMyResultsModal = forwardRef(function SaveMyResultsModal({ close }: SaveMyResultsModalProps, ref) {
  const intl = useIntl();
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
  });
  const closeAriaLabelProps = {
    id: 'emailResults.close-AL',
    defaultMessage: 'close',
  };

  const action = (
    <>
      <IconButton
        size="small"
        aria-label={intl.formatMessage(closeAriaLabelProps)}
        color="inherit"
        onClick={() => setSnackbar({ ...snackbar, open: false })}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </>
  );

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const displayCopyResults = () => {
    return (
      <div className="bottom-margin">
        <button onClick={copyLink} className="copy-button-and-text">
          {copied ? (
            <CheckIcon sx={{ fontSize: '1.75rem', mr: '.5rem' }} />
          ) : (
            <LinkIcon sx={{ fontSize: '1.75rem', mr: '.5rem' }} />
          )}
          <article className="copy-results-text">
            <FormattedMessage id="emailResults.copy-results-text" defaultMessage="Copy my results link" />
          </article>
        </button>
      </div>
    );
  };

  return (
    <div className="email-results-container">
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={action}
      />
      <IconButton
        aria-label={intl.formatMessage(closeAriaLabelProps)}
        onClick={close}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
        }}
      >
        <CloseIcon />
      </IconButton>
      {displayCopyResults()}
      <EmailTextfield setSnackbar={setSnackbar} />
      <PhoneTextfield setSnackbar={setSnackbar} />
      <p className="privacy-note-container">
        <FormattedMessage
          id="saveMyResults.privacy-note"
          defaultMessage="*Your contact information will only be used to send your results. We will not store your email address or cell phone number."
        />
      </p>
    </div>
  );
});

export default SaveMyResultsModal;
