import SaveIcon from '@mui/icons-material/SaveOutlined';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import ModalShell from '../shared/ModalShell';
import ModalOption from '../shared/ModalOption';
import CopyLinkOption from '../shared/CopyLinkOption';
import SuccessView from '../shared/SuccessView';
import '../shared/ModalShell.css';
import SaveViaEmailForm from './SaveViaEmailForm';
import SaveViaSMSForm from './SaveViaSMSForm';
import SaveViaWhatsAppForm from './SaveViaWhatsAppForm';

type SaveView = 'options' | 'email' | 'sms' | 'whatsapp' | 'success';

type SaveMyResultsModalProps = {
  onClose: () => void;
};

const subtitles: Record<SaveView, React.ReactNode> = {
  options: <FormattedMessage id="saveMyResults.subtitle" defaultMessage="Choose how to save your results" />,
  email: <FormattedMessage id="saveMyResults.emailSubtitle" defaultMessage="Enter your email address" />,
  sms: <FormattedMessage id="saveMyResults.smsSubtitle" defaultMessage="Enter your phone number" />,
  whatsapp: <FormattedMessage id="saveMyResults.whatsappSubtitle" defaultMessage="Enter your phone number" />,
  success: <FormattedMessage id="saveMyResults.successSubtitle" defaultMessage="Your results are on their way!" />,
};

const SaveMyResultsModal = ({ onClose }: SaveMyResultsModalProps) => {
  const [view, setView] = useState<SaveView>('options');

  if (view === 'success') {
    return (
      <SuccessView
        title={<FormattedMessage id="saveMyResults.successTitle" defaultMessage="Results Sent" />}
        subtitle={subtitles.success}
        doneLabel={<FormattedMessage id="saveMyResults.successClose" defaultMessage="Done" />}
        onClose={onClose}
      />
    );
  }

  return (
    <ModalShell
      headerIcon={<SaveIcon />}
      title={<FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />}
      subtitle={subtitles[view]}
      onClose={onClose}
      onBack={view !== 'options' ? () => setView('options') : undefined}
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
            <CopyLinkOption
              url={window.location.href}
              label={<FormattedMessage id="saveMyResults.copyLink" defaultMessage="Copy to Clipboard" />}
              sublabel={<FormattedMessage id="saveMyResults.copyLinkSublabel" defaultMessage="Copy a link to your results" />}
              copiedLabel={<FormattedMessage id="saveMyResults.copied" defaultMessage="Copied!" />}
              errorLabel={<FormattedMessage id="saveMyResults.copyFailed" defaultMessage="Copy failed" />}
              errorSublabel={<FormattedMessage id="saveMyResults.copyFailedSublabel" defaultMessage="Could not access clipboard" />}
            />
          </div>
          <p className="save-my-results-privacy-note">
            <FormattedMessage
              id="saveMyResults.privacyNote"
              defaultMessage="*Your contact information will only be used to send your results. We will not store your email address or cell phone number."
            />
          </p>
        </>
      )}

      {view === 'email' && <SaveViaEmailForm onSuccess={() => setView('success')} />}
      {view === 'sms' && <SaveViaSMSForm onSuccess={() => setView('success')} />}
      {view === 'whatsapp' && <SaveViaWhatsAppForm onSuccess={() => setView('success')} />}

      {(view === 'email' || view === 'sms' || view === 'whatsapp') && (
        <p className="save-my-results-privacy-note">
          <FormattedMessage
            id="saveMyResults.privacyNote"
            defaultMessage="*Your contact information will only be used to send your results. We will not store your email address or cell phone number."
          />
        </p>
      )}
    </ModalShell>
  );
};

export default SaveMyResultsModal;
