import type { ReactNode } from 'react';

interface BenChatBubbleProps {
  children: ReactNode;
  variant?: 'ben' | 'user';
}

export default function BenChatBubble({ children, variant = 'ben' }: BenChatBubbleProps) {
  return (
    <div className={`ben-chat-bubble ben-chat-bubble--${variant}`}>
      {variant === 'ben' && <div className="ben-chat-avatar">B</div>}
      <div className="ben-chat-bubble__content">{children}</div>
    </div>
  );
}
