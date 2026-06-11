import LinkIcon from '@mui/icons-material/Link';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { ReactNode } from 'react';
import ModalOption from './ModalOption';
import { useCopyFeedback } from './useCopyFeedback';

type CopyLinkOptionProps = {
  url: string;
  /** Label shown in the default (not copied, no error) state */
  label: ReactNode;
  /** Sublabel shown in the default state */
  sublabel: ReactNode;
  /** Label shown after a successful copy */
  copiedLabel: ReactNode;
  /** Label shown when the clipboard write fails */
  errorLabel: ReactNode;
  /** Sublabel shown when the clipboard write fails */
  errorSublabel: ReactNode;
};

const CopyLinkOption = ({ url, label, sublabel, copiedLabel, errorLabel, errorSublabel }: CopyLinkOptionProps) => {
  const { copied, copyError, handleCopy } = useCopyFeedback();

  return (
    <ModalOption
      icon={
        <span className="modal-option-icon-circle">
          {copied ? <CheckIcon /> : copyError ? <ErrorOutlineIcon /> : <LinkIcon />}
        </span>
      }
      label={
        copied ? (
          <span className="modal-option-copied-label">{copiedLabel}</span>
        ) : copyError ? (
          <span className="modal-option-copy-error-label">{errorLabel}</span>
        ) : (
          label
        )
      }
      sublabel={copyError ? errorSublabel : copied ? undefined : sublabel}
      onClick={() => handleCopy(url)}
    />
  );
};

export default CopyLinkOption;
