import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Program } from '../../../Types/Results';
import { programValue, useFormatDisplayValue } from '../FormattedValue';
import ResultsTranslate from '../Translate/Translate';
import { ColumnId } from './benefitsCodeUtils';
import { useResultsContext, useResultsLink } from '../Results';
import { useBenefitsBoard } from './useBenefitsBoard';
import BenefitsBoard from './BenefitsBoard';
import BenefitsCodeModal from './BenefitsCodeModal';
import BenefitDetailView from './BenefitDetailView';
import NewBenefitsModal, { NewBenefit, getUnlockedBenefits } from './NewBenefitsModal';
import './BenefitsManager.css';

const BenefitsManager = () => {
  const { programs } = useResultsContext();
  const { columns, moveProgram, benefitsCode, restoreFromCode, allColumns } = useBenefitsBoard(programs);
  const backLink = useResultsLink('results/benefits');

  const [modalMode, setModalMode] = useState<'save' | 'restore' | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [highlightApplication, setHighlightApplication] = useState(false);
  const [newBenefitsData, setNewBenefitsData] = useState<{ program: Program; benefits: NewBenefit[] } | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Intercept moveProgram: if moving to "receiving", show the congratulations modal
  const handleMoveProgram = useCallback(
    (programId: number, toColumn: ColumnId) => {
      moveProgram(programId, toColumn);
      if (toColumn === 'receiving') {
        const program = programs.find((p) => p.program_id === programId);
        if (program) {
          const unlocked = getUnlockedBenefits(program);
          setNewBenefitsData({ program, benefits: unlocked });
        }
      }
    },
    [moveProgram, programs],
  );

  const handleSelectProgram = useCallback((program: Program) => {
    setSelectedProgram(program);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedProgram(null);
  }, []);

  const handleCloseNewBenefits = useCallback(() => {
    setNewBenefitsData(null);
  }, []);

  const handleSelectNewBenefit = useCallback((benefit: NewBenefit) => {
    // Close the new-benefits modal and show the detail as a simple alert for now,
    // since NewBenefit isn't a full Program object. We create a minimal detail view.
    setNewBenefitsData(null);
    // Build a minimal Program-like object for the detail view
    const pseudoProgram: Program = {
      program_id: benefit.id,
      name: { label: `newBenefit.${benefit.id}`, default_message: benefit.name },
      name_abbreviated: benefit.name,
      external_name: `new_benefit_${benefit.id}`,
      estimated_value: 0,
      household_value: 0,
      estimated_delivery_time: { label: '', default_message: '2-4 weeks' },
      estimated_application_time: { label: '', default_message: 'Auto-enrolled' },
      description_short: { label: '', default_message: benefit.description },
      description: { label: '', default_message: benefit.description },
      value_type: { label: '', default_message: benefit.value },
      learn_more_link: { label: '', default_message: '' },
      apply_button_link: { label: '', default_message: '' },
      apply_button_description: { label: '', default_message: '' },
      legal_status_required: [],
      estimated_value_override: { label: '', default_message: '' },
      eligible: true,
      members: [],
      failed_tests: [],
      passed_tests: [],
      already_has: false,
      new: true,
      low_confidence: false,
      navigators: [],
      documents: [],
      warning_messages: [],
      required_programs: [],
      value_format: null,
    };
    setSelectedProgram(pseudoProgram);
  }, []);

  // Compute monthly totals for the tracker
  const { receivingMonthly, remainingMonthly } = useMemo(() => {
    const sumMonthly = (progs: Program[]) =>
      progs.reduce((sum, p) => sum + programValue(p), 0) / 12;
    const receiving = Math.round(sumMonthly(columns.receiving));
    const notReceiving = Math.round(
      sumMonthly(columns.eligible) + sumMonthly(columns.applied),
    );
    return { receivingMonthly: receiving, remainingMonthly: notReceiving };
  }, [columns]);

  // Find highest-value eligible program for "Your next application"
  const nextApplication = useMemo(() => {
    if (columns.eligible.length === 0) return null;
    return columns.eligible.reduce((best, p) =>
      programValue(p) > programValue(best) ? p : best,
    );
  }, [columns.eligible]);

  const nextApplicationMonthly = nextApplication ? Math.round(programValue(nextApplication) / 12) : 0;

  const handleFindOutHowToApply = useCallback(() => {
    if (nextApplication) {
      setSelectedProgram(nextApplication);
      setHighlightApplication(true);
    }
  }, [nextApplication]);

  const handleCloseDetailWithReset = useCallback(() => {
    setSelectedProgram(null);
    setHighlightApplication(false);
  }, []);

  const formatDollars = (amount: number) =>
    '$' + amount.toLocaleString('en-US');

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

      <div className="benefits-tracker">
        <div className="benefits-tracker-item benefits-tracker-receiving">
          <span className="benefits-tracker-label">
            <FormattedMessage id="benefitsManager.tracker.receiving" defaultMessage="You are getting" />
          </span>
          <span className="benefits-tracker-amount">{formatDollars(receivingMonthly)}</span>
          <span className="benefits-tracker-period">
            <FormattedMessage id="benefitsManager.tracker.perMonth" defaultMessage="per month in benefits" />
          </span>
        </div>
        <div className="benefits-tracker-divider" />
        <div className="benefits-tracker-item benefits-tracker-remaining">
          <span className="benefits-tracker-label">
            <FormattedMessage id="benefitsManager.tracker.remaining" defaultMessage="You can still get" />
          </span>
          <span className="benefits-tracker-amount benefits-tracker-amount-remaining">{formatDollars(remainingMonthly)}</span>
          <span className="benefits-tracker-period">
            <FormattedMessage id="benefitsManager.tracker.more" defaultMessage="more per month" />
          </span>
        </div>
      </div>

      <BenefitsBoard columns={columns} moveProgram={handleMoveProgram} allColumns={allColumns} onSelectProgram={handleSelectProgram} />

      {selectedProgram !== null && (
        <BenefitDetailView program={selectedProgram} onClose={handleCloseDetail} />
      )}

      {newBenefitsData !== null && (
        <NewBenefitsModal
          approvedProgram={newBenefitsData.program}
          newBenefits={newBenefitsData.benefits}
          onSelectBenefit={handleSelectNewBenefit}
          onClose={handleCloseNewBenefits}
        />
      )}

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
