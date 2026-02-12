import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { MessageDescriptor, useIntl } from 'react-intl';
import { renderLogoSource } from '../Referrer/referrerDataInfo';
import { ReferrerData } from './referrerHook';

export const useLogo = (src: keyof ReferrerData, alt: keyof ReferrerData, className: string) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();

  // Empty string triggers fallback to MFBDEFAULT logo in renderLogoSource
  const logoSourceValue = getReferrer(src, '') as string;
  // Use meaningful default alt text for accessibility during loading
  const logoAlt = getReferrer(alt, { id: 'logo.alt.default', defaultMessage: 'Organization Logo' }) as MessageDescriptor;

  return renderLogoSource(logoSourceValue.trim(), intl.formatMessage(logoAlt), className);
};
