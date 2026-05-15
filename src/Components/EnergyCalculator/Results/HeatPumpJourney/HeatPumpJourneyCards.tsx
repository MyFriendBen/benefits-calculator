import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { TrackedOutboundLink } from '../../../Common/TrackedOutboundLink';
import { useFeatureFlag } from '../../../Config/configHook';
import { useResultsLink } from '../../../Results/Results';
import './HeatPumpJourneyCards.css';

const POWER_AHEAD_LEARN_MORE_URL = 'https://poweraheadcolorado.org/why-heat-pumps?utm_source=cesn';

export default function HeatPumpJourneyCards() {
  const isEnabled = useFeatureFlag('cesn_heat_pump_journey');
  const billsImpactLink = useResultsLink('results/heat-pump-bills-impact');
  const contractorsLink = useResultsLink('results/heat-pump-contractors');

  if (!isEnabled) {
    return null;
  }

  return (
    <section className="heat-pump-journey-cards" aria-label="Heat pump journey">
      <article className="heat-pump-journey-card">
        <span className="heat-pump-journey-card-badge" aria-hidden="true">
          1
        </span>
        <h3 className="heat-pump-journey-card-title">
          <FormattedMessage
            id="energyCalculator.heatPumpJourney.card1.title"
            defaultMessage="Why get a heat pump?"
          />
        </h3>
        <p className="heat-pump-journey-card-description">
          <FormattedMessage
            id="energyCalculator.heatPumpJourney.card1.description"
            defaultMessage="Many customers see cost savings from switching to a heat pump. They reduce your carbon footprint and can improve air quality."
          />
        </p>
        <TrackedOutboundLink
          href={POWER_AHEAD_LEARN_MORE_URL}
          action="heat_pump_journey_learn_more_click"
          label="Power Ahead Colorado - Why Heat Pumps"
          category="heat_pump_journey"
          className="heat-pump-journey-card-cta"
        >
          <FormattedMessage id="energyCalculator.heatPumpJourney.card1.cta" defaultMessage="Learn more" />
        </TrackedOutboundLink>
      </article>

      <article className="heat-pump-journey-card">
        <span className="heat-pump-journey-card-badge" aria-hidden="true">
          2
        </span>
        <h3 className="heat-pump-journey-card-title">
          <FormattedMessage
            id="energyCalculator.heatPumpJourney.card2.title"
            defaultMessage="Will it impact my bills?"
          />
        </h3>
        <p className="heat-pump-journey-card-description">
          <FormattedMessage
            id="energyCalculator.heatPumpJourney.card2.description"
            defaultMessage="Learn how your household may see potential energy bill changes and emissions reductions."
          />
        </p>
        <Link to={billsImpactLink} className="heat-pump-journey-card-cta">
          <FormattedMessage id="energyCalculator.heatPumpJourney.card2.cta" defaultMessage="Calculate impact" />
        </Link>
      </article>

      <article className="heat-pump-journey-card">
        <span className="heat-pump-journey-card-badge" aria-hidden="true">
          3
        </span>
        <h3 className="heat-pump-journey-card-title">
          <FormattedMessage
            id="energyCalculator.heatPumpJourney.card3.title"
            defaultMessage="Whom should I hire?"
          />
        </h3>
        <p className="heat-pump-journey-card-description">
          <FormattedMessage
            id="energyCalculator.heatPumpJourney.card3.description"
            defaultMessage="Heat pumps are an upgrade to your HVAC system. Consult with a registered contractor to help you plan your heat pump installation."
          />
        </p>
        <Link to={contractorsLink} className="heat-pump-journey-card-cta">
          <FormattedMessage id="energyCalculator.heatPumpJourney.card3.cta" defaultMessage="Connect now" />
        </Link>
      </article>
    </section>
  );
}
