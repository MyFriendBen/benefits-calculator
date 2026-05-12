import { FormattedMessage } from 'react-intl';
import { useFeatureFlag } from '../../Config/configHook';
import { TrackedOutboundLink } from '../../Common/TrackedOutboundLink';
import './CesnHeatPumpJourney.css';

/**
 * Three-card intro section for CESN water-heater (heat pump) results.
 * Gated by white-label flag `cesn_heat_pump_journey` from benefits-api config.
 */
export default function CesnHeatPumpJourney() {
  const enabled = useFeatureFlag('cesn_heat_pump_journey');

  if (!enabled) {
    return null;
  }

  return (
    <section
      className="cesn-heat-pump-journey"
      aria-labelledby="cesn-heat-pump-journey-heading"
    >
      <h2 id="cesn-heat-pump-journey-heading" className="cesn-heat-pump-journey-heading">
        <FormattedMessage
          id="cesn.heatPumpJourney.sectionHeading"
          defaultMessage="Heat pump water heaters: what to know"
        />
      </h2>
      <div className="cesn-heat-pump-journey-cards">
        <article className="cesn-heat-pump-journey-card">
          <h3 className="cesn-heat-pump-journey-card-title">
            <FormattedMessage
              id="cesn.heatPumpJourney.card1.title"
              defaultMessage="Why get a heat pump?"
            />
          </h3>
          <p>
            <FormattedMessage
              id="cesn.heatPumpJourney.card1.body"
              defaultMessage="Heat pump water heaters move heat instead of burning fuel on site, so they are typically much more efficient than standard tanks—good for your energy use and indoor air quality. Rebates and tax credits can make upgrading more affordable."
            />
          </p>
          <TrackedOutboundLink
            href="https://homes.rewiringamerica.org/projects/heat-pump-water-heater-homeowner"
            className="cesn-heat-pump-journey-link link-color"
            action="cesn_heat_pump_journey_guide_click"
            label="Rewiring America heat pump water heater guide"
            category="energy_rebate"
          >
            <FormattedMessage
              id="cesn.heatPumpJourney.card1.link"
              defaultMessage="Read Rewiring America’s heat pump water heater guide"
            />
          </TrackedOutboundLink>
        </article>
        <article className="cesn-heat-pump-journey-card">
          <h3 className="cesn-heat-pump-journey-card-title">
            <FormattedMessage
              id="cesn.heatPumpJourney.card2.title"
              defaultMessage="Will it impact my bills?"
            />
          </h3>
          <p>
            <FormattedMessage
              id="cesn.heatPumpJourney.card2.body"
              defaultMessage="Many households see lower water-heating costs because heat pump water heaters use less energy than gas or conventional electric resistance tanks. Your exact savings depend on utility rates, how much hot water you use, fuel prices, and your home’s setup."
            />
          </p>
        </article>
        <article className="cesn-heat-pump-journey-card">
          <h3 className="cesn-heat-pump-journey-card-title">
            <FormattedMessage
              id="cesn.heatPumpJourney.card3.title"
              defaultMessage="Whom should I hire?"
            />
          </h3>
          <p>
            <FormattedMessage
              id="cesn.heatPumpJourney.card3.body"
              defaultMessage="Use a qualified contractor who can size the unit correctly, meet program rules so you keep rebates, and install safely. Your electric utility may maintain a contractor list; Rewiring America also offers contractor resources."
            />
          </p>
          <TrackedOutboundLink
            href="https://homes.rewiringamerica.org/contractor-networks"
            className="cesn-heat-pump-journey-link link-color"
            action="cesn_heat_pump_journey_contractors_click"
            label="Rewiring America contractor networks"
            category="energy_rebate"
          >
            <FormattedMessage
              id="cesn.heatPumpJourney.card3.link"
              defaultMessage="Find contractor resources at Rewiring America"
            />
          </TrackedOutboundLink>
        </article>
      </div>
    </section>
  );
}
