import { useState } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { FormattedMessage, useIntl } from 'react-intl';
import ModalShell from '../shared/ModalShell';
import { useCopyFeedback } from '../shared/useCopyFeedback';

type BenefitsCodeModalProps = {
  mode: 'save' | 'restore';
  benefitsCode: string;
  onRestore: (code: string) => boolean;
  onClose: () => void;
};

const BenefitsCodeModal = ({ mode, benefitsCode, onRestore, onClose }: BenefitsCodeModalProps) => {
  const { formatMessage } = useIntl();
  const { copied, copyError, handleCopy } = useCopyFeedback();
  const [pasteValue, setPasteValue] = useState('');
  const [restoreError, setRestoreError] = useState(false);

  const handleRestore = () => {
    const trimmed = pasteValue.trim();
    if (trimmed === '') return;
    const success = onRestore(trimmed);
    if (success) {
      onClose();
    } else {
      setRestoreError(true);
    }
  };

  if (mode === 'save') {
    return (
      <ModalShell
        headerIcon={<SaveIcon />}
        title={<FormattedMessage id="benefitsManager.saveCode" defaultMessage="Save Benefits Code" />}
        subtitle={
          <FormattedMessage
            id="benefitsManager.saveCodeSubtitle"
            defaultMessage="Copy this code to save your progress. Paste it later to pick up where you left off."
          />
        }
        onClose={onClose}
      >
        <div className="benefits-code-modal-content">
          <div className="benefits-code-display">
            <code className="benefits-code-text">{benefitsCode}</code>
          </div>
          <button
            type="button"
            className="benefits-code-copy-btn"
            onClick={() => handleCopy(benefitsCode)}
          >
            {copied ? (
              <>
                <CheckIcon fontSize="small" />
                <FormattedMessage id="benefitsManager.copied" defaultMessage="Copied!" />
              </>
            ) : copyError ? (
              <>
                <ErrorOutlineIcon fontSize="small" />
                <FormattedMessage id="benefitsManager.copyFailed" defaultMessage="Copy failed" />
              </>
            ) : (
              <>
                <ContentCopyIcon fontSize="small" />
                <FormattedMessage id="benefitsManager.copyCode" defaultMessage="Copy Code" />
              </>
            )}
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      headerIcon={<RestoreIcon />}
      title={<FormattedMessage id="benefitsManager.restoreCode" defaultMessage="Restore from Code" />}
      subtitle={
        <FormattedMessage
          id="benefitsManager.restoreCodeSubtitle"
          defaultMessage="Paste the benefits code you saved earlier to restore your board."
        />
      }
      onClose={onClose}
    >
      <div className="benefits-code-modal-content">
        <input
          type="text"
          className={`benefits-code-input ${restoreError ? 'benefits-code-input-error' : ''}`}
          value={pasteValue}
          onChange={(e) => {
            setPasteValue(e.target.value);
            setRestoreError(false);
          }}
          placeholder={formatMessage({
            id: 'benefitsManager.pasteCode',
            defaultMessage: 'Paste your benefits code here',
          })}
        />
        {restoreError && (
          <div className="benefits-code-error-msg">
            <FormattedMessage
              id="benefitsManager.invalidCode"
              defaultMessage="Invalid benefits code. Please check and try again."
            />
          </div>
        )}
        <button
          type="button"
          className="benefits-code-restore-btn"
          onClick={handleRestore}
          disabled={pasteValue.trim() === ''}
        >
          <FormattedMessage id="benefitsManager.restoreButton" defaultMessage="Restore" />
        </button>
      </div>
    </ModalShell>
  );
};

export default BenefitsCodeModal;
