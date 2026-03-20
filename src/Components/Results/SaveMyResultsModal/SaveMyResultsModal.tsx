import SaveIcon from '@mui/icons-material/SaveOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import ModalShell from '../shared/ModalShell';
import ModalOption from '../shared/ModalOption';
import { useCopyFeedback } from '../shared/useCopyFeedback';
import '../shared/ModalShell.css';
import SaveViaEmailForm from './SaveViaEmailForm';
import SaveViaSMSForm from './SaveViaSMSForm';
import SaveViaWhatsAppForm from './SaveViaWhatsAppForm';

type SaveView = 'options' | 'email' | 'sms' | 'whatsapp' | 'success';

type SaveMyResultsModalProps = {
  onClose: () => void;
};

const SaveMyResultsModal = ({ onClose }: SaveMyResultsModalProps) => {
  const { formatMessage } = useIntl();
  const [view, setView] = useState<SaveView>('options');
  const { copied, copyError, handleCopy } = useCopyFeedback();

  const subtitles: Record<SaveView, React.ReactNode> = {
    options: <FormattedMessage id="saveMyResults.subtitle" defaultMessage="Choose how to save your results" />,
    email: <FormattedMessage id="saveMyResults.emailSubtitle" defaultMessage="Enter your email address" />,
    sms: <FormattedMessage id="saveMyResults.smsSubtitle" defaultMessage="Enter your phone number" />,
    whatsapp: <FormattedMessage id="saveMyResults.whatsappSubtitle" defaultMessage="Enter your phone number" />,
    success: <FormattedMessage id="saveMyResults.successSubtitle" defaultMessage="Your results are on their way!" />,
  };

  return (
    <ModalShell
      headerIcon={view === 'success' ? <CheckCircleOutlineIcon /> : <SaveIcon />}
      title={
        view === 'success' ? (
          <FormattedMessage id="saveMyResults.successTitle" defaultMessage="Results Sent" />
        ) : (
          <FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />
        )
      }
      subtitle={subtitles[view]}
      onClose={onClose}
      onBack={view !== 'options' && view !== 'success' ? () => setView('options') : undefined}
    >
      {view === 'options' && (
        <>
          <div className="modal-options-list">
            <ModalOption
              icon={<span className="modal-option-icon-circle"><EmailIcon /></span>}
              label={<FormattedMessage id="saveMyResults.email" defaultMessage="Email" />}
              sublabel={<FormattedMessage id="saveMyResults.emailSublabel" defaultMessage="Email a link to your results" />}
              onClick={() => setView('email')}
            />

            <ModalOption
              icon={<span className="modal-option-icon-circle"><SmsIcon /></span>}
              label={<FormattedMessage id="saveMyResults.sms" defaultMessage="SMS" />}
              sublabel={<FormattedMessage id="saveMyResults.smsSublabel" defaultMessage="Text a link to your results" />}
              onClick={() => setView('sms')}
            />

            <ModalOption
              icon={<span className="modal-option-icon-circle"><WhatsAppIcon /></span>}
              label={<FormattedMessage id="saveMyResults.whatsapp" defaultMessage="WhatsApp" />}
              sublabel={<FormattedMessage id="saveMyResults.whatsappSublabel" defaultMessage="Send a link to your results via WhatsApp" />}
              onClick={() => setView('whatsapp')}
            />

            <ModalOption
              icon={
                <span className="modal-option-icon-circle">
                  {copied ? <CheckIcon /> : copyError ? <ErrorOutlineIcon /> : <LinkIcon />}
                </span>
              }
              label={
                copied ? (
                  <span className="modal-option-copied-label">
                    <FormattedMessage id="saveMyResults.copied" defaultMessage="Copied!" />
                  </span>
                ) : copyError ? (
                  <span className="modal-option-copy-error-label">
                    <FormattedMessage id="saveMyResults.copyFailed" defaultMessage="Copy failed" />
                  </span>
                ) : (
                  <FormattedMessage id="saveMyResults.copyLink" defaultMessage="Copy to Clipboard" />
                )
              }
              sublabel={
                copyError ? (
                  <FormattedMessage id="saveMyResults.copyFailedSublabel" defaultMessage="Could not access clipboard" />
                ) : copied ? undefined : (
                  <FormattedMessage id="saveMyResults.copyLinkSublabel" defaultMessage="Copy a link to your results" />
                )
              }
              onClick={() => handleCopy(window.location.href)}
            />
          </div>

          <p className="save-my-results-privacy-note">
            <FormattedMessage
              id="saveMyResults.privacy-note"
              defaultMessage="*Your contact information will only be used to send your results. We will not store your email address or cell phone number."
            />
          </p>
        </>
      )}

      {view === 'email' && <SaveViaEmailForm onSuccess={() => setView('success')} />}
      {view === 'sms' && <SaveViaSMSForm onSuccess={() => setView('success')} />}
      {view === 'whatsapp' && <SaveViaWhatsAppForm onSuccess={() => setView('success')} />}

      {view === 'success' && (
        <div className="save-my-results-success">
          <button type="button" className="modal-primary-btn" onClick={onClose}>
            <FormattedMessage id="saveMyResults.successClose" defaultMessage="Done" />
          </button>
        </div>
      )}
    </ModalShell>
  );
};

export default SaveMyResultsModal;
