import { useCallback, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useResultsContext, useResultsLink } from '../Results';
import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';

const ResultsTabs = () => {
  const { programs, needs } = useResultsContext();
  const translateNumber = useTranslateNumber();
  const location = useLocation();
  const navigate = useNavigate();

  const benefitsLink = useResultsLink(`results/benefits`);
  const needsLink = useResultsLink(`results/near-term-needs`);

  const isBenefitsActive = location.pathname.includes('benefits');
  const tabRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const tabLinks = [benefitsLink, needsLink];

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = isBenefitsActive ? 0 : 1;
      let nextIndex: number | null = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % 2;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        nextIndex = (currentIndex + 1) % 2;
      } else if (e.key === 'Home') {
        nextIndex = 0;
      } else if (e.key === 'End') {
        nextIndex = 1;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        tabRefs.current[nextIndex]?.focus();
        navigate(tabLinks[nextIndex]);
      }
    },
    [isBenefitsActive, navigate, tabLinks],
  );

  const isEnergyCalculator = useIsEnergyCalculator();
  if (isEnergyCalculator) {
    return null;
  }
  return (
    <nav aria-label="Results">
      <Grid container className="results-tab-container" role="tablist" onKeyDown={handleKeyDown}>
        <Grid item xs={6} className="results-tab" role="presentation">
          <NavLink
            ref={(el) => { tabRefs.current[0] = el; }}
            to={benefitsLink}
            className={({ isActive }) => (isActive ? 'active' : '')}
            data-testid="long-term-benefits-tab"
            role="tab"
            aria-selected={isBenefitsActive}
            aria-controls="results-tabpanel"
            tabIndex={isBenefitsActive ? 0 : -1}
          >
            <span className="results-tab-label">
              <FormattedMessage id="resultsOptions.longTermBenefits" defaultMessage="Long-Term Benefits " />(
              {translateNumber(programs.length)})
            </span>
          </NavLink>
        </Grid>
        <Grid item xs={6} className="results-tab" role="presentation">
          <NavLink
            ref={(el) => { tabRefs.current[1] = el; }}
            to={needsLink}
            className={({ isActive }) => (isActive ? 'active' : '')}
            data-testid="near-term-benefits-tab"
            role="tab"
            aria-selected={!isBenefitsActive}
            aria-controls="results-tabpanel"
            tabIndex={!isBenefitsActive ? 0 : -1}
          >
            <span className="results-tab-label">
              <FormattedMessage id="resultsOptions.nearTermBenefits" defaultMessage="Additional Resources " />(
              {translateNumber(needs.length)})
            </span>
          </NavLink>
        </Grid>
      </Grid>
    </nav>
  );
};

export default ResultsTabs;
