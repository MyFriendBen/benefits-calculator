import { useState, useCallback, useEffect } from 'react';
import { IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IosShareIcon from '@mui/icons-material/IosShare';
import EmailIcon from '@mui/icons-material/Email';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SmsIcon from '@mui/icons-material/Sms';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import { FormattedMessage } from 'react-intl';
import { useFeatureFlag } from '../../Config/configHook';
import PopupModal from './shared/PopupModal';
import './SharePopup.css';

const SHARE_URL = 'https://myfriendben.org';
const SHARE_SUBJECT = 'Check out MyFriendBen';
const SHARE_BODY =
  "I just found out about programs I may be eligible for through MyFriendBen — it's a free, confidential tool that helps you discover benefits you qualify for. Check it out!";

const COPY_FEEDBACK_MS = 2000;

function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

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

function smsUrl() {
  return `sms:?body=${encodeURIComponent(`${SHARE_BODY} ${SHARE_URL}`)}`;
}

const SharePopup = () => {
  const isShareEnabled = useFeatureFlag('share_popup');

  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 5000);
    return () => clearTimeout(timer);
  }, []);
  const [emailExpanded, setEmailExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRestore = useCallback(() => {
    setIsMinimized(false);
    setEmailExpanded(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setIsMinimized(true);
    setEmailExpanded(false);
  }, []);

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(SHARE_URL).catch(() => {
      // Clipboard not available (non-HTTPS or blocked)
    });
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
  }, []);

  const handleEmailClick = useCallback(() => {
    setEmailExpanded((prev) => !prev);
  }, []);

  if (!isShareEnabled || !isVisible || isDismissed) return null;

  if (isMinimized) {
    return (
      <div
        className="share-popup-chip"
        onClick={handleRestore}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRestore(); } }}
        aria-label="Open share options"
      >
        <IconButton
          aria-label="Close share popup"
          size="small"
          className="share-popup-chip-close"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); setIsDismissed(true); }}
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

  const mobile = isMobile();

  return (
    <PopupModal onClose={handleMinimize} ariaLabel="Share MyFriendBen" containerClassName="share-popup-modal">
      <Typography variant="h6" component="h2" className="share-popup-title">
        <FormattedMessage id="sharePopup.title" defaultMessage="How would you like to share?" />
      </Typography>

      <div className="share-popup-options">
        {/* Email row */}
        <button
          type="button"
          className="share-popup-option"
          onClick={handleEmailClick}
          aria-expanded={emailExpanded}
        >
          <span className="share-popup-icon-circle share-popup-icon-circle--email" aria-hidden="true">
            <EmailIcon fontSize="small" />
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

        {emailExpanded && (
          <div className="share-popup-email-providers" role="group" aria-label="Email providers">
            <a href={gmailUrl()} target="_blank" rel="noopener noreferrer" className="share-popup-email-provider-btn" onClick={handleMinimize}>
              <img src="https://www.google.com/favicon.ico" alt="" className="share-popup-provider-logo" aria-hidden="true" />
              Gmail
            </a>
            <a href={outlookUrl()} target="_blank" rel="noopener noreferrer" className="share-popup-email-provider-btn" onClick={handleMinimize}>
              <img src="https://outlook.live.com/favicon.ico" alt="" className="share-popup-provider-logo" aria-hidden="true" />
              Outlook
            </a>
            <a href={yahooUrl()} target="_blank" rel="noopener noreferrer" className="share-popup-email-provider-btn" onClick={handleMinimize}>
              <img src="https://www.yahoo.com/favicon.ico" alt="" className="share-popup-provider-logo" aria-hidden="true" />
              Yahoo Mail
            </a>
            <a href={mailtoUrl()} target="_blank" rel="noopener noreferrer" className="share-popup-email-provider-btn" onClick={handleMinimize}>
              <MailOutlineIcon fontSize="small" className="share-popup-provider-logo" />
              <FormattedMessage id="sharePopup.otherEmail" defaultMessage="Other email" />
            </a>
          </div>
        )}

        {/* SMS row — CSS hides on desktop as a safety net, JS skips render on non-mobile */}
        <a
          href={smsUrl()}
          className={`share-popup-option${!mobile ? ' share-popup-option--sms-desktop-hidden' : ''}`}
          onClick={handleMinimize}
          aria-label="Share via text message"
        >
          <span className="share-popup-icon-circle share-popup-icon-circle--sms" aria-hidden="true">
            <SmsIcon fontSize="small" />
          </span>
          <span className="share-popup-option-text">
            <span className="share-popup-option-label">
              <FormattedMessage id="sharePopup.sms" defaultMessage="SMS" />
            </span>
            <span className="share-popup-option-sublabel">
              <FormattedMessage id="sharePopup.smsSublabel" defaultMessage="Share via text message" />
            </span>
          </span>
        </a>

        {/* Copy link row */}
        <button
          type="button"
          className="share-popup-option"
          onClick={handleCopyLink}
          aria-label={copied ? 'Link copied to clipboard' : 'Copy link to clipboard'}
        >
          <span className="share-popup-icon-circle share-popup-icon-circle--link" aria-hidden="true">
            {copied ? <CheckIcon fontSize="small" /> : <LinkIcon fontSize="small" />}
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
    </PopupModal>
  );
};

export default SharePopup;
