import { useState, useCallback } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import { FormattedMessage } from 'react-intl';
import ModalShell from '../shared/ModalShell';
import ModalOption from '../shared/ModalOption';
import '../shared/ModalShell.css';
import SaveEmailForm from './SaveEmailForm';
import SavePhoneForm from './SavePhoneForm';

type SaveView = 'options' | 'email' | 'sms';

type SaveMyResultsModalProps = {
  onClose: () => void;
};

const COPY_FEEDBACK_MS = 2000;

const subtitles: Record<SaveView, React.ReactNode> = {
  options: <FormattedMessage id="saveMyResults.subtitle" defaultMessage="Choose how to save your results" />,
  email: <FormattedMessage id="saveMyResults.emailSubtitle" defaultMessage="Enter your email address" />,
  sms: <FormattedMessage id="saveMyResults.smsSubtitle" defaultMessage="Enter your phone number" />,
};

const SaveMyResultsModal = ({ onClose }: SaveMyResultsModalProps) => {
  const [view, setView] = useState<SaveView>('options');
  const [copied, setCopied] = useState(false);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, []);

  return (
    <ModalShell
      headerIcon={<SaveIcon />}
      title={<FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />}
      subtitle={subtitles[view]}
      onClose={onClose}
      onBack={view !== 'options' ? () => setView('options') : undefined}
    >
      {view === 'options' && (
        <div className="modal-options-list">
          <ModalOption
            icon={<span className="modal-option-icon-circle"><EmailIcon style={{ fontSize: '1.25rem' }} /></span>}
            label={<FormattedMessage id="saveMyResults.email" defaultMessage="Email" />}
            sublabel={<FormattedMessage id="saveMyResults.emailSublabel" defaultMessage="Email a link to your results" />}
            onClick={() => setView('email')}
          />

          <ModalOption
            icon={<span className="modal-option-icon-circle"><SmsIcon style={{ fontSize: '1.25rem' }} /></span>}
            label={<FormattedMessage id="saveMyResults.sms" defaultMessage="SMS" />}
            sublabel={<FormattedMessage id="saveMyResults.smsSublabel" defaultMessage="Text a link to your results" />}
            onClick={() => setView('sms')}
          />

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
            sublabel={copied ? undefined : <FormattedMessage id="saveMyResults.copyLinkSublabel" defaultMessage="Copy a link to your results" />}
            onClick={handleCopyLink}
          />
        </div>
      )}

      {view === 'email' && (
        <SaveEmailForm onSuccess={() => setView('options')} />
      )}

      {view === 'sms' && (
        <SavePhoneForm onSuccess={() => setView('options')} />
      )}

      <p className="save-my-results-privacy-note">
        <FormattedMessage
          id="saveMyResults.privacy-note"
          defaultMessage="*Your contact information will only be used to send your results. We will not store your email address or cell phone number."
        />
      </p>
    </ModalShell>
  );
};

export default SaveMyResultsModal;
