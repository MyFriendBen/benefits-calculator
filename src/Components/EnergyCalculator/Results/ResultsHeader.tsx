import { CardContent } from '@mui/material';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { useResultsContext } from '../../Results/Results';
import { Context } from '../../Wrapper/Wrapper';
import { useEnergyCalculatorNeedsRebates } from './RebateCategories';
import './ResultsHeader.css';

export default function EnergyCalculatorResultsHeader() {
  const { theme } = useContext(Context);
  const { programs, energyCalculatorRebateCategories } = useResultsContext();
  const needsRebates = useEnergyCalculatorNeedsRebates();

  const rebateCount = energyCalculatorRebateCategories.reduce((acc, category) => acc + category.rebates.length, 0);

  const programsTile = (
    <section className="energy-calculator-results-header-programs-count-text">
      <div className="energy-calculator-results-header-programs-count">{programs.length}</div>
      <div>
        <FormattedMessage id="energyCalculator.results.header.programsFound" defaultMessage="Programs Found" />
      </div>
    </section>
  );

  const rebatesTile =
    rebateCount > 0 ? (
      <section className="energy-calculator-results-header-programs-count-text">
        <div className="energy-calculator-results-header-programs-count">{rebateCount}</div>
        <div>
          <FormattedMessage id="energyCalculator.results.header.rebatesFound" defaultMessage="Rebates Found" />
        </div>
      </section>
    ) : null;

  return (
    <CardContent
      sx={{
        backgroundColor: theme.secondaryBackgroundColor,
        margin: '0rem',
        padding: '0rem',
        '&:last-child': {
          paddingBottom: '0rem',
        },
      }}
    >
      <header className="energy-calculator-results-header">
        {needsRebates ? (
          <>
            {rebatesTile}
            {programsTile}
          </>
        ) : (
          <>
            {programsTile}
            {rebatesTile}
          </>
        )}
      </header>
    </CardContent>
  );
}
