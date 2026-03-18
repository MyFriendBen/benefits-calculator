import { useState, useCallback, useEffect } from 'react';
import { IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { FormattedMessage } from 'react-intl';
import { useFeatureFlag } from '../../Config/configHook';
import PopupModal from './shared/PopupModal';
import './SharePopup.css';

const SHARE_URL = 'https://myfriendben.org';
const SHARE_SUBJECT = 'Check out MyFriendBen';
const SHARE_BODY =
  "I just found out about programs I may be eligible for through MyFriendBen — it's a free, confidential tool that helps you discover benefits you qualify for. Check it out!";

const COPY_FEEDBACK_MS = 2000;

function gmailUrl() {
  return `https://mail.google.com/mail/?view=cm&to=&su=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(`${SHARE_BODY}\n\n${SHARE_URL}`)}`;
}

function outlookUrl() {
  return `https://outlook.live.com/owa/?path=/mail/action/compose&subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(`${SHARE_BODY}\n\n${SHARE_URL}`)}`;
}

function yahooUrl() {
  return `https://compose.mail.yahoo.com/?to=&subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(`${SHARE_BODY}\n\n${SHARE_URL}`)}`;
}

function mailtoUrl() {
  return `mailto:?subject=${encodeURIComponent(SHARE_SUBJECT)}&body=${encodeURIComponent(`${SHARE_BODY}\n\n${SHARE_URL}`)}`;
}

const EMAIL_PROVIDERS = [
  {
    name: 'Gmail',
    url: gmailUrl,
    icon: <img src="https://www.google.com/favicon.ico" alt="" className="share-popup-provider-favicon" aria-hidden="true" width="28" height="28" />,
  },
  {
    name: 'Outlook',
    url: outlookUrl,
    icon: <img src="https://outlook.live.com/favicon.ico" alt="" className="share-popup-provider-favicon" aria-hidden="true" width="28" height="28" />,
  },
  {
    name: 'Yahoo Mail',
    url: yahooUrl,
    icon: <img src="https://www.yahoo.com/favicon.ico" alt="" className="share-popup-provider-favicon" aria-hidden="true" width="28" height="28" />,
  },
  {
    name: 'Apple Mail',
    url: () => mailtoUrl(),
    icon: null,
    isApple: true,
  },
  {
    name: 'Other',
    url: () => mailtoUrl(),
    icon: null,
    isOther: true,
  },
];

const SharePopup = () => {
  const isShareEnabled = useFeatureFlag('share_popup');

  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
    setEmailExpanded(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setEmailExpanded(false);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(SHARE_URL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, []);

  if (!isShareEnabled || !isVisible || isDismissed) return null;

  if (isMinimized) {
    return (
      <div
        className="share-popup-chip"
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
          className="share-popup-chip-close"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            setIsDismissed(true);
          }}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
        <span className="share-popup-chip-icon" aria-hidden="true">
          <IosShareIcon style={{ fontSize: '1rem' }} />
        </span>
        <span className="share-popup-chip-text">
          <span className="share-popup-chip-title">
            <FormattedMessage id="sharePopup.minimized" defaultMessage="Share MyFriendBen" />
          </span>
          <span className="share-popup-chip-subtitle">
            <FormattedMessage id="sharePopup.minimizedSubtitle" defaultMessage="Help a friend discover benefits" />
          </span>
        </span>
      </div>
    );
  }

  return (
    <PopupModal onClose={handleMinimize} ariaLabel="Share MyFriendBen" containerClassName="share-popup-modal">
      {/* Share icon header */}
      <div className="share-popup-header-icon" aria-hidden="true">
        <IosShareIcon className="share-popup-header-icon-svg" />
      </div>

      {emailExpanded ? (
        <>
          <IconButton
            aria-label="Back to share options"
            size="small"
            className="share-popup-back-btn"
            onClick={() => setEmailExpanded(false)}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>

          <Typography variant="h6" component="h2" className="share-popup-title">
            <FormattedMessage id="sharePopup.emailProviderTitle" defaultMessage="Choose email provider" />
          </Typography>
          <Typography className="share-popup-subtitle">
            <FormattedMessage id="sharePopup.emailProviderSubtitle" defaultMessage="Select your preferred email service" />
          </Typography>

          <div className="share-popup-options">
            {EMAIL_PROVIDERS.map((provider) => (
              <a
                key={provider.name}
                href={provider.url()}
                target="_blank"
                rel="noopener noreferrer"
                className="share-popup-option"
                onClick={handleMinimize}
              >
                <span className="share-popup-provider-icon" aria-hidden="true">
                  {provider.isApple ? (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                  ) : provider.isOther ? (
                    <MailOutlineIcon style={{ fontSize: '1.75rem' }} />
                  ) : provider.icon}
                </span>
                <span className="share-popup-option-label">{provider.name}</span>
              </a>
            ))}
          </div>
        </>
      ) : (
        <>
          <Typography variant="h6" component="h2" className="share-popup-title">
            <FormattedMessage id="sharePopup.title" defaultMessage="Share MyFriendBen" />
          </Typography>
          <Typography className="share-popup-subtitle">
            <FormattedMessage id="sharePopup.subtitle" defaultMessage="Help a friend discover benefits" />
          </Typography>

          <div className="share-popup-options">
            {/* Email row */}
            <button
              type="button"
              className="share-popup-option"
              onClick={() => setEmailExpanded(true)}
            >
              <span className="share-popup-icon-circle" aria-hidden="true">
                <EmailIcon style={{ fontSize: '1.25rem' }} />
              </span>
              <span className="share-popup-option-text">
                <span className="share-popup-option-label">
                  <FormattedMessage id="sharePopup.email" defaultMessage="Email" />
                </span>
                <span className="share-popup-option-sublabel">
                  <FormattedMessage id="sharePopup.emailSublabel" defaultMessage="Share via email" />
                </span>
              </span>
            </button>

            {/* Copy link row */}
            <button
              type="button"
              className="share-popup-option"
              onClick={handleCopyLink}
              aria-label={copied ? 'Link copied to clipboard' : 'Copy link to clipboard'}
            >
              <span className="share-popup-icon-circle" aria-hidden="true">
                {copied ? <CheckIcon style={{ fontSize: '1.25rem' }} /> : <LinkIcon style={{ fontSize: '1.25rem' }} />}
              </span>
              <span className="share-popup-option-text">
                <span className={copied ? 'share-popup-copied-label' : 'share-popup-option-label'}>
                  {copied ? (
                    <FormattedMessage id="sharePopup.copied" defaultMessage="Copied!" />
                  ) : (
                    <FormattedMessage id="sharePopup.copyLink" defaultMessage="Copy Link" />
                  )}
                </span>
                {!copied && (
                  <span className="share-popup-option-sublabel">
                    <FormattedMessage id="sharePopup.copyLinkSublabel" defaultMessage="Copy link to clipboard" />
                  </span>
                )}
              </span>
            </button>
          </div>
        </>
      )}
    </PopupModal>
  );
};

export default SharePopup;
