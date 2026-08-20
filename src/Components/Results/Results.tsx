import { ComponentType, createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import ResultsError from './ResultsError/ResultsError';
import Loading from './Loading/Loading';
import {
  EligibilityResults,
  MemberEligibility,
  PolicyEngineData,
  Program,
  ProgramCategory,
  UrgentNeed,
  Validation,
} from '../../Types/Results';
import { getEligibility } from '../../apiCalls';
import { Context } from '../Wrapper/Wrapper';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { Grid } from '@mui/material';
import ResultsHeader, { ResultsSummary } from './ResultsHeader/ResultsHeader';
import Needs from './Needs/Needs';
import Programs from './Programs/Programs';
import ProgramPage from './ProgramPage/ProgramPage';
import ResultsTabs from './Tabs/Tabs';
import { ResultsTabId } from './Tabs/buildTabs';
import BackAndSaveButtons from './BackAndSaveButtons/BackAndSaveButtons';
import { FormattedMessage } from 'react-intl';
import { FilterState, createInitialFilterState } from './Filter/citizenshipFilterConfig';
import dataLayerPush from '../../Assets/analytics';
import MoreHelpButton from './211Button/211Button';
import MoreHelp from '../MoreHelp/MoreHelp';
import UrgentNeedBanner from './UrgentNeedBanner/UrgentNeedBanner';
import ExternalApiFailureBanner from './ExternalApiFailureBanner/ExternalApiFailureBanner';
import './Results.css';
import { OTHER_PAGE_TITLES } from '../../Assets/pageTitleTags';
import { addAdminToLink } from '../../Assets/adminLink';
import { FormData } from '../../Types/FormData';
import filterProgramsGenerator from './Filter/filterPrograms';
import useFetchEnergyCalculatorRebates from '../EnergyCalculator/Results/fetchRebates';
import { EnergyCalculatorRebateCategory } from '../EnergyCalculator/Results/rebateTypes';
import EnergyCalculatorRebatePage from '../EnergyCalculator/Results/RebatePage';
import { usePageTitle } from '../Common/usePageTitle';
import { NPSWidget } from '../NPS';
import ShareModalAutoPopup from '../Share/ShareModalAutoPopup';
import { useFeatureFlag } from '../Config/configHook';
import { ChatbotProvider } from './Chatbot/Chatbot';
import { useTrackEvent, useTrackItemList } from '../../Assets/analytics';
import { POST_DIRECTORY_STEP_IDS } from '../../Assets/analytics/stepIds';
import { calculateTotalValue, programValue } from './FormattedValue';

// Mounts the Benbot chat widget only when the flag is on; otherwise renders children unchanged.
// Defined at module scope so its identity is stable across renders (no subtree remount).
const BenbotWrapper = ({ enabled, children }: PropsWithChildren<{ enabled: boolean }>) =>
  enabled ? <ChatbotProvider>{children}</ChatbotProvider> : <>{children}</>;

type WrapperResultsContext = {
  programs: Program[];
  programCategories: ProgramCategory[];
  needs: UrgentNeed[];
  filterState: FilterState;
  setFilterState: (newFilterState: FilterState) => void;
  missingPrograms: boolean;
  isAdminView: boolean;
  validations: Validation[];
  setValidations: (validations: Validation[]) => void;
  energyCalculatorRebateCategories: EnergyCalculatorRebateCategory[];
  policyEngineData: PolicyEngineData | undefined;
  externalApiFailures: string[];
};

type ResultsProps = {
  type: 'program' | 'need' | 'help' | 'energy-calculator-rebates';
};

export const ResultsContext = createContext<WrapperResultsContext | undefined>(undefined);

export function useResultsContext() {
  const context = useContext(ResultsContext);

  if (context === undefined) {
    throw new Error('Component not in results context');
  }

  return context;
}

export function findMemberEligibilityMember(formData: FormData, memberEligibility: MemberEligibility) {
  const member = formData.householdData.find(({ frontendId }) => frontendId === memberEligibility.frontend_id);

  if (member === undefined) {
    throw new Error(`Member with frontend id of ${memberEligibility.frontend_id} could not be found in formData`);
  }

  return member;
}

export function findProgramById(programs: Program[], id: number) {
  return programs.find((program) => program.program_id === id);
}

export function findValidationForProgram(validations: Validation[], program: Program) {
  return validations.find((validation) => validation.program_name === program.external_name);
}

export function useResultsLink(link: string) {
  const { isAdminView } = useResultsContext();
  const { whiteLabel, uuid } = useParams();

  return addAdminToLink(`/${whiteLabel}/${uuid}/${link}`, isAdminView);
}

// Referrer opt-out for Immediate Help. Flag is still named `no_results_more_help`
// (predates the tab; policy unchanged). Centralizes the `[] as string[]` default
// getReferrer needs to avoid throwing when referrerData is undefined.
export function useImmediateHelpSuppressed() {
  const { getReferrer } = useContext(Context);

  return getReferrer('uiOptions', [] as string[]).includes('no_results_more_help');
}

// GA4 tab_name per browsable tab. Types absent here (program detail, energy rebates)
// are not tabs and are excluded from scroll-depth tracking.
const SCROLL_DEPTH_TAB_NAMES: Partial<Record<ResultsProps['type'], string>> = {
  program: 'long_term_benefits',
  need: 'additional_resources',
  help: 'immediate_help',
};

const Results = ({ type }: ResultsProps) => {
  const { formData, locale } = useContext(Context);
  const { whiteLabel, uuid, programId, energyCalculatorRebateType } = useParams();
  const immediateHelpSuppressed = useImmediateHelpSuppressed();

  const [searchParams] = useSearchParams();
  const isAdminView = useMemo(() => searchParams.get('admin') === 'true', [searchParams.get('admin')]);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [apiResults, setApiResults] = useState<EligibilityResults | undefined>();
  const track = useTrackEvent();
  const trackItemList = useTrackItemList();
  const hasTrackedResultsLoaded = useRef(false);

  useEffect(() => {
    dataLayerPush({ event: 'config', user_id: uuid });
  }, [uuid]);

  usePageTitle(OTHER_PAGE_TITLES.results);

  const fetchResults = async () => {
    try {
      if (uuid === undefined) {
        throw new Error('can not find uuid');
      }
      const rawEligibilityResponse = await getEligibility(uuid, isAdminView);

      // replace the program id in the categories with the program
      for (const category of rawEligibilityResponse.program_categories) {
        const programs: number[] = category.programs as unknown[] as number[];
        category.programs = programs.map((programId: number) => {
          const program = findProgramById(rawEligibilityResponse.programs, programId);

          if (program === undefined) {
            throw new Error(`program with id of "${programId}" does not exist`);
          }

          return program;
        });
      }

      setApiResults(rawEligibilityResponse);
    } catch (error) {
      console.error(error);
      setApiError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const [filterState, setFilterState] = useState<FilterState>(createInitialFilterState());
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programCategories, setProgramCategories] = useState<ProgramCategory[]>([]);
  const [needs, setNeeds] = useState<UrgentNeed[]>([]);
  const [missingPrograms, setMissingPrograms] = useState(false);
  const [externalApiFailures, setExternalApiFailures] = useState<string[]>([]);
  const [validations, setValidations] = useState<Validation[]>([]);
  const energyCalculatorRebateCategories = useFetchEnergyCalculatorRebates();

  // The programs shown on load — run through the same filterPrograms pipeline the
  // UI uses (legal status, calculated member eligibility, value/already-held,
  // program exclusions), but with the INITIAL filter state, so it reflects the
  // page as first rendered and doesn't shift when the user changes the
  // interactive citizenship filter. Analytics for the count, impression, and
  // none-eligible guard all read this one set.
  const shownPrograms = useMemo(
    () =>
      apiResults === undefined
        ? []
        : filterProgramsGenerator(formData, createInitialFilterState(), isAdminView)(apiResults.programs),
    [apiResults, formData, isAdminView],
  );

  // Fire screener_results_loaded once, as soon as the API result resolves —
  // independent of rebate loading (not on later filter re-renders).
  useEffect(() => {
    if (apiResults === undefined || hasTrackedResultsLoaded.current) {
      return;
    }

    hasTrackedResultsLoaded.current = true;
    const totalEstimatedValue = apiResults.program_categories.reduce(
      (sum, category) => sum + calculateTotalValue(category),
      0,
    );

    track('screener_results_loaded', {
      program_count: shownPrograms.length,
      total_estimated_value: totalEstimatedValue,
    });

    // Emit results as a step view (terminal — view only) so it's tracked on the
    // same event as every other step.
    track('screener_form_step', {
      screener_step_name: POST_DIRECTORY_STEP_IDS.results,
      step_action: 'view',
    });

    // Programs shown, as one view_item_list impression — the on-load set from
    // shownPrograms. Ref-guarded above, so once per screening.
    trackItemList(
      'results_programs',
      shownPrograms.map((program, index) => ({
        item_id: String(program.program_id),
        item_name: program.name.default_message,
        item_list_index: index,
      })),
    );
  }, [apiResults, shownPrograms, track, trackItemList]);

  // Results-page scroll depth, browsable tabs only. Each threshold fires once per tab per screening.
  const firedScrollDepths = useRef<Set<number>>(new Set());
  useEffect(() => {
    // CESN's `help` route is a standalone page with no tab bar (see `isEnergyCalculator`
    // below) — exclude it here even though `help` is otherwise in the lookup.
    const tabName = whiteLabel === 'cesn' && type === 'help' ? null : (SCROLL_DEPTH_TAB_NAMES[type] ?? null);
    if (tabName === null) {
      return; // program detail / rebates / CESN's standalone help page aren't browsable tabs
    }
    firedScrollDepths.current = new Set(); // new tab → reset the once-per-tab guard

    const thresholds: (25 | 50 | 75 | 100)[] = [25, 50, 75, 100];
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      if (scrollable <= 0) {
        return;
      }
      const pct = (doc.scrollTop / scrollable) * 100;
      for (const depth of thresholds) {
        if (pct >= depth && !firedScrollDepths.current.has(depth)) {
          firedScrollDepths.current.add(depth);
          track('screener_results_scroll_depth', { depth, tab_name: tabName });
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [type, track, whiteLabel]);

  // "None eligible" needs BOTH result sets resolved, or we'd fire a false
  // negative while rebates are still loading (and the once-guard would prevent
  // correction). On the energy calculator, rebates load async and are undefined
  // until resolved. Reads shownPrograms (the on-load visible set), so a screening
  // with nothing shown and no rebates is a true none-eligible. Separate guard so
  // it stays independent of screener_results_loaded above.
  const hasTrackedNoneEligible = useRef(false);
  useEffect(() => {
    const rebatesLoading = whiteLabel === 'cesn' && energyCalculatorRebateCategories === undefined;
    if (apiResults === undefined || rebatesLoading || hasTrackedNoneEligible.current) {
      return;
    }

    hasTrackedNoneEligible.current = true;
    const noRebates = (energyCalculatorRebateCategories ?? []).length === 0;
    if (shownPrograms.length === 0 && noRebates) {
      track('screener_results_none_eligible', {});
    }
  }, [apiResults, shownPrograms, energyCalculatorRebateCategories, whiteLabel, track]);

  // Benbot AI assistant — gated behind the 'benbot' feature flag (off by default).
  const isBenbotEnabled = useFeatureFlag('benbot');
  const [policyEngineData, setPolicyEngineData] = useState<PolicyEngineData>();
  const isEnergyCalculator = whiteLabel === 'cesn';

  const filterPrograms = useMemo(
    () => filterProgramsGenerator(formData, filterState, isAdminView),
    [formData, filterState, isAdminView]
  );

  useEffect(() => {
    if (apiResults === undefined) {
      setNeeds([]);
      setPrograms([]);
      setProgramCategories([]);
      setMissingPrograms(false);
      setExternalApiFailures([]);
      setValidations([]);
      setPolicyEngineData(undefined);
      return;
    }

    // For energy calculator, wait for rebates to load before showing results
    // This prevents the flash of empty rebates before they populate
    if (isEnergyCalculator && energyCalculatorRebateCategories === undefined) {
      return;
    }

    setNeeds(apiResults.urgent_needs);
    setPrograms(filterPrograms(apiResults.programs));
    setProgramCategories(
      apiResults.program_categories.map((category) => {
        return {
          ...category,
          programs: filterPrograms(category.programs),
        };
      }),
    );
    setMissingPrograms(apiResults.missing_programs);
    setExternalApiFailures(apiResults.external_api_failures ?? []);
    setValidations(apiResults.validations);
    setLoading(false);
    setPolicyEngineData(apiResults.pe_data);
  }, [filterPrograms, apiResults, isEnergyCalculator, energyCalculatorRebateCategories]);

  const ResultsContextProvider = ({ children }: PropsWithChildren) => {
    return (
      <ResultsContext.Provider
        value={{
          programs,
          programCategories,
          needs,
          filterState,
          setFilterState,
          missingPrograms,
          isAdminView,
          validations,
          setValidations,
          energyCalculatorRebateCategories: energyCalculatorRebateCategories ?? [],
          policyEngineData,
          externalApiFailures,
        }}
      >
        {children}
      </ResultsContext.Provider>
    );
  };

  if (loading) {
    return (
      <main className="benefits-form">
        <div className="results-loading-container">
          <Loading />
        </div>
      </main>
    );
  } else if (apiError) {
    return <ResultsError />;
  } else if (programId === undefined && type === 'help' && immediateHelpSuppressed) {
    // Suppressed referrers must not reach More Help by URL either. Must run before the
    // CESN branch below, so a suppressed referrer on CESN redirects here too.
    return <Navigate to={addAdminToLink(`/${whiteLabel}/${uuid}/results/benefits`, isAdminView)} replace />;
  } else if (programId === undefined && type === 'help' && isEnergyCalculator) {
    // CESN has no tab bar (Tabs.tsx), so Immediate Help stays this standalone page,
    // keeping its "BACK TO RESULTS" affordance. Folding it into the tabbed layout would
    // leave "BACK TO SCREENER" with no tab bar to get back to results.
    return (
      <main className="benefits-form">
        <Grid container>
          <Grid item xs={12}>
            <BackAndSaveButtons
              navigateToLink={addAdminToLink(`/${whiteLabel}/${uuid}/results/benefits`, isAdminView)}
              BackToThisPageText={
                <FormattedMessage id="results.back-to-results-btn" defaultMessage="BACK TO RESULTS" />
              }
            />
            <MoreHelp isStandalonePage />
          </Grid>
        </Grid>
      </main>
    );
  } else if (programId === undefined && (type === 'program' || type === 'need' || type === 'help')) {
    // Built inside render, not at module scope: Results.tsx has an import cycle
    // (Results -> Tabs -> Results), and a module-scope lookup could read
    // Programs/Needs/MoreHelp before they finish initializing, baking in `undefined`
    // with no ErrorBoundary to catch it. Render only starts after the whole module
    // graph loads, so this is safe. A Record (not nested ternaries) makes a missing
    // type a compile error instead of a silent fallback to Long-Term Benefits.
    const panels: Record<ResultsTabId, { tabId: string; Content: ComponentType }> = {
      program: { tabId: 'long-term-benefits-tab', Content: Programs },
      need: { tabId: 'near-term-benefits-tab', Content: Needs },
      help: { tabId: 'immediate-help-tab', Content: MoreHelp },
    };
    const panel = panels[type];

    return (
      <ResultsContextProvider>
        <BenbotWrapper enabled={isBenbotEnabled}>
          <main>
            <ResultsHeader />
            <div className="results-card-wrapper">
              <ResultsTabs activeTab={type} />
              <div id="results-tabpanel" role="tabpanel" aria-labelledby={panel.tabId} className="benefits-form results-card-body">
                {/* Inside the panel, not above it — per-tab content should be reachable
                    when a screen reader enters the active panel. */}
                <ResultsSummary type={type} />
                {type === 'program' && <ExternalApiFailureBanner />}
                {type === 'program' && <UrgentNeedBanner />}
                <Grid container sx={{ pt: '1rem' }}>
                  <Grid item xs={12}>
                    <panel.Content />
                  </Grid>
                </Grid>
                {/* CESN renders no tab bar (see Tabs.tsx), so this button remains its only
                    entry point to the Immediate Help resources. */}
                {isEnergyCalculator && !immediateHelpSuppressed && <MoreHelpButton />}
                {/* Both fire impression events on a timer, so they stay off the help tab to
                    avoid inflating impressions and diluting the NPS response denominator. */}
                {type !== 'help' && <NPSWidget uuid={uuid} />}
                {type !== 'help' && <ShareModalAutoPopup />}
              </div>
            </div>
          </main>
        </BenbotWrapper>
      </ResultsContextProvider>
    );
  }

  const NavigateToMainResultsPage = () => {
    return <Navigate to={addAdminToLink(`/${whiteLabel}/${uuid}/results/benefits`, isAdminView)} />;
  };

  if (programId !== undefined) {
    const program = findProgramById(programs, Number(programId));

    if (program === undefined) {
      return <NavigateToMainResultsPage />;
    }

    return (
      <ResultsContextProvider>
        <ProgramPage program={program} />
      </ResultsContextProvider>
    );
  } else if (energyCalculatorRebateType !== undefined) {
    const rebateCategory = energyCalculatorRebateCategories?.find(
      (category) => category.type === energyCalculatorRebateType,
    );

    if (rebateCategory === undefined) {
      return <NavigateToMainResultsPage />;
    }

    return (
      <ResultsContextProvider>
        <EnergyCalculatorRebatePage rebateCategory={rebateCategory} />
      </ResultsContextProvider>
    );
  } else {
    return <NavigateToMainResultsPage />;
  }
};

export default Results;
