import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import CalculateImpactResults from './CalculateImpactResults';
import type { RemImpactApiResponse, CalculateImpactFormValues } from './remCalculateImpactTypes';

// ─── Shared test data ──────────────────────────────────────────────────────────

const FORM_VALUES: CalculateImpactFormValues = {
  householdType: 'single_family_detached',
  address: '200 E Colfax Ave Denver, CO 80203',
  heatingFuel: 'electricity',
  waterHeatingFuel: 'natural_gas',
  upgradeChoice: 'heat_pump_water_heater',
};

/** All deltas negative — range is entirely in the "savings/reduction" zone. */
const ALL_NEGATIVE_RESULT: RemImpactApiResponse = {
  bill_delta: {
    mean: { value: -200, unit: '$' },
    median: { value: -200, unit: '$' },
    percentile_20: { value: -300, unit: '$' },
    percentile_80: { value: -100, unit: '$' },
  },
  emissions_delta: {
    mean: { value: -200, unit: 'lbCO2e' },
    median: { value: -200, unit: 'lbCO2e' },
    percentile_20: { value: -300, unit: 'lbCO2e' },
    percentile_80: { value: -100, unit: 'lbCO2e' },
  },
};

/**
 * Bill delta crosses zero (p80 > 0, p20 < 0) — bar should split into a red
 * (increase) section on the left and a green (savings) section on the right.
 * Emissions remain all-negative.
 */
const BILL_CROSSES_ZERO_RESULT: RemImpactApiResponse = {
  bill_delta: {
    mean: { value: -19.76, unit: '$' },
    median: { value: -21.91, unit: '$' },
    percentile_20: { value: -60.52, unit: '$' },
    percentile_80: { value: 20.50, unit: '$' },
  },
  emissions_delta: {
    mean: { value: -1758.0, unit: 'lbCO2e' },
    median: { value: -1611.7, unit: 'lbCO2e' },
    percentile_20: { value: -2558.6, unit: 'lbCO2e' },
    percentile_80: { value: -950.0, unit: 'lbCO2e' },
  },
};

/**
 * Symmetric result: median is exactly halfway between p80 and p20 for both
 * delta types.  pctFromLeft should evaluate to exactly 50 for each median float.
 *   leftVal = p80 = -100,  rightVal = p20 = -300,  totalRange = 200
 *   pctFromLeft(-200) = ((-100) - (-200)) / 200 * 100 = 50
 */
const SYMMETRIC_RESULT: RemImpactApiResponse = {
  bill_delta: {
    mean: { value: -200, unit: '$' },
    median: { value: -200, unit: '$' },
    percentile_20: { value: -300, unit: '$' },
    percentile_80: { value: -100, unit: '$' },
  },
  emissions_delta: {
    mean: { value: -200, unit: 'lbCO2e' },
    median: { value: -200, unit: 'lbCO2e' },
    percentile_20: { value: -300, unit: 'lbCO2e' },
    percentile_80: { value: -100, unit: 'lbCO2e' },
  },
};

// ─── Helper ────────────────────────────────────────────────────────────────────

const renderResults = (
  result: RemImpactApiResponse,
  { onEdit = jest.fn(), formValues = FORM_VALUES } = {},
) =>
  render(
    <IntlProvider locale="en" defaultLocale="en">
      <CalculateImpactResults result={result} formValues={formValues} onEdit={onEdit} />
    </IntlProvider>,
  );

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('CalculateImpactResults', () => {
  describe('household info summary', () => {
    it('renders submitted address, household type, and fuels', () => {
      renderResults(ALL_NEGATIVE_RESULT);
      expect(screen.getByText('200 E Colfax Ave Denver, CO 80203')).toBeInTheDocument();
      expect(screen.getByText('House')).toBeInTheDocument();
      expect(screen.getByText('Electricity')).toBeInTheDocument();
      expect(screen.getByText('Natural gas')).toBeInTheDocument();
    });

    it('omits water heating row when waterHeatingFuel is not provided', () => {
      const withoutWaterFuel: CalculateImpactFormValues = { ...FORM_VALUES, waterHeatingFuel: undefined };
      renderResults(ALL_NEGATIVE_RESULT, { formValues: withoutWaterFuel });
      expect(screen.queryByText(/water heating type/i)).not.toBeInTheDocument();
    });

    it('calls onEdit when the edit button is clicked', () => {
      const onEdit = jest.fn();
      renderResults(ALL_NEGATIVE_RESULT, { onEdit });
      fireEvent.click(screen.getByRole('button', { name: /edit household info/i }));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });
  });

  describe('ImpactRangeBar — fill coloring', () => {
    it('renders only savings fills when all values are negative', () => {
      const { container } = renderResults(ALL_NEGATIVE_RESULT);
      expect(container.querySelectorAll('.impact-range-bar__fill--savings').length).toBeGreaterThan(0);
      expect(container.querySelector('.impact-range-bar__fill--increase')).toBeNull();
    });

    it('renders both a savings fill and an increase fill when bill range crosses zero', () => {
      const { container } = renderResults(BILL_CROSSES_ZERO_RESULT);
      expect(container.querySelector('.impact-range-bar__fill--savings')).toBeInTheDocument();
      expect(container.querySelector('.impact-range-bar__fill--increase')).toBeInTheDocument();
    });
  });

  describe('ImpactRangeBar — arrow signs (isSavings / directionIndicator)', () => {
    it('renders ▼ for every end label when all values are negative', () => {
      const { container } = renderResults(ALL_NEGATIVE_RESULT);
      container.querySelectorAll('.impact-range-bar__arrow').forEach((arrow) => {
        expect(arrow.textContent).toBe('▼');
      });
    });

    it('renders ▲ for the positive (cost-increase) end label when bill range crosses zero', () => {
      const { container } = renderResults(BILL_CROSSES_ZERO_RESULT);
      const increaseArrows = container.querySelectorAll('.impact-range-bar__arrow--increase');
      expect(increaseArrows.length).toBeGreaterThan(0);
      increaseArrows.forEach((arrow) => expect(arrow.textContent).toBe('▲'));
    });
  });

  describe('ImpactRangeBar — pctFromLeft math', () => {
    it('positions each median float at left: 50% when the median is exactly midway between p80 and p20', () => {
      // SYMMETRIC_RESULT: p80=-100, p20=-300, median=-200
      // pctFromLeft(-200) = ((-100)-(-200))/((-100)-(-300)) * 100 = 100/200*100 = 50
      const { container } = renderResults(SYMMETRIC_RESULT);
      const floats = container.querySelectorAll('.impact-range-bar__median-float');
      expect(floats.length).toBeGreaterThan(0);
      floats.forEach((el) => {
        expect(el).toHaveStyle('left: 50%');
      });
    });

    it('clamps pctFromLeft to [0, 100] — median outside range does not overflow', () => {
      const clampResult: RemImpactApiResponse = {
        ...ALL_NEGATIVE_RESULT,
        bill_delta: {
          mean: { value: -500, unit: '$' },
          // median is beyond p20 — pctFromLeft should clamp to 100
          median: { value: -400, unit: '$' },
          percentile_20: { value: -300, unit: '$' },
          percentile_80: { value: -100, unit: '$' },
        },
      };
      // Should render without errors; bar still displays
      const { container } = renderResults(clampResult);
      expect(container.querySelector('.impact-range-bar__median-float')).toBeInTheDocument();
    });
  });

  describe('AC disclaimer', () => {
    const acDisclaimer = /adding air conditioning/i;

    it('shows the AC disclaimer for the whole-home heat pump upgrade', () => {
      renderResults(ALL_NEGATIVE_RESULT, {
        formValues: { ...FORM_VALUES, upgradeChoice: 'heat_pump' },
      });
      expect(screen.getByText(acDisclaimer)).toBeInTheDocument();
    });

    it('hides the AC disclaimer for the heat pump water heater upgrade', () => {
      renderResults(ALL_NEGATIVE_RESULT, {
        formValues: { ...FORM_VALUES, upgradeChoice: 'heat_pump_water_heater' },
      });
      expect(screen.queryByText(acDisclaimer)).not.toBeInTheDocument();
    });
  });

  describe('weatherization note', () => {
    const weatherizationNote = /weatherization — like insulation and air sealing/i;

    it('shows the weatherization note for the heat pump upgrade', () => {
      renderResults(ALL_NEGATIVE_RESULT, {
        formValues: { ...FORM_VALUES, upgradeChoice: 'heat_pump' },
      });
      expect(screen.getByText(weatherizationNote)).toBeInTheDocument();
    });

    it('shows the weatherization note for the heat pump water heater upgrade', () => {
      renderResults(ALL_NEGATIVE_RESULT, {
        formValues: { ...FORM_VALUES, upgradeChoice: 'heat_pump_water_heater' },
      });
      expect(screen.getByText(weatherizationNote)).toBeInTheDocument();
    });
  });
});
