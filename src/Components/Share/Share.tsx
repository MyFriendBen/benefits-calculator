import { forwardRef, useState, useContext, ReactElement } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  EmailShareButton,
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  LinkedinShareButton,
} from 'react-share';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import XIcon from '@mui/icons-material/X';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import { Context } from '../Wrapper/Wrapper';
import dataLayerPush from '../../Assets/analytics';
import './Share.css';
import { useConfig } from '../Config/configHook';

const Share = forwardRef(function Share() {
  const [copied, setCopied] = useState(false);
  const { getReferrer } = useContext(Context);
  const { email, survey } = useConfig<{ email: string; survey: string }>('feedback_links');
  const surveyLink = survey;
  const intl = useIntl();

  const labels = {
    email: intl.formatMessage({
      id: 'results.share-emailAL',
      defaultMessage: 'Email',
    }),
    copyLink: intl.formatMessage({
      id: 'results.share-copyLinkAL',
      defaultMessage: 'Copy Link',
    }),
    copied: intl.formatMessage({
      id: 'results.share-copiedAL',
      defaultMessage: 'Copied',
    }),
  };

  const shareUrl = getReferrer('shareLink') || 'default';
  const isMobile = window.innerWidth <= 700;
  const iconSize = { color: '#fff', fontSize: isMobile ? '1.5rem' : '2rem' };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 5000);
  };

  const Icon = ({ name, children }: { name: string; children: ReactElement }) => {
    return <span className={`${name} icon`}>{children}</span>;
  };

  const trackOutboundLinks = (label: string) => {
    return () => {
      dataLayerPush({
        event: 'media_share',
        action: 'share link click',
        label: label,
      });
    };
  };

  return (
    <div>
      <div className="feedback-buttons-container">
        <a className="feedback-button-and-text" href={`mailto:${email}`}>
          <FormattedMessage id="contactUsButton" defaultMessage="CONTACT US" />
        </a>
        <a className="feedback-button-and-text" href={surveyLink} target="_blank">
          <FormattedMessage id="reportABugButton" defaultMessage="REPORT AN ISSUE" />
        </a>
      </div>
      <div className="share-text-container">
        <p className="white-font">
          <FormattedMessage id="results.share-header" defaultMessage="Share MyFriendBen Via:" />
        </p>
      </div>
      <div className="row-group">
        <FacebookShareButton url={shareUrl} onClick={trackOutboundLinks('Share to Facebook')}>
          <Icon name="facebook">
            <FacebookIcon sx={iconSize} />
          </Icon>
        </FacebookShareButton>
        <TwitterShareButton url={shareUrl} onClick={trackOutboundLinks('Share to Twitter')}>
          <Icon name="twitter">
            <XIcon sx={iconSize} />
          </Icon>
        </TwitterShareButton>
        <WhatsappShareButton url={shareUrl} onClick={trackOutboundLinks('Share With WhatsApp')}>
          <Icon name="whatsApp">
            <WhatsAppIcon sx={iconSize} />
          </Icon>
        </WhatsappShareButton>
        <LinkedinShareButton url={shareUrl} onClick={trackOutboundLinks('Share With LinkedIn')}>
          <Icon name="linkedIn">
            <LinkedInIcon sx={iconSize} />
          </Icon>
        </LinkedinShareButton>
        <button onClick={copyLink} className="button-no-format" aria-label={copied ? labels.copied : labels.copyLink}>
          <Icon name={copied ? labels.copied : labels.copyLink}>
            {copied ? <CheckIcon sx={iconSize} /> : <LinkIcon sx={iconSize} />}
          </Icon>
        </button>
      </div>
    </div>
  );
});

export default Share;
