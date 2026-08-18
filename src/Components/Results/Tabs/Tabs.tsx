import { useCallback, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useImmediateHelpSuppressed, useResultsContext, useResultsLink } from '../Results';
import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';
import { useTrackEvent } from '../../../Assets/analytics';
import { buildTabs, getNextTabIndex, ResultsTabId } from './buildTabs';

type ResultsTabsProps = {
  // Supplied by Results, which already knows which tab is rendering. Deriving it from
  // the URL here instead would re-parse information the caller already has.
  activeTab: ResultsTabId;
};

const ResultsTabs = ({ activeTab }: ResultsTabsProps) => {
  const { programs, needs } = useResultsContext();
  const translateNumber = useTranslateNumber();
  const navigate = useNavigate();

  const benefitsLink = useResultsLink(`results/benefits`);
  const needsLink = useResultsLink(`results/near-term-needs`);
  const helpLink = useResultsLink(`results/more-help`);
  const immediateHelpSuppressed = useImmediateHelpSuppressed();

  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const track = useTrackEvent();

  const tabs = useMemo(
    () =>
      buildTabs({
        benefitsLink,
        needsLink,
        helpLink,
        programCount: programs.length,
        needCount: needs.length,
        immediateHelpSuppressed,
      }),
    [benefitsLink, needsLink, helpLink, programs.length, needs.length, immediateHelpSuppressed],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);

      if (currentIndex === -1) {
        return;
      }

      const nextIndex = getNextTabIndex(e.key, currentIndex, tabs.length);

      if (nextIndex !== null) {
        e.preventDefault();
        tabRefs.current[nextIndex]?.focus();
        navigate(tabs[nextIndex].to);
      }
    },
    [activeTab, navigate, tabs],
  );

  const isEnergyCalculator = useIsEnergyCalculator();
  if (isEnergyCalculator) {
    return null;
  }

  return (
    <nav aria-label="Results">
      {/* data-tab-count scopes the three-tab CSS adjustments, so the two-tab layout
          (referrers with `no_results_more_help`) renders exactly as it did before. */}
      <Grid
        container
        className="results-tab-container"
        data-tab-count={tabs.length}
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <Grid item xs={12 / tabs.length} key={tab.id} className="results-tab" role="presentation">
              <NavLink
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                to={tab.to}
                className={isActive ? 'active' : ''}
                id={tab.testId}
                data-testid={tab.testId}
                role="tab"
                aria-selected={isActive}
                aria-controls="results-tabpanel"
                tabIndex={isActive ? 0 : -1}
                onClick={() => {
                  track('screener_results_tab_click', { tab_name: tab.trackName });

                  if (tab.id === 'help') {
                    // Continuity for the GA4 "get help" metric: this event used to fire
                    // only from the bottom More Help button, which this tab replaces. A
                    // distinct `location` keeps the rollup comparable across the change
                    // while still telling the two surfaces apart.
                    track('screener_get_help_click', { location: 'immediate_help_tab' });
                  }
                }}
              >
                <span className="results-tab-label">
                  <FormattedMessage id={tab.labelId} defaultMessage={tab.defaultMessage} />
                  {tab.count !== undefined && `(${translateNumber(tab.count)})`}
                </span>
              </NavLink>
            </Grid>
          );
        })}
      </Grid>
    </nav>
  );
};

export default ResultsTabs;
