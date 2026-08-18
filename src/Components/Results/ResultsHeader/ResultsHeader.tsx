import { CardContent } from '@mui/material';
import { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { Context } from '../../Wrapper/Wrapper';
import BackAndSaveButtons from '../BackAndSaveButtons/BackAndSaveButtons';
import { useParams } from 'react-router-dom';
import { useResultsContext } from '../Results';
import { calculateTotalValue } from '../FormattedValue';
import '../../Results/Results.css';
import { useTranslateNumber } from '../../../Assets/languageOptions';
import { useTrackEvent } from '../../../Assets/analytics';
import Login from '../../Login/Login';
import { useIsEnergyCalculator } from '../../EnergyCalculator/hooks';
import EnergyCalculatorResultsHeader from '../../EnergyCalculator/Results/ResultsHeader';
import ResultsSurvey from '../ResultsSurvey/ResultsSurvey';

type ResultsSummaryProps = {
  type: 'program' | 'need' | 'help';
};

const ProgramsHeader = () => {
  const { programs, programCategories } = useResultsContext();
  const { theme, formData } = useContext(Context);
  const taxCreditsCategory = programCategories.find((category) => category.tax_category);
  let taxCredit = 0;
  if (taxCreditsCategory !== undefined) {
    taxCredit = calculateTotalValue(taxCreditsCategory);
  }
  const translateNumber = useTranslateNumber();

  // don't add tax credits to total value
  let estimatedMonthlySavings = 0;
  for (const category of programCategories) {
    if (category.tax_category) {
      continue;
    }

    // use calculate total value to account for preschool cap
    estimatedMonthlySavings += calculateTotalValue(category);
  }

  return (
    <CardContent sx={{ backgroundColor: theme.secondaryBackgroundColor, padding: '1rem' }}>
      <header className="results-header">
        <div className="results-header-programs-count-text">
          <div className="results-header-programs-count">{translateNumber(programs.length)}</div>
          <div>
            <FormattedMessage id="results.header-programsFound" defaultMessage="Programs Found" />
          </div>
        </div>
        <div className="column-row">
          <div className="results-data-cell">
            <div className="results-header-label">
              <FormattedMessage id="results.header-monthlyValue" defaultMessage="Estimated Monthly Savings" />
            </div>
            <div className="results-header-values">
              ${translateNumber(Math.round(estimatedMonthlySavings / 12).toLocaleString())}
            </div>
          </div>
          {formData.immutableReferrer !== 'lgs' && (
            <div className="results-data-cell">
              <div className="results-header-label">
                <FormattedMessage id="results.header-taxCredits" defaultMessage="Annual Tax Credit" />
              </div>
              <div className="results-header-values">${translateNumber(Math.round(taxCredit).toLocaleString())}</div>
            </div>
          )}
        </div>
      </header>
    </CardContent>
  );
};

// The per-tab summary block. Rendered BELOW the tab bar and inside the results card,
// so it is separate from ResultsHeader (which stays above, full-bleed). The wrapper
// div lives in here rather than in Results so the Immediate Help tab renders nothing
// at all — `.results-header-container` has a fixed `height: 9rem`, which would leave
// an empty gap if the wrapper rendered without a summary inside it.
//
// Shows only on Long-Term Benefits, per the PM. Additional Resources previously had its
// own "N Resources Found" block (NeedsHeader), but that count already appears in the tab
// label itself ("Additional Resources (N)"), so it was a pure duplicate carrying the
// same visual weight as the real summary for no extra information — removed rather than
// repositioned.
export const ResultsSummary = ({ type }: ResultsSummaryProps) => {
  const isEnergyCalculator = useIsEnergyCalculator();

  if (isEnergyCalculator) {
    return (
      <div className="energy-calculator-results-header-container">
        <EnergyCalculatorResultsHeader />
      </div>
    );
  }

  if (type !== 'program') {
    return null;
  }

  return (
    <div className="results-header-container">
      <ProgramsHeader />
    </div>
  );
};

// Page-level chrome shared by every results tab: back/save buttons, the admin login,
// and the NC feedback survey. Takes no `type` on purpose — it renders above the tab
// bar and outside the results card, so it is identical whichever tab is active.
const ResultsHeader = () => {
  const { whiteLabel, uuid } = useParams();
  const { staffToken, setStaffToken } = useContext(Context);
  const { isAdminView } = useResultsContext();
  const track = useTrackEvent();

  return (
    <>
      <div className="results-back-save-strip">
        <BackAndSaveButtons
          navigateToLink={`/${whiteLabel}/${uuid}/confirm-information`}
          BackToThisPageText={<FormattedMessage id="results.back-to-screen-btn" defaultMessage="BACK TO SCREENER" />}
          onBack={() => track('screener_results_back_to_screener', {})}
        />
      </div>
      {isAdminView && <Login setToken={setStaffToken} loggedIn={staffToken !== undefined} />}
      <ResultsSurvey />
    </>
  );
};

export default ResultsHeader;
