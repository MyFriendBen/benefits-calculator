import { EnergyCalculatorRebate, EnergyCalculatorRebateCategory } from './rebateTypes';
import { FormattedMessage } from 'react-intl';
import BackAndSaveButtons from '../../Results/BackAndSaveButtons/BackAndSaveButtons';
import { useResultsLink } from '../../Results/Results';
import { EnergyCalculatorRebateCardTitle, rebateTypes } from './RebatePageMappings';
import { ReactComponent as WarningIcon } from '../../../Assets/icons/General/warning.svg';
import { ReactComponent as Coin } from '../Icons/Coin.svg';
import { renderCategoryDescription } from './rebateTypes';
import './RebatePage.css';
import { useMemo, useContext } from 'react';
import { TrackedOutboundLink } from '../../Common/TrackedOutboundLink';
import { Context } from '../../Wrapper/Wrapper';

// Format expiration date from ISO string to readable format
const formatExpirationDate = (dateString: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  };

  // Parse YYYY-MM-DD format to avoid timezone issues
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (match) {
    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    return date.toLocaleDateString('en-US', options);
  }

  // Fallback for other date formats
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', options);
};

type RebatePageProps = {
  rebateCategory: EnergyCalculatorRebateCategory;
};

export default function EnergyCalculatorRebatePage({ rebateCategory }: RebatePageProps) {
  const backLink = useResultsLink(`results/benefits`);
  const { formData } = useContext(Context);

  return (
    <main>
      <section className="back-to-results-button-container">
        <BackAndSaveButtons
          navigateToLink={backLink}
          BackToThisPageText={<FormattedMessage id="results.back-to-results-btn" defaultMessage="BACK TO RESULTS" />}
        />
      </section>
      <div className="energy-calculator-rebate-page-container">
        <h1>
          <Coin />
          <span>{rebateCategory.name}</span>
        </h1>
        {renderCategoryDescription(rebateCategory.type, formData)}
        <section>
          {rebateCategory.rebates.map((rebate, i) => {
            return <RebateCard rebate={rebate} rebateCategory={rebateCategory} key={i} />;
          })}
        </section>
      </div>
    </main>
  );
}

type RebateProps = {
  rebate: EnergyCalculatorRebate;
  rebateCategory: EnergyCalculatorRebateCategory;
};

function RebateCard({ rebate, rebateCategory }: RebateProps) {
  const rebateUrl = useMemo(() => {
    const url = new URL(rebate.program_url);

    const urlParams = url.searchParams;

    urlParams.set('utm_source', 'cesn');
    urlParams.set('utm_medium', 'web');
    urlParams.set('utm_campaign', 'cesn');
    urlParams.set('utm_id', 'cesn');

    return url.href;
  }, [rebate.program_url]);

  return (
    <div className="energy-calculator-rebate-page-rebate-card">
      <div>
        <h2>
          <EnergyCalculatorRebateCardTitle rebate={rebate} />
        </h2>
        <strong>{rebate.program}</strong>
        <div className="energy-calculator-rebate-page-rebate-card-type-container">
          {rebateTypes(rebate).map((type, index) => {
            return <span key={index}>{type}</span>;
          })}
          {rebate.authority_type === 'federal' && rebate.payment_methods.includes('tax_credit') && rebate.end_date && (
            <div className="energy-calculator-expiration-badge">
              <WarningIcon className="energy-calculator-expiration-icon" />
              <FormattedMessage
                id="energyCalculator.rebatePage.expiration.ending"
                defaultMessage="Ending on {date}"
                values={{ date: formatExpirationDate(rebate.end_date) }}
              />
            </div>
          )}
        </div>
      </div>
      <p>{rebate.short_description}</p>
      {/*
        TEMPORARILY REMOVED: EnergyCalculatorRebateCalculator
        Partner: CDS (Colorado Digital Service)

        The interactive savings calculator component was removed at CDS partner request.
        To reintroduce this feature, uncomment the line below:

        <EnergyCalculatorRebateCalculator rebate={rebate} />

        The calculator only appeared for 'percent' and 'dollar_amount' rebate types
        (not for 'dollars_per_unit' types as noted in RebatePageMappings.tsx:405-406)
      */}
      <div className="energy-calculator-rebate-page-more-info">
        <TrackedOutboundLink
          href={rebateUrl}
          action="rebate_link_click"
          label={rebate.program}
          category="energy_rebate"
          additionalData={{
            rebate_type: rebate.payment_methods.join(', '),
            rebate_category: rebateCategory.type,
          }}
        >
          <FormattedMessage id="energyCalculator.rebatePage.applyButton" defaultMessage="Learn how to apply" />
        </TrackedOutboundLink>
      </div>
    </div>
  );
}
