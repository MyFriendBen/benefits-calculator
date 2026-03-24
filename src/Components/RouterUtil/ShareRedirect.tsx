import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
const SHARE_BASE = 'https://screener.myfriendben.org?referrer=friend&utm_source=friend&utm_campaign=screener_share';

const SHARE_URLS: Record<string, string> = {
  email: `${SHARE_BASE}&utm_medium=email`,
  sms: `${SHARE_BASE}&utm_medium=sms`,
  whatsapp: `${SHARE_BASE}&utm_medium=whatsapp`,
};

const ShareRedirect = () => {
  const { medium } = useParams<{ medium: string }>();
  const url =
    medium && Object.prototype.hasOwnProperty.call(SHARE_URLS, medium) ? SHARE_URLS[medium] : SHARE_BASE;

  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return null;
};

export default ShareRedirect;
