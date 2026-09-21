import SaveIcon from '@mui/icons-material/SaveOutlined';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import LanguageSelect from '../../LanguageSelect/LanguageSelect';
import ModalShell from '../shared/ModalShell';
import ModalOption from '../shared/ModalOption';
import CopyLinkOption from '../shared/CopyLinkOption';
import SuccessView from '../shared/SuccessView';
import { useTrackEvent } from '../../../Assets/analytics';
import '../shared/ModalShell.css';
import SaveViaEmailForm from './SaveViaEmailForm';
import SaveViaSMSForm from './SaveViaSMSForm';

type SaveView = 'language' | 'options' | 'email' | 'sms' | 'success';

type SaveMyResultsModalProps = {
  onClose: () => void;
};

const subtitles: Record<SaveView, React.ReactNode> = {
  language: (
    <FormattedMessage id="saveMyResults.languageSubtitle" defaultMessage="What language should we send it in?" />
  ),
  options: <FormattedMessage id="saveMyResults.subtitle" defaultMessage="Choose how to save your results" />,
  email: <FormattedMessage id="saveMyResults.emailSubtitle" defaultMessage="Enter your email address" />,
  sms: <FormattedMessage id="saveMyResults.smsSubtitle" defaultMessage="Enter your phone number" />,
  success: <FormattedMessage id="saveMyResults.successSubtitle" defaultMessage="Your results are on their way!" />,
};

const SaveMyResultsModal = ({ onClose }: SaveMyResultsModalProps) => {
  const intl = useIntl();
  const [view, setView] = useState<SaveView>('language');
  // The language the API composes the message in. Defaults to the language the
  // user is reading, which is the common case, but they can send the results to
  // someone who reads another one.
  const [messageLanguage, setMessageLanguage] = useState(intl.locale);
  const track = useTrackEvent();

  const handleClose = () => {
    track('screener_results_save', { save_action: 'close' });
    onClose();
  };

  const handleBack = () => {
    track('screener_results_save', { save_action: 'back' });
    setView((current) => (current === 'options' ? 'language' : 'options'));
  };

  if (view === 'success') {
    return (
      <SuccessView
        title={<FormattedMessage id="saveMyResults.successTitle" defaultMessage="Results Sent" />}
        subtitle={subtitles.success}
        doneLabel={<FormattedMessage id="saveMyResults.successClose" defaultMessage="Done" />}
        onClose={handleClose}
      />
    );
  }

  return (
    <ModalShell
      headerIcon={<SaveIcon />}
      title={<FormattedMessage id="saveMyResults.title" defaultMessage="Save My Results" />}
      subtitle={subtitles[view]}
      onClose={handleClose}
      onBack={view !== 'language' ? handleBack : undefined}
    >
      {view === 'language' && (
        <div className="save-my-results-language-step">
          <LanguageSelect
            id="save-results-language-select"
            variant="outlined"
            value={messageLanguage}
            onChange={(languageCode) => setMessageLanguage(languageCode)}
            label={<FormattedMessage id="saveMyResults.languageLabel" defaultMessage="Language" />}
            formControlSx={{ width: '100%' }}
          />
          <div className="save-my-results-form-actions">
            <button
              type="button"
              className="modal-primary-btn"
              onClick={() => {
                track('screener_results_save', {
                  save_language: messageLanguage,
                  save_action: 'language_selected',
                });
                setView('options');
              }}
            >
              <FormattedMessage id="saveMyResults.languageContinue" defaultMessage="Continue" />
            </button>
          </div>
        </div>
      )}

      {view === 'options' && (
        <>
          <div className="modal-options-list">
            <ModalOption
              icon={<span className="modal-option-icon-circle"><EmailIcon /></span>}
              label={<FormattedMessage id="saveMyResults.email" defaultMessage="Email" />}
              sublabel={<FormattedMessage id="saveMyResults.emailSublabel" defaultMessage="Email a link to your results" />}
              onClick={() => {
                track('screener_results_save', { save_channel: 'email', save_action: 'open' });
                setView('email');
              }}
            />
            <ModalOption
              icon={<span className="modal-option-icon-circle"><SmsIcon /></span>}
              label={<FormattedMessage id="saveMyResults.sms" defaultMessage="SMS" />}
              sublabel={<FormattedMessage id="saveMyResults.smsSublabel" defaultMessage="Text a link to your results" />}
              onClick={() => {
                track('screener_results_save', { save_channel: 'sms', save_action: 'open' });
                setView('sms');
              }}
            />
            <CopyLinkOption
              url={window.location.href}
              label={<FormattedMessage id="saveMyResults.copyLink" defaultMessage="Copy to Clipboard" />}
              sublabel={<FormattedMessage id="saveMyResults.copyLinkSublabel" defaultMessage="Copy a link to your results" />}
              copiedLabel={<FormattedMessage id="saveMyResults.copied" defaultMessage="Copied!" />}
              errorLabel={<FormattedMessage id="saveMyResults.copyFailed" defaultMessage="Copy failed" />}
              errorSublabel={<FormattedMessage id="saveMyResults.copyFailedSublabel" defaultMessage="Could not access clipboard" />}
              onCopy={() => track('screener_results_save', { save_channel: 'copy_link', save_action: 'send' })}
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

      {view === 'email' && (
        <SaveViaEmailForm
          language={messageLanguage}
          onSuccess={() => {
            track('screener_results_save', {
              save_channel: 'email',
              save_language: messageLanguage,
              save_action: 'send',
            });
            setView('success');
          }}
        />
      )}
      {view === 'sms' && (
        <SaveViaSMSForm
          language={messageLanguage}
          onSuccess={() => {
            track('screener_results_save', {
              save_channel: 'sms',
              save_language: messageLanguage,
              save_action: 'send',
            });
            setView('success');
          }}
        />
      )}

      {(view === 'email' || view === 'sms') && (
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
