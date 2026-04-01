import { useState, useContext } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  EmailShareButton,
  FacebookShareButton,
  FacebookMessengerShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookMessengerIcon,
} from 'react-share';
import EmailIcon from '@mui/icons-material/Email';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import { Context } from '../../Wrapper/Wrapper';
import dataLayerPush from '../../../Assets/analytics';
import { Stack } from '@mui/material';
import './TwoOneOneShareIL.css';

type TwoOneOneShareProps = {
  close: () => void;
};

const TwoOneOneShareIL = ({ close }: TwoOneOneShareProps) => {
  const [copied, setCopied] = useState(false);
  const { getReferrer } = useContext(Context);
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

  const shareUrl = getReferrer('shareLink');

  const appId = '1268913277361574';

  const iconSize = { fontSize: '1.3rem' };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 5000);
    } catch {
      setCopied(false);
    }
  };

  const Icon = ({ name, children, color }: { name: string; children: React.ReactNode; color: string }) => {
    return (
      <span className={`${color} icon`}>
        {children}
        <span className="twoOneOneIL-icon-name">{name}</span>
      </span>
    );
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

  const closeALProps = {
    id: 'share.closeAL',
    defaultMsg: 'close',
  };

  return (
    <Stack className="twoOneOneIL-share-container">
      <IconButton aria-label={intl.formatMessage(closeALProps)} onClick={close} className="twoOneOneIL-share-close">
        <CloseIcon />
      </IconButton>
      <h2 className="twoOneOneIL-share-header">
        <FormattedMessage id="results.twoOneOne-share-header" defaultMessage="Share MyFriendBen with a friend:" />
      </h2>
      <div className="twoOneOneIL-share-icons">
        <div className="twoOneOneIL-row-group">
          <FacebookShareButton url={shareUrl} onClick={trackOutboundLinks('Share to Facebook')}>
            <Icon name="Facebook" color="twoOneOneIL-fb">
              <FacebookIcon sx={iconSize} />
            </Icon>
          </FacebookShareButton>
          <TwitterShareButton url={shareUrl} onClick={trackOutboundLinks('Share to Twitter')}>
            <Icon name="Twitter" color="twoOneOneIL-twitter">
              <TwitterIcon sx={iconSize} />
            </Icon>
          </TwitterShareButton>
          <EmailShareButton url={shareUrl} onClick={trackOutboundLinks('Share With Email')}>
            <Icon name={labels.email} color="twoOneOneIL-gray">
              <EmailIcon sx={iconSize} />
            </Icon>
          </EmailShareButton>
        </div>
        <div className="twoOneOneIL-row-group">
          <WhatsappShareButton url={shareUrl} onClick={trackOutboundLinks('Share With WhatsApp')}>
            <Icon name="WhatsApp" color="twoOneOneIL-whatsApp">
              <WhatsAppIcon sx={iconSize} />
            </Icon>
          </WhatsappShareButton>
          <FacebookMessengerShareButton
            url={shareUrl}
            appId={appId}
            onClick={trackOutboundLinks('Share With Facebook Messanger')}
          >
            <Icon name="Messenger" color="twoOneOneIL-messenger">
              <FacebookMessengerIcon size={20.5} />
            </Icon>
          </FacebookMessengerShareButton>
          <button type="button" onClick={copyLink} className="copy-link-btn-il">
            <Icon name={copied ? labels.copied : labels.copyLink} color="twoOneOneIL-gray">
              {copied ? <CheckIcon sx={iconSize} /> : <LinkIcon sx={iconSize} />}
            </Icon>
          </button>
        </div>
      </div>
    </Stack>
  );
};

export default TwoOneOneShareIL;
