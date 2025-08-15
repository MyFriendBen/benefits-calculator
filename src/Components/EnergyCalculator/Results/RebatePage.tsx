import { EnergyCalculatorRebate, EnergyCalculatorRebateCategory } from './rebateTypes';
import { FormattedMessage } from 'react-intl';
import BackAndSaveButtons from '../../Results/BackAndSaveButtons/BackAndSaveButtons';
import { useResultsLink } from '../../Results/Results';
import { EnergyCalculatorRebateCalculator, EnergyCalculatorRebateCardTitle, rebateTypes } from './RebatePageMappings';
import { ReactComponent as Housing } from '../../../Assets/icons/General/residence.svg';
import { renderCategoryDescription } from './rebateTypes';
import './RebatePage.css';
import { useMemo } from 'react';
import { TrackedOutboundLink } from '../../Common/TrackedOutboundLink';

type RebatePageProps = {
  rebateCategory: EnergyCalculatorRebateCategory;
};

export default function EnergyCalculatorRebatePage({ rebateCategory }: RebatePageProps) {
  const backLink = useResultsLink(`results/benefits`);

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
          <Housing />
          <span>{rebateCategory.name}</span>
        </h1>
        {renderCategoryDescription(rebateCategory.type)}
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
        </div>
      </div>
      <p>{rebate.short_description}</p>
      <EnergyCalculatorRebateCalculator rebate={rebate} />
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
