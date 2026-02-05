import { useContext } from 'react';
import { Context } from '../Wrapper/Wrapper';
import { MessageDescriptor, useIntl } from 'react-intl';
import { renderLogoSource } from '../Referrer/referrerDataInfo';
import { ReferrerData } from './referrerHook';

export const useLogo = (src: keyof ReferrerData, alt: keyof ReferrerData, className: string) => {
  const { getReferrer } = useContext(Context);
  const intl = useIntl();

  const logoSourceValue = getReferrer(src, '') as string;
  const logoAlt = getReferrer(alt, { id: '', defaultMessage: '' }) as MessageDescriptor;

  return renderLogoSource(logoSourceValue.trim(), intl.formatMessage(logoAlt), className);
};
