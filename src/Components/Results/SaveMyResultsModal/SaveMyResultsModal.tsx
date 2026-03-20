import { useState, useCallback, useContext } from 'react';
import { IconButton, Snackbar } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { FormattedMessage, useIntl } from 'react-intl';
import ModalShell from '../shared/ModalShell';
import ModalOption from '../shared/ModalOption';
import '../shared/ModalShell.css';
import SaveEmailForm from './SaveEmailForm';
import SavePhoneForm from './SavePhoneForm';

type SaveView = 'options' | 'email' | 'sms';

type SaveMyResultsModalProps = {
  onClose: () => void;
};

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

const COPY_FEEDBACK_MS = 2000;

const SaveMyResultsModal = ({ onClose }: SaveMyResultsModalProps) => {
  const intl = useIntl();
  const [view, setView] = useState<SaveView>('options');
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, []);

  const titles: Record<SaveView, React.ReactNode> = {
    options: <FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />,
    email: <FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />,
    sms: <FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />,
  };

  const subtitles: Record<SaveView, React.ReactNode> = {
    options: <FormattedMessage id="saveMyResults.subtitle" defaultMessage="Choose how to save your results" />,
    email: <FormattedMessage id="saveMyResults.emailSubtitle" defaultMessage="Enter your email address" />,
    sms: <FormattedMessage id="saveMyResults.smsSubtitle" defaultMessage="Enter your phone number" />,
  };

  return (
    <>
      <ModalShell
        headerIcon={<SaveIcon />}
        title={titles[view]}
        subtitle={subtitles[view]}
        onClose={onClose}
        onBack={view !== 'options' ? () => setView('options') : undefined}
      >
        {view === 'options' && (
          <div className="modal-options-list">
            <ModalOption
              icon={<span className="modal-option-icon-circle"><EmailIcon style={{ fontSize: '1.25rem' }} /></span>}
              label={<FormattedMessage id="saveMyResults.email" defaultMessage="Email" />}
              sublabel={<FormattedMessage id="saveMyResults.emailSublabel" defaultMessage="Send results to my email" />}
              onClick={() => setView('email')}
            />

            {isMobile() && (
              <ModalOption
                icon={<span className="modal-option-icon-circle"><SmsIcon style={{ fontSize: '1.25rem' }} /></span>}
                label={<FormattedMessage id="saveMyResults.sms" defaultMessage="SMS" />}
                sublabel={<FormattedMessage id="saveMyResults.smsSublabel" defaultMessage="Text results to my phone" />}
                onClick={() => setView('sms')}
              />
            )}

            <ModalOption
              icon={
                <span className="modal-option-icon-circle">
                  {copied ? <CheckIcon style={{ fontSize: '1.25rem' }} /> : <LinkIcon style={{ fontSize: '1.25rem' }} />}
                </span>
              }
              label={
                copied
                  ? <span className="modal-option-copied-label"><FormattedMessage id="saveMyResults.copied" defaultMessage="Copied!" /></span>
                  : <FormattedMessage id="saveMyResults.copyLink" defaultMessage="Copy to Clipboard" />
              }
              sublabel={copied ? undefined : <FormattedMessage id="saveMyResults.copyLinkSublabel" defaultMessage="Copy results summary" />}
              onClick={handleCopyLink}
            />
          </div>
        )}

        {view === 'email' && (
          <SaveEmailForm
            onSuccess={() => {
              setSnackbar({
                open: true,
                message: intl.formatMessage({
                  id: 'emailResults.return-signupCompleted-email',
                  defaultMessage:
                    'A copy of your results have been sent. If you do not see the email in your inbox, please check your spam folder.',
                }),
              });
              setView('options');
            }}
            onError={() => {
              setSnackbar({
                open: true,
                message: intl.formatMessage({
                  id: 'emailResults.error',
                  defaultMessage: 'An error occurred on our end, please try submitting again.',
                }),
              });
            }}
          />
        )}

        {view === 'sms' && (
          <SavePhoneForm
            onSuccess={() => {
              setSnackbar({
                open: true,
                message: intl.formatMessage({
                  id: 'emailResults.return-signupCompleted',
                  defaultMessage: 'A copy of your results have been sent.',
                }),
              });
              setView('options');
            }}
            onError={() => {
              setSnackbar({
                open: true,
                message: intl.formatMessage({
                  id: 'emailResults.error',
                  defaultMessage: 'An error occurred on our end, please try submitting again.',
                }),
              });
            }}
          />
        )}

        <p className="save-my-results-privacy-note">
          <FormattedMessage
            id="saveMyResults.privacy-note"
            defaultMessage="*Your contact information will only be used to send your results. We will not store your email address or cell phone number."
          />
        </p>
      </ModalShell>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        action={
          <IconButton
            size="small"
            aria-label={intl.formatMessage({ id: 'emailResults.close-AL', defaultMessage: 'close' })}
            color="inherit"
            onClick={() => setSnackbar({ ...snackbar, open: false })}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </>
  );
};

export default SaveMyResultsModal;
