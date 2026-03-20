import { ReactNode } from 'react';
import './ModalShell.css';

type ModalOptionBaseProps = {
  icon: ReactNode;
  label: ReactNode;
  sublabel?: ReactNode;
};

type ModalOptionButtonProps = ModalOptionBaseProps & {
  onClick: () => void;
  href?: never;
};

type ModalOptionLinkProps = ModalOptionBaseProps & {
  href: string;
  onClick?: () => void;
};

type ModalOptionProps = ModalOptionButtonProps | ModalOptionLinkProps;

const ModalOption = ({ icon, label, sublabel, onClick, href }: ModalOptionProps & { href?: string }) => {
  const content = (
    <>
      <span className="modal-option-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="modal-option-text">
        <span className="modal-option-label">{label}</span>
        {sublabel && <span className="modal-option-sublabel">{sublabel}</span>}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="modal-option"
        onClick={onClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" className="modal-option" onClick={onClick}>
      {content}
    </button>
  );
};

export default ModalOption;
