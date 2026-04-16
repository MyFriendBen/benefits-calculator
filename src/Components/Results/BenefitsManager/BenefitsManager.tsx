import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import { Program } from '../../../Types/Results';
import { programValue } from '../FormattedValue';
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
  const [showUpkeepDetail, setShowUpkeepDetail] = useState(false);
  const [showUpkeepConfirm, setShowUpkeepConfirm] = useState(false);
  const [upkeepCompleted, setUpkeepCompleted] = useState(false);
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

  // Upkeep: find SNAP in receiving column (match by external_name or name)
  const snapInReceiving = useMemo(() => {
    return columns.receiving.find((p) => {
      const ext = (p.external_name ?? '').toLowerCase();
      const nameMsg = (p.name?.default_message ?? '').toLowerCase();
      return ext.includes('snap') || nameMsg.includes('snap');
    }) ?? null;
  }, [columns.receiving]);

  // Reset upkeepCompleted if SNAP leaves receiving
  useEffect(() => {
    if (!snapInReceiving && upkeepCompleted) {
      setUpkeepCompleted(false);
    }
  }, [snapInReceiving, upkeepCompleted]);

  // Next month / current year label — e.g. "May, 2026"
  const nextMonthLabel = useMemo(() => {
    const now = new Date();
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const monthName = next.toLocaleString('default', { month: 'long' });
    return `${monthName}, ${now.getFullYear()}`;
  }, []);

  const handleConfirmResubmit = useCallback((confirmed: boolean) => {
    setShowUpkeepConfirm(false);
    if (confirmed) {
      setUpkeepCompleted(true);
    }
  }, []);

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

      {nextApplication && (
        <div className="next-application-bar">
          <h3 className="next-application-title">
            <FormattedMessage id="benefitsManager.nextApplication" defaultMessage="Your Next Application" />
          </h3>
          <div className="next-application-content">
            <button
              type="button"
              className="next-application-card"
              onClick={() => handleSelectProgram(nextApplication)}
            >
              <span className="benefit-drag-card-name">
                <ResultsTranslate translation={nextApplication.name} />
              </span>
              <span className="benefit-drag-card-value">
                {formatDollars(nextApplicationMonthly)}/mo
              </span>
            </button>
            <div className="next-application-info">
              <p className="next-application-savings">
                <FormattedMessage
                  id="benefitsManager.nextApplication.savings"
                  defaultMessage="{name} can save you {dollars} per month"
                  values={{
                    name: <strong><ResultsTranslate translation={nextApplication.name} /></strong>,
                    dollars: <strong>{formatDollars(nextApplicationMonthly)}</strong>,
                  }}
                />
              </p>
              <button type="button" className="next-application-apply-btn" onClick={handleFindOutHowToApply}>
                <FormattedMessage id="benefitsManager.nextApplication.findOut" defaultMessage="Find out how to apply" />
                <ArrowForwardIcon fontSize="small" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="upkeep-bar">
        <h3 className="upkeep-title">
          <FormattedMessage id="benefitsManager.upkeep" defaultMessage="Upkeep" />
        </h3>
        {snapInReceiving && !upkeepCompleted ? (
          <div className="upkeep-content">
            <button
              type="button"
              className="upkeep-card"
              onClick={() => setShowUpkeepDetail(true)}
            >
              <span className="benefit-drag-card-name">
                <ResultsTranslate translation={snapInReceiving.name} />
              </span>
              <span className="benefit-drag-card-value">
                <FormattedMessage id="benefitsManager.upkeep.monthlyLabel" defaultMessage="Monthly task" />
              </span>
            </button>
            <button
              type="button"
              className="upkeep-resubmit-btn"
              onClick={() => setShowUpkeepConfirm(true)}
            >
              <CheckCircleIcon fontSize="small" />
              <FormattedMessage
                id="benefitsManager.upkeep.resubmitted"
                defaultMessage="Resubmitted for {month}?"
                values={{ month: nextMonthLabel }}
              />
            </button>
          </div>
        ) : (
          <p className="upkeep-empty">
            <FormattedMessage
              id="benefitsManager.upkeep.empty"
              defaultMessage="You have no tasks on any benefits."
            />
          </p>
        )}
      </div>

      <BenefitsBoard columns={columns} moveProgram={handleMoveProgram} allColumns={allColumns} onSelectProgram={handleSelectProgram} />

      {selectedProgram !== null && (
        <BenefitDetailView
          program={selectedProgram}
          onClose={handleCloseDetailWithReset}
          highlightApplicationProcess={highlightApplication}
        />
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

      {showUpkeepDetail && snapInReceiving && (
        <div className="benefit-detail-overlay" onClick={() => setShowUpkeepDetail(false)}>
          <div
            className="benefit-detail-card upkeep-detail-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <button
              type="button"
              className="benefit-detail-close"
              onClick={() => setShowUpkeepDetail(false)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="benefit-detail-header">
              <h2 className="benefit-detail-title">
                <ResultsTranslate translation={snapInReceiving.name} />
              </h2>
            </div>
            <div className="benefit-detail-sections">
              <p className="upkeep-detail-text">
                <FormattedMessage
                  id="benefitsManager.upkeep.detailText"
                  defaultMessage="SNAP benefits require the resubmission of materials every month."
                />
              </p>
            </div>
            <div className="benefit-detail-footer">
              <button
                type="button"
                className="benefit-detail-apply-btn"
                onClick={() => {
                  /* demo only — no navigation */
                }}
              >
                <FormattedMessage id="benefitsManager.upkeep.moreInfo" defaultMessage="More Info" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpkeepConfirm && (
        <div className="benefit-detail-overlay" onClick={() => setShowUpkeepConfirm(false)}>
          <div
            className="benefit-detail-card upkeep-confirm-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            <div className="upkeep-confirm-body">
              <h2 className="upkeep-confirm-title">
                <FormattedMessage
                  id="benefitsManager.upkeep.confirmTitle"
                  defaultMessage="Have you resubmitted your materials?"
                />
              </h2>
              <div className="upkeep-confirm-actions">
                <button
                  type="button"
                  className="upkeep-confirm-btn upkeep-confirm-btn-yes"
                  onClick={() => handleConfirmResubmit(true)}
                >
                  <FormattedMessage id="benefitsManager.upkeep.yes" defaultMessage="Yes" />
                </button>
                <button
                  type="button"
                  className="upkeep-confirm-btn upkeep-confirm-btn-no"
                  onClick={() => handleConfirmResubmit(false)}
                >
                  <FormattedMessage id="benefitsManager.upkeep.no" defaultMessage="No" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default BenefitsManager;
