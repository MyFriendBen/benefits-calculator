import { useState, useCallback, useEffect } from 'react';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SmsIcon from '@mui/icons-material/Sms';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { FormattedMessage, useIntl } from 'react-intl';
import { useFeatureFlag } from '../../Config/configHook';
import ModalShell from '../shared/ModalShell';
import ModalOption from '../shared/ModalOption';
import { useCopyFeedback } from '../shared/useCopyFeedback';
import '../shared/ModalShell.css';
import './ShareModal.css';

const SHARE_BASE = 'https://screener.myfriendben.org?referrer=friend&utm_source=friend&utm_campaign=screener_share';
const SHARE_URL_EMAIL = `${SHARE_BASE}&utm_medium=email`;
const SHARE_URL_SMS = `${SHARE_BASE}&utm_medium=sms`;
const SHARE_URL_WHATSAPP = `${SHARE_BASE}&utm_medium=whatsapp`;
const SHARE_URL_COPY = 'https://screener.myfriendben.org';

// Evaluated once at module load — user agent doesn't change during a session
const IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

function buildGmailUrl(subject: string, body: string) {
  return `https://mail.google.com/mail/?view=cm&to=&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildOutlookUrl(subject: string, body: string) {
  return `https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildYahooUrl(subject: string, body: string) {
  return `https://compose.mail.yahoo.com/?to=&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildMailtoUrl(subject: string, body: string) {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type ShareView = 'options' | 'email' | 'success';

const ShareModal = () => {
  const isShareEnabled = useFeatureFlag('share_popup');
  const { formatMessage } = useIntl();

  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [view, setView] = useState<ShareView>('options');
  const { copied, copyError, handleCopy } = useCopyFeedback();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
    setView('options');
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setView('options');
  }, []);

  if (!isShareEnabled || !isVisible || isDismissed) return null;

  // Translated share text — computed here so they update if locale changes
  const shareSubject = formatMessage({
    id: 'sharePopup.emailSubject',
    defaultMessage: 'Check out MyFriendBen',
  });
  const shareBody = formatMessage({
    id: 'sharePopup.shareBody',
    defaultMessage:
      "I just found out about programs I may be eligible for through MyFriendBen — it's a free, confidential screener that helps you discover benefits you qualify for. Check it out!",
  });

  const emailBody = `${shareBody}\n\n${SHARE_URL_EMAIL}`;
  const smsBody = `${shareBody} ${SHARE_URL_SMS}`;
  const whatsappBody = `${shareBody} ${SHARE_URL_WHATSAPP}`;

  const emailProviders = [
    {
      name: 'Gmail',
      url: buildGmailUrl(shareSubject, emailBody),
      icon: (
        <span className="modal-option-provider-icon" aria-hidden="true">
          <img src="https://www.google.com/favicon.ico" alt="" className="modal-option-provider-favicon" width="28" height="28" />
        </span>
      ),
    },
    {
      name: 'Outlook',
      url: buildOutlookUrl(shareSubject, emailBody),
      icon: (
        <span className="modal-option-provider-icon" aria-hidden="true">
          <img src="https://outlook.live.com/favicon.ico" alt="" className="modal-option-provider-favicon" width="28" height="28" />
        </span>
      ),
    },
    {
      name: 'Yahoo Mail',
      url: buildYahooUrl(shareSubject, emailBody),
      icon: (
        <span className="modal-option-provider-icon" aria-hidden="true">
          <img src="https://www.yahoo.com/favicon.ico" alt="" className="modal-option-provider-favicon" width="28" height="28" />
        </span>
      ),
    },
    {
      name: formatMessage({ id: 'sharePopup.appleMail', defaultMessage: 'Apple Mail' }),
      url: buildMailtoUrl(shareSubject, emailBody),
      icon: (
        <span className="modal-option-provider-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
        </span>
      ),
    },
    {
      name: formatMessage({ id: 'sharePopup.otherEmail', defaultMessage: 'Other' }),
      url: buildMailtoUrl(shareSubject, emailBody),
      icon: (
        <span className="modal-option-provider-icon" aria-hidden="true">
          <MailOutlineIcon style={{ fontSize: '1.75rem' }} />
        </span>
      ),
    },
  ];

  if (isMinimized) {
    return (
      <div
        className="share-modal-chip"
        onClick={handleRestore}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleRestore();
          }
        }}
        aria-label="Open share options"
      >
        <IconButton
          aria-label="Close share popup"
          size="small"
          className="share-modal-chip-close"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
        <span className="share-modal-chip-icon" aria-hidden="true">
          <IosShareIcon style={{ fontSize: '1rem' }} />
        </span>
        <span className="share-modal-chip-text">
          <span className="share-modal-chip-title">
            <FormattedMessage id="sharePopup.minimized" defaultMessage="Share MyFriendBen" />
          </span>
          <span className="share-modal-chip-subtitle">
            <FormattedMessage id="sharePopup.minimizedSubtitle" defaultMessage="Help a friend discover benefits" />
          </span>
        </span>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <ModalShell
        headerIcon={<CheckCircleOutlineIcon />}
        title={<FormattedMessage id="sharePopup.successTitle" defaultMessage="Link Shared!" />}
        subtitle={<FormattedMessage id="sharePopup.successSubtitle" defaultMessage="Thanks for spreading the word" />}
        onClose={handleMinimize}
      >
        <div className="share-modal-success-actions">
          <button type="button" className="modal-primary-btn" onClick={handleMinimize}>
            <FormattedMessage id="sharePopup.successDone" defaultMessage="Done" />
          </button>
        </div>
      </ModalShell>
    );
  }

  if (view === 'email') {
    return (
      <ModalShell
        headerIcon={<IosShareIcon />}
        title={<FormattedMessage id="sharePopup.emailProviderTitle" defaultMessage="Choose email provider" />}
        subtitle={<FormattedMessage id="sharePopup.emailProviderSubtitle" defaultMessage="Select your preferred email service" />}
        onClose={handleMinimize}
        onBack={() => setView('options')}
      >
        <div className="modal-options-list">
          {emailProviders.map((provider) => (
            <ModalOption
              key={provider.name}
              icon={provider.icon}
              label={provider.name}
              href={provider.url}
              onClick={() => setView('success')}
            />
          ))}
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      headerIcon={<IosShareIcon />}
      title={<FormattedMessage id="sharePopup.title" defaultMessage="Share MyFriendBen" />}
      subtitle={<FormattedMessage id="sharePopup.subtitle" defaultMessage="Help a friend discover benefits" />}
      onClose={handleMinimize}
    >
      <div className="modal-options-list">
        {IS_MOBILE && (
          <>
            <ModalOption
              icon={<span className="modal-option-icon-circle"><SmsIcon /></span>}
              label={<FormattedMessage id="sharePopup.sms" defaultMessage="SMS" />}
              sublabel={<FormattedMessage id="sharePopup.smsSublabel" defaultMessage="Share via text message" />}
              href={`sms:?body=${encodeURIComponent(smsBody)}`}
              onClick={() => setView('success')}
            />

            <ModalOption
              icon={<span className="modal-option-icon-circle"><WhatsAppIcon /></span>}
              label={<FormattedMessage id="sharePopup.whatsapp" defaultMessage="WhatsApp" />}
              sublabel={<FormattedMessage id="sharePopup.whatsappSublabel" defaultMessage="Share via WhatsApp" />}
              href={`https://wa.me/?text=${encodeURIComponent(whatsappBody)}`}
              onClick={() => setView('success')}
            />
          </>
        )}

        <ModalOption
          icon={<span className="modal-option-icon-circle"><EmailIcon /></span>}
          label={<FormattedMessage id="sharePopup.email" defaultMessage="Email" />}
          sublabel={<FormattedMessage id="sharePopup.emailSublabel" defaultMessage="Share via email" />}
          onClick={() => setView('email')}
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
                <FormattedMessage id="sharePopup.copied" defaultMessage="Copied!" />
              </span>
            ) : copyError ? (
              <span className="modal-option-copy-error-label">
                <FormattedMessage id="sharePopup.copyFailed" defaultMessage="Copy failed" />
              </span>
            ) : (
              <FormattedMessage id="sharePopup.copyLink" defaultMessage="Copy Link" />
            )
          }
          sublabel={
            copyError ? (
              <FormattedMessage id="sharePopup.copyFailedSublabel" defaultMessage="Could not access clipboard" />
            ) : copied ? undefined : (
              <FormattedMessage id="sharePopup.copyLinkSublabel" defaultMessage="Copy link to clipboard" />
            )
          }
          onClick={() => handleCopy(SHARE_URL_COPY)}
        />
      </div>
    </ModalShell>
  );
};

export default ShareModal;
