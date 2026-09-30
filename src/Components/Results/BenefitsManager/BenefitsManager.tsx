import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
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
import NewBenefitsModal from './NewBenefitsModal';
import { DEMO_UNLOCKED_BENEFITS, NewBenefit, UpkeepTask, buildUpkeepTasks, newBenefitAsProgram } from './demoData';
import './BenefitsManager.css';

const upkeepStorageKey = (uuid: string) => `benefits-manager-demo-upkeep-${uuid}`;

// Which upkeep tasks the presenter has marked done, per screen, so it survives a refresh.
function useCompletedUpkeep(uuid: string) {
  const [completed, setCompleted] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(upkeepStorageKey(uuid));
      return saved === null ? [] : (JSON.parse(saved) as number[]);
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(upkeepStorageKey(uuid), JSON.stringify(completed));
    } catch {
      // best-effort
    }
  }, [uuid, completed]);

  return [completed, setCompleted] as const;
}

const formatDollars = (amount: number) => '$' + Math.round(amount).toLocaleString('en-US');

const BenefitsManager = () => {
  const { programs, programCategories } = useResultsContext();
  const { uuid = '' } = useParams();
  const { formatDate } = useIntl();
  const backLink = useResultsLink('results/benefits');

  const taxCreditIds = useMemo(
    () =>
      new Set(
        programCategories
          .filter((category) => category.tax_category)
          .flatMap((category) => category.programs.map((program) => program.program_id)),
      ),
    [programCategories],
  );

  const { columns, moveProgram, columnOf, benefitsCode, restoreFromCode, resetDemo, allColumns } = useBenefitsBoard(
    programs,
    uuid,
    taxCreditIds,
  );
  const [completedUpkeep, setCompletedUpkeep] = useCompletedUpkeep(uuid);

  const [modalMode, setModalMode] = useState<'save' | 'restore' | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [highlightApplication, setHighlightApplication] = useState(false);
  const [newBenefitsFor, setNewBenefitsFor] = useState<Program | null>(null);
  const [upkeepDetail, setUpkeepDetail] = useState<UpkeepTask | null>(null);
  const [upkeepConfirm, setUpkeepConfirm] = useState<UpkeepTask | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  // Moving a card INTO Receiving shows the "you unlocked more benefits" modal. Dropping a
  // card back onto the column it is already in does not. Moving it OUT of Receiving
  // forgets its finished upkeep, so it comes back with a fresh task.
  const handleMoveProgram = useCallback(
    (programId: number, toColumn: ColumnId) => {
      const fromColumn = columnOf(programId);
      moveProgram(programId, toColumn);
      if (toColumn === 'receiving' && fromColumn !== 'receiving') {
        const program = programs.find((p) => p.program_id === programId);
        if (program) {
          setNewBenefitsFor(program);
        }
      } else if (fromColumn === 'receiving' && toColumn !== 'receiving') {
        setCompletedUpkeep((prev) => prev.filter((id) => id !== programId));
      }
    },
    [columnOf, moveProgram, programs, setCompletedUpkeep],
  );

  const handleSelectNewBenefit = useCallback((benefit: NewBenefit) => {
    setNewBenefitsFor(null);
    setSelectedProgram(newBenefitAsProgram(benefit));
  }, []);

  // Each total is the sum of the monthly figures printed on the cards in its columns, so
  // moving any card moves the numbers by exactly what that card says.
  //
  // Deliberately NOT the results header's calculateTotalValue. That applies category caps
  // (e.g. Denver Preschool, Universal Preschool and CCCAP share one per-child limit), so
  // moving one capped card often changed nothing — which on a board reads as broken. The
  // cost is that these totals can exceed the header's for households with capped programs.
  const totals = useMemo(() => {
    // A card with a value override shows text rather than a number, so it adds nothing.
    const cardMonthly = (p: Program) =>
      p.estimated_value_override.default_message !== '' ? 0 : Math.round(programValue(p) / 12);
    const sum = (progs: Program[]) => progs.reduce((total, p) => total + cardMonthly(p), 0);

    return {
      receivingMonthly: sum(columns.receiving),
      remainingMonthly: sum([...columns.eligible, ...columns.applied]),
    };
  }, [columns]);

  // Highest-value program still in Eligible, preferring anything that isn't a tax credit.
  const nextApplication = useMemo(() => {
    const candidates = columns.eligible.filter((p) => !taxCreditIds.has(p.program_id));
    const pool = candidates.length > 0 ? candidates : columns.eligible;
    if (pool.length === 0) return null;
    return pool.reduce((best, p) => (programValue(p) > programValue(best) ? p : best));
  }, [columns.eligible, taxCreditIds]);

  const upkeepTasks = useMemo(() => buildUpkeepTasks(columns.receiving), [columns.receiving]);
  const openUpkeepTasks = upkeepTasks.filter((task) => !completedUpkeep.includes(task.programId));
  const programById = useMemo(() => new Map(programs.map((p) => [p.program_id, p])), [programs]);

  const handleConfirmUpkeep = useCallback(
    (task: UpkeepTask, done: boolean) => {
      setUpkeepConfirm(null);
      if (done) {
        setCompletedUpkeep((prev) => [...prev, task.programId]);
      }
    },
    [setCompletedUpkeep],
  );

  const handleFindOutHowToApply = useCallback(() => {
    if (nextApplication) {
      setSelectedProgram(nextApplication);
      setHighlightApplication(true);
    }
  }, [nextApplication]);

  const handleCloseDetail = useCallback(() => {
    setSelectedProgram(null);
    setHighlightApplication(false);
  }, []);

  const handleResetDemo = useCallback(() => {
    resetDemo();
    setCompletedUpkeep([]);
  }, [resetDemo, setCompletedUpkeep]);

  // Auto-restore from a ?code= query param, e.g. a link a presenter prepared in advance.
  const initialCode = searchParams.get('code');
  useEffect(() => {
    if (initialCode) {
      restoreFromCode(initialCode);
      searchParams.delete('code');
      setSearchParams(searchParams, { replace: true });
    }
  }, [initialCode, restoreFromCode, searchParams, setSearchParams]);

  const dueLabel = (task: UpkeepTask) => formatDate(task.due, { month: 'long', day: 'numeric' });

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
          <button
            type="button"
            className="benefits-manager-action-btn benefits-manager-action-btn-secondary"
            onClick={() => setModalMode('restore')}
          >
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
          <span className="benefits-tracker-amount">{formatDollars(totals.receivingMonthly)}</span>
          <span className="benefits-tracker-period">
            <FormattedMessage id="benefitsManager.tracker.perMonth" defaultMessage="per month in benefits" />
          </span>
        </div>
        <div className="benefits-tracker-divider" />
        <div className="benefits-tracker-item benefits-tracker-remaining">
          <span className="benefits-tracker-label">
            <FormattedMessage id="benefitsManager.tracker.remaining" defaultMessage="You can still get" />
          </span>
          <span className="benefits-tracker-amount benefits-tracker-amount-remaining">
            {formatDollars(totals.remainingMonthly)}
          </span>
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
            <button type="button" className="next-application-card" onClick={() => setSelectedProgram(nextApplication)}>
              <span className="benefit-drag-card-name">
                <ResultsTranslate translation={nextApplication.name} />
              </span>
              <span className="benefit-drag-card-value">{formatDollars(programValue(nextApplication) / 12)}/mo</span>
            </button>
            <div className="next-application-info">
              <p className="next-application-savings">
                <FormattedMessage
                  id="benefitsManager.nextApplication.savings"
                  defaultMessage="{name} can save you {dollars} per month"
                  values={{
                    name: (
                      <strong>
                        <ResultsTranslate translation={nextApplication.name} />
                      </strong>
                    ),
                    dollars: <strong>{formatDollars(programValue(nextApplication) / 12)}</strong>,
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
        {openUpkeepTasks.length > 0 ? (
          <div className="upkeep-list">
            {openUpkeepTasks.map((task) => {
              const program = programById.get(task.programId);
              return (
                <div className="upkeep-content" key={task.programId}>
                  <button type="button" className="upkeep-card" onClick={() => setUpkeepDetail(task)}>
                    <span className="benefit-drag-card-name">
                      {program !== undefined && <ResultsTranslate translation={program.name} />}
                    </span>
                    <span className="upkeep-task-title">{task.title}</span>
                    <span className="benefit-drag-card-value">
                      Due {dueLabel(task)} · {task.cadence}
                    </span>
                  </button>
                  <button type="button" className="upkeep-resubmit-btn" onClick={() => setUpkeepConfirm(task)}>
                    <CheckCircleIcon fontSize="small" />
                    Mark as done
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="upkeep-empty">
            {upkeepTasks.length > 0
              ? "You're all caught up."
              : 'No upkeep yet. Tasks show up here when a benefit moves to Receiving.'}
          </p>
        )}
      </div>

      <BenefitsBoard
        columns={columns}
        moveProgram={handleMoveProgram}
        allColumns={allColumns}
        onSelectProgram={setSelectedProgram}
      />

      <div className="benefits-manager-demo-footer">
        <button type="button" className="benefits-manager-reset-btn" onClick={handleResetDemo}>
          Reset demo
        </button>
      </div>

      {selectedProgram !== null && (
        <BenefitDetailView
          program={selectedProgram}
          onClose={handleCloseDetail}
          highlightApplicationProcess={highlightApplication}
        />
      )}

      {newBenefitsFor !== null && (
        <NewBenefitsModal
          approvedProgram={newBenefitsFor}
          newBenefits={DEMO_UNLOCKED_BENEFITS}
          onSelectBenefit={handleSelectNewBenefit}
          onClose={() => setNewBenefitsFor(null)}
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

      {upkeepDetail !== null && (
        <div className="benefit-detail-overlay" onClick={() => setUpkeepDetail(null)}>
          <div className="benefit-detail-card upkeep-detail-card" onClick={(e) => e.stopPropagation()} role="dialog">
            <button
              type="button"
              className="benefit-detail-close"
              onClick={() => setUpkeepDetail(null)}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
            <div className="benefit-detail-header">
              <h2 className="benefit-detail-title">{upkeepDetail.title}</h2>
              {programById.get(upkeepDetail.programId) !== undefined && (
                <p className="upkeep-detail-program">
                  <ResultsTranslate translation={programById.get(upkeepDetail.programId)!.name} />
                </p>
              )}
            </div>
            <div className="benefit-detail-sections">
              <p className="upkeep-detail-due">
                Due {dueLabel(upkeepDetail)} · {upkeepDetail.cadence}
              </p>
              <p className="upkeep-detail-text">{upkeepDetail.detail}</p>
            </div>
            <div className="benefit-detail-footer">
              <button
                type="button"
                className="benefit-detail-apply-btn"
                onClick={() => {
                  setUpkeepConfirm(upkeepDetail);
                  setUpkeepDetail(null);
                }}
              >
                Mark as done
              </button>
            </div>
          </div>
        </div>
      )}

      {upkeepConfirm !== null && (
        <div className="benefit-detail-overlay" onClick={() => setUpkeepConfirm(null)}>
          <div className="benefit-detail-card upkeep-confirm-card" onClick={(e) => e.stopPropagation()} role="dialog">
            <div className="upkeep-confirm-body">
              <h2 className="upkeep-confirm-title">{upkeepConfirm.confirmQuestion}</h2>
              <div className="upkeep-confirm-actions">
                <button
                  type="button"
                  className="upkeep-confirm-btn upkeep-confirm-btn-yes"
                  onClick={() => handleConfirmUpkeep(upkeepConfirm, true)}
                >
                  <FormattedMessage id="benefitsManager.upkeep.yes" defaultMessage="Yes" />
                </button>
                <button
                  type="button"
                  className="upkeep-confirm-btn upkeep-confirm-btn-no"
                  onClick={() => handleConfirmUpkeep(upkeepConfirm, false)}
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
