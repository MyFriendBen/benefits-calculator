interface BenQuickReplyProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export default function BenQuickReply({ label, onClick, variant = 'primary' }: BenQuickReplyProps) {
  return (
    <button className={`ben-quick-reply ben-quick-reply--${variant}`} onClick={onClick} type="button">
      {label}
    </button>
  );
}
