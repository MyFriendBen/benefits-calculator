import { ReactNode, AnchorHTMLAttributes } from 'react';
import dataLayerPush from '../../../Assets/analytics';

interface TrackedOutboundLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {
  href: string;
  action: string;
  label: string;
  category?: string;
  additionalData?: Record<string, any>;
  children: ReactNode;
  openInNewTab?: boolean;
}

export default function TrackedOutboundLink({
  href,
  action,
  label,
  category,
  additionalData = {},
  children,
  openInNewTab = true,
  className,
  ...anchorProps
}: TrackedOutboundLinkProps) {
  const handleClick = () => {
    dataLayerPush({
      event: 'outbound_click',
      action,
      label,
      url: href,
      category,
      ...additionalData,
    });
  };

  return (
    <a
      href={href}
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={className}
      {...anchorProps}
    >
      {children}
    </a>
  );
}
