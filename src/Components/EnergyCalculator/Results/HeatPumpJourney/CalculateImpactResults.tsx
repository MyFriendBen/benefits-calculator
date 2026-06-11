import { FormattedMessage, useIntl } from 'react-intl';
import { IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ForestIcon from '@mui/icons-material/Forest';
import { formatToUSD } from '../../../../utils/formatCurrency';
import {
  getEpaEquivalencies,
  EPA_DATA_SOURCE_MESSAGE_ID,
  EPA_DATA_SOURCE_DEFAULT_MESSAGE,
} from '../../../../utils/epaEquivalencies';
import type { RemImpactApiResponse, CalculateImpactFormValues } from './remCalculateImpactTypes';
import {
  HOUSEHOLD_TYPE_LABEL_MAP,
  FUEL_TYPE_LABEL_MAP,
  UPGRADE_LABEL_MAP,
} from './remCalculateImpactTypes';

// ─── Range bar ────────────────────────────────────────────────────────────────

interface ImpactRangeBarProps {
  p20: number;   // percentile_20 — most favorable (right end)
  median: number;
  p80: number;   // percentile_80 — least favorable (left end)
  formatValue: (absValue: number) => string;
  unitSuffix: string;
}

function isSavings(value: number): boolean {
  return value <= 0;
}

/** Arrow (▼/▲) is colored; number is black. */
function ArrowNumber({
  value,
  formatFn,
  suffix = '',
}: {
  value: number;
  formatFn: (n: number) => string;
  suffix?: string;
}) {
  const arrow = isSavings(value) ? '▼' : '▲';
  const colorClass = isSavings(value)
    ? 'impact-range-bar__arrow--savings'
    : 'impact-range-bar__arrow--increase';
  return (
    <>
      <span className={`impact-range-bar__arrow ${colorClass}`}>{arrow}</span>
      <span className="impact-range-bar__number">
        {formatFn(Math.abs(value))}
        {suffix}
      </span>
    </>
  );
}

function ImpactRangeBar({ p20, median, p80, formatValue, unitSuffix }: ImpactRangeBarProps) {
  // Left = p80 (least favorable), right = p20 (most favorable)
  const leftVal = p80;
  const rightVal = p20;
  const totalRange = leftVal - rightVal;

  if (totalRange === 0) return null;

  // Percent from left edge for a given value
  const pctFromLeft = (v: number): number =>
    Math.max(0, Math.min(100, ((leftVal - v) / totalRange) * 100));

  const medianPct = pctFromLeft(median);
  const crossesZero = leftVal > 0 && rightVal < 0;
  const zeroPct = crossesZero ? pctFromLeft(0) : null;
  const allNegative = leftVal <= 0;

  return (
    <div className="impact-range-bar">
      {/* Median label + caret, floats above the bar */}
      <div className="impact-range-bar__median-wrapper">
        <div
          className="impact-range-bar__median-float"
          style={{ left: `${medianPct}%` }}
          aria-hidden="true"
        >
          <span className="impact-range-bar__median-value">
            <ArrowNumber value={median} formatFn={formatValue} suffix={unitSuffix} />
          </span>
          <span className="impact-range-bar__median-caret">▼</span>
        </div>
      </div>

      {/* Colored bar track */}
      <div className="impact-range-bar__track" role="presentation">
        {crossesZero && zeroPct !== null ? (
          <>
            <div
              className="impact-range-bar__fill impact-range-bar__fill--increase"
              style={{ left: 0, width: `${zeroPct}%` }}
            />
            <div
              className="impact-range-bar__fill impact-range-bar__fill--savings"
              style={{ left: `${zeroPct}%`, width: `${100 - zeroPct}%` }}
            />
          </>
        ) : (
          <div
            className={`impact-range-bar__fill ${allNegative ? 'impact-range-bar__fill--savings' : 'impact-range-bar__fill--increase'}`}
            style={{ left: 0, width: '100%' }}
          />
        )}
        {/* Circle indicator at median position */}
        <div
          className="impact-range-bar__median-circle"
          style={{ left: `${medianPct}%` }}
        />
        {/* Grey oval marker at zero crossing — text label is in the end-labels row below */}
        {crossesZero && zeroPct !== null && (
          <div
            className="impact-range-bar__zero-pill"
            style={{ left: `${zeroPct}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* End labels — left/right percentiles + $0 reference at zero crossing */}
      <div className="impact-range-bar__end-labels">
        <span className="impact-range-bar__end-label">
          <ArrowNumber value={leftVal} formatFn={formatValue} />
        </span>
        {crossesZero && zeroPct !== null && (
          <span
            className="impact-range-bar__zero-label"
            style={{ left: `${zeroPct}%` }}
            aria-hidden="true"
          >
            {formatValue(0)}
          </span>
        )}
        <span className="impact-range-bar__end-label">
          <ArrowNumber value={rightVal} formatFn={formatValue} />
        </span>
      </div>
    </div>
  );
}

// ─── Main results component ───────────────────────────────────────────────────

interface CalculateImpactResultsProps {
  result: RemImpactApiResponse;
  formValues: CalculateImpactFormValues;
  onEdit: () => void;
}

function formatEmissionsLbs(n: number): string {
  return `${Math.round(n).toLocaleString()}lb`;
}

export default function CalculateImpactResults({
  result,
  formValues,
  onEdit,
}: CalculateImpactResultsProps) {
  const intl = useIntl();

  const householdLabel = HOUSEHOLD_TYPE_LABEL_MAP[formValues.householdType];
  const heatingFuelLabel = FUEL_TYPE_LABEL_MAP[formValues.heatingFuel];
  const waterHeatingFuelLabel = formValues.waterHeatingFuel
    ? FUEL_TYPE_LABEL_MAP[formValues.waterHeatingFuel]
    : null;
  const upgradeLabel = UPGRADE_LABEL_MAP[formValues.upgradeChoice];

  // The AC disclaimer only applies to upgrades that add a heat pump for space
  // conditioning; it's misleading for weatherization-only and water-heater upgrades.
  const showAcDisclaimer =
    formValues.upgradeChoice === 'heat_pump' || formValues.upgradeChoice === 'heat_pump_weatherization';

  // Bill range values (absolute)
  const billP20 = result.bill_delta.percentile_20.value;
  const billMedian = result.bill_delta.median.value;
  const billP80 = result.bill_delta.percentile_80.value;
  const billRangeLow = formatToUSD(Math.min(Math.abs(billP20), Math.abs(billP80)));
  const billRangeHigh = formatToUSD(Math.max(Math.abs(billP20), Math.abs(billP80)));
  const billMostLikely = formatToUSD(Math.abs(billMedian));

  // Emissions range values (absolute)
  const emP20 = result.emissions_delta.percentile_20.value;
  const emMedian = result.emissions_delta.median.value;
  const emP80 = result.emissions_delta.percentile_80.value;
  const emRangeLow = Math.round(Math.min(Math.abs(emP20), Math.abs(emP80))).toLocaleString();
  const emRangeHigh = Math.round(Math.max(Math.abs(emP20), Math.abs(emP80))).toLocaleString();
  const emMostLikely = Math.round(Math.abs(emMedian)).toLocaleString();

  const equivalencies = getEpaEquivalencies(emMedian);

  return (
    <div className="calculate-impact-results-outer-card">
      {/* ── Household info summary card ── */}
      <section
        className="calculate-impact-summary-card"
        aria-labelledby="ci-summary-heading"
      >
        <div className="calculate-impact-summary-header">
          <h2 id="ci-summary-heading" className="calculate-impact-section-title">
            <FormattedMessage
              id="energyCalculator.calculateImpact.section.household"
              defaultMessage="Your household info"
            />
          </h2>
          <IconButton
            size="small"
            onClick={onEdit}
            aria-label={intl.formatMessage({
              id: 'energyCalculator.calculateImpact.summary.editAL',
              defaultMessage: 'Edit household info',
            })}
            className="calculate-impact-edit-btn"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </div>

        <dl className="calculate-impact-summary-fields">
          <div className="calculate-impact-summary-field">
            <dt>
              <FormattedMessage
                id="energyCalculator.calculateImpact.field.householdType"
                defaultMessage="Household Type"
              />
            </dt>
            <dd>
              <FormattedMessage
                id={householdLabel.messageId}
                defaultMessage={householdLabel.defaultMessage}
              />
            </dd>
          </div>
          <div className="calculate-impact-summary-field">
            <dt>
              <FormattedMessage
                id="energyCalculator.calculateImpact.field.address"
                defaultMessage="Address"
              />
            </dt>
            <dd>{formValues.address}</dd>
          </div>
          <div className="calculate-impact-summary-field">
            <dt>
              <FormattedMessage
                id="energyCalculator.calculateImpact.field.heatingFuel"
                defaultMessage="Heating Fuel"
              />
            </dt>
            <dd>
              <FormattedMessage
                id={heatingFuelLabel.messageId}
                defaultMessage={heatingFuelLabel.defaultMessage}
              />
            </dd>
          </div>
          {waterHeatingFuelLabel && (
            <div className="calculate-impact-summary-field">
              <dt>
                <FormattedMessage
                  id="energyCalculator.calculateImpact.field.waterHeatingFuelShort"
                  defaultMessage="Water Heating Type"
                />
              </dt>
              <dd>
                <FormattedMessage
                  id={waterHeatingFuelLabel.messageId}
                  defaultMessage={waterHeatingFuelLabel.defaultMessage}
                />
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* ── Selected upgrade ── */}
      <section className="calculate-impact-selected-upgrade" aria-labelledby="ci-upgrade-heading">
        <h2 id="ci-upgrade-heading" className="calculate-impact-section-title">
          <FormattedMessage
            id="energyCalculator.calculateImpact.results.selectedUpgrade"
            defaultMessage="Selected upgrade"
          />
        </h2>
        <div className="calculate-impact-upgrade-value">
          <FormattedMessage
            id={upgradeLabel.messageId}
            defaultMessage={upgradeLabel.defaultMessage}
          />
        </div>
      </section>

      {/* ── Bill and emissions impact ── */}
      <section
        className="calculate-impact-bill-emissions-section"
        aria-labelledby="ci-impact-heading"
      >
        <h2 id="ci-impact-heading" className="calculate-impact-section-title">
          <FormattedMessage
            id="energyCalculator.calculateImpact.results.title"
            defaultMessage="Bill and emissions impact"
          />
        </h2>
        <p className="calculate-impact-section-description">
          <FormattedMessage
            id="energyCalculator.calculateImpact.results.description"
            defaultMessage="We calculated the impact estimates below based on your selected upgrade, the household info you shared, and other characteristics we found for this home."
          />
        </p>

        {/* Indented subsections */}
        <div className="calculate-impact-impact-indented">
          {/* Energy bill impact */}
          <div className="calculate-impact-impact-section">
            <h3 className="calculate-impact-impact-title">
              <FormattedMessage
                id="energyCalculator.calculateImpact.results.billImpact.title"
                defaultMessage="Energy bill impact"
              />
            </h3>
            <p className="calculate-impact-impact-description">
              {billMedian <= 0 ? (
                <FormattedMessage
                  id="energyCalculator.calculateImpact.results.billImpact.description.save"
                  defaultMessage="Our modeling shows that homes like yours will tend to save between {low} and {high} a year on their energy bills, with most homes saving at least {mostLikely}."
                  values={{ low: billRangeLow, high: billRangeHigh, mostLikely: billMostLikely }}
                />
              ) : (
                <FormattedMessage
                  id="energyCalculator.calculateImpact.results.billImpact.description.increase"
                  defaultMessage="Our modeling shows that homes like yours will tend to see energy bills increase between {low} and {high} a year, with most homes seeing increases of at least {mostLikely}."
                  values={{ low: billRangeLow, high: billRangeHigh, mostLikely: billMostLikely }}
                />
              )}
              {showAcDisclaimer && (
                <>
                  {' '}
                  <FormattedMessage
                    id="energyCalculator.calculateImpact.results.billImpact.however"
                    defaultMessage="However, your utility bill could increase if you are adding air conditioning to a home that did not have it before."
                  />
                </>
              )}
            </p>
            <ImpactRangeBar
              p20={billP20}
              median={billMedian}
              p80={billP80}
              formatValue={(n) => formatToUSD(n)}
              unitSuffix="/yr"
            />
          </div>

          {/* Emissions impact */}
          <div className="calculate-impact-impact-section">
            <h3 className="calculate-impact-impact-title">
              <FormattedMessage
                id="energyCalculator.calculateImpact.results.emissionsImpact.title"
                defaultMessage="Emissions impact"
              />
            </h3>
            <p className="calculate-impact-impact-description">
              {emMedian <= 0 ? (
                <FormattedMessage
                  id="energyCalculator.calculateImpact.results.emissionsImpact.description.reduction"
                  defaultMessage="Our modeling shows that homes like yours will tend to have annual emissions reductions between {low} and {high} lb CO₂e, with most homes reducing emissions by at least {mostLikely} lb."
                  values={{ low: emRangeLow, high: emRangeHigh, mostLikely: emMostLikely }}
                />
              ) : (
                <FormattedMessage
                  id="energyCalculator.calculateImpact.results.emissionsImpact.description.increase"
                  defaultMessage="Our modeling shows that homes like yours will tend to see annual emissions increases between {low} and {high} lb CO₂e, with most homes seeing increases of at least {mostLikely} lb."
                  values={{ low: emRangeLow, high: emRangeHigh, mostLikely: emMostLikely }}
                />
              )}
            </p>
            <ImpactRangeBar
              p20={emP20}
              median={emMedian}
              p80={emP80}
              formatValue={(n) => formatEmissionsLbs(n)}
              unitSuffix=" CO₂e/yr"
            />

            {/* EPA equivalencies */}
            <div className="calculate-impact-epa-section">
              <p className="calculate-impact-epa-intro">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.epa.intro"
                  defaultMessage="This is equivalent to carbon sequestered by:"
                />
              </p>
              <div className="calculate-impact-epa-chips">
                {equivalencies.map((eq) => (
                  <span key={eq.id} className="calculate-impact-epa-badge">
                    <ForestIcon className="calculate-impact-epa-badge-icon" />
                    <FormattedMessage
                      id={eq.labelMessageId}
                      defaultMessage={eq.labelDefaultMessage}
                      values={{ value: eq.value.toFixed(1) }}
                    />
                  </span>
                ))}
              </div>
              <p className="calculate-impact-epa-source">
                <FormattedMessage
                  id="energyCalculator.calculateImpact.epa.dataSourceLabel"
                  defaultMessage="Data source: {source}"
                  values={{
                    source: intl.formatMessage({
                      id: EPA_DATA_SOURCE_MESSAGE_ID,
                      defaultMessage: EPA_DATA_SOURCE_DEFAULT_MESSAGE,
                    }),
                  }}
                />
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
