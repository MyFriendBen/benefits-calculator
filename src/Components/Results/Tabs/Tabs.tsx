import { NavLink, useLocation } from 'react-router-dom';
import { useResultsContext, useResultsLink } from '../Results';
import { Grid } from '@mui/material';
import { FormattedMessage } from 'react-intl';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';

const ResultsTabs = () => {
  const { programs, needs } = useResultsContext();
  const translateNumber = useTranslateNumber();
  const location = useLocation();

  const benefitsLink = useResultsLink(`results/benefits`);
  const needsLink = useResultsLink(`results/near-term-needs`);

  const isEnergyCalculator = useIsEnergyCalculator();
  if (isEnergyCalculator) {
    return null;
  }
  return (
    <nav aria-label="Results">
      <Grid container className="results-tab-container" role="tablist">
        <Grid item xs={6} className="results-tab" role="presentation">
          <NavLink
            to={benefitsLink}
            className={({ isActive }) => (isActive ? 'active' : '')}
            data-testid="long-term-benefits-tab"
            role="tab"
            aria-selected={location.pathname.includes('benefits')}
          >
            <span className="results-tab-label">
              <FormattedMessage id="resultsOptions.longTermBenefits" defaultMessage="Long-Term Benefits " />(
              {translateNumber(programs.length)})
            </span>
          </NavLink>
        </Grid>
        <Grid item xs={6} className="results-tab" role="presentation">
          <NavLink
            to={needsLink}
            className={({ isActive }) => (isActive ? 'active' : '')}
            data-testid="near-term-benefits-tab"
            role="tab"
            aria-selected={location.pathname.includes('near-term')}
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
