import { useCallback, useMemo, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useImmediateHelpSuppressed, useResultsContext, useResultsLink } from '../Results';
import { FormattedMessage } from 'react-intl';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';
import { useTrackEvent } from '../../../Assets/analytics';
import { buildTabs, getNextTabIndex, ResultsTabId, TabDescriptor } from './buildTabs';

const DEFAULT_TAB_ICON_SIZE = 17;

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

  // Shared so click and keyboard both track the same events.
  const trackTabActivation = useCallback(
    (tab: TabDescriptor) => {
      track('screener_results_tab_click', { tab_name: tab.trackName });

      if (tab.id === 'help') {
        // Energy-calculator referrers have no tab bar, so they use a separate
        // More Help button for this. `location` tells the two apart.
        track('screener_get_help_click', { location: 'immediate_help_tab' });
      }
    },
    [track],
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
        trackTabActivation(tabs[nextIndex]);
        navigate(tabs[nextIndex].to);
      }
    },
    [activeTab, navigate, tabs, trackTabActivation],
  );

  const isEnergyCalculator = useIsEnergyCalculator();
  if (isEnergyCalculator) {
    return null;
  }

  return (
    <nav aria-label="Results">
      {/* Each tab is sized to its own label, so the row reads as a set of discrete
          controls rather than three equal slabs. data-tab-count scopes the mobile
          sizing, where the tabs do share the width equally. */}
      <div className="results-tab-container" data-tab-count={tabs.length} role="tablist" onKeyDown={handleKeyDown}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;

          return (
            <div key={tab.id} className="results-tab" role="presentation">
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
                onClick={() => trackTabActivation(tab)}
              >
                <span className="results-tab-label">
                  {/* strokeWidth matches the shared Icon component so tab icons carry the
                      same weight as the rest of the page. */}
                  <tab.icon
                    aria-hidden="true"
                    className="results-tab-icon"
                    size={tab.iconSize ?? DEFAULT_TAB_ICON_SIZE}
                    strokeWidth={1.5}
                  />
                  <FormattedMessage id={tab.labelId} defaultMessage={tab.defaultMessage} />
                  {tab.count !== undefined && <span className="results-tab-count">{translateNumber(tab.count)}</span>}
                </span>
              </NavLink>
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default ResultsTabs;
