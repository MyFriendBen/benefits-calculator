import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useResultsContext, useResultsLink } from '../Results';
import { useBenefitsBoard } from './useBenefitsBoard';
import BenefitsBoard from './BenefitsBoard';
import BenefitsCodeModal from './BenefitsCodeModal';
import './BenefitsManager.css';

const BenefitsManager = () => {
  const { programs } = useResultsContext();
  const { columns, moveProgram, benefitsCode, restoreFromCode, allColumns } = useBenefitsBoard(programs);
  const backLink = useResultsLink('results/benefits');

  const [modalMode, setModalMode] = useState<'save' | 'restore' | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Auto-restore from URL query param on mount
  const initialCode = searchParams.get('code');
  useEffect(() => {
    if (initialCode) {
      restoreFromCode(initialCode);
      searchParams.delete('code');
      setSearchParams(searchParams, { replace: true });
    }
  }, [initialCode, restoreFromCode, searchParams, setSearchParams]);

  return (
    <main className="benefits-form benefits-manager-page">
      <div className="benefits-manager-header">
        <Link to={backLink} className="benefits-manager-back">
          <ArrowBackIcon fontSize="small" />
          <FormattedMessage id="benefitsManager.backToResults" defaultMessage="Back to Results" />
        </Link>
        <h1 className="benefits-manager-title">
          <FormattedMessage id="benefitsManager.title" defaultMessage="Benefits Manager" />
        </h1>
        <p className="benefits-manager-subtitle">
          <FormattedMessage
            id="benefitsManager.subtitle"
            defaultMessage="Drag and drop your benefits to track your progress."
          />
        </p>
        <div className="benefits-manager-actions">
          <button type="button" className="benefits-manager-action-btn" onClick={() => setModalMode('save')}>
            <SaveIcon fontSize="small" />
            <FormattedMessage id="benefitsManager.saveCode" defaultMessage="Save Benefits Code" />
          </button>
          <button type="button" className="benefits-manager-action-btn benefits-manager-action-btn-secondary" onClick={() => setModalMode('restore')}>
            <RestoreIcon fontSize="small" />
            <FormattedMessage id="benefitsManager.restoreCode" defaultMessage="Restore from Code" />
          </button>
        </div>
      </div>

      <BenefitsBoard columns={columns} moveProgram={moveProgram} allColumns={allColumns} />

      {modalMode !== null && (
        <BenefitsCodeModal
          mode={modalMode}
          benefitsCode={benefitsCode}
          onRestore={restoreFromCode}
          onClose={() => setModalMode(null)}
        />
      )}
    </main>
  );
};

export default BenefitsManager;
