import { getEpaEquivalencies } from './epaEquivalencies';

const LBS_PER_METRIC_TON = 2204.62;

describe('getEpaEquivalencies', () => {
  describe('forest_acres', () => {
    it('returns 1 acre for exactly 1 metric ton of CO₂e (2204.62 lb)', () => {
      const [result] = getEpaEquivalencies(-LBS_PER_METRIC_TON);
      expect(result.id).toBe('forest_acres');
      expect(result.value).toBeCloseTo(1.0, 4);
    });

    it('uses the absolute value so negative emissions (reductions) work correctly', () => {
      const [neg] = getEpaEquivalencies(-LBS_PER_METRIC_TON * 3);
      const [pos] = getEpaEquivalencies(LBS_PER_METRIC_TON * 3);
      expect(neg.value).toBeCloseTo(pos.value, 4);
    });

    it('returns 0 for zero emissions', () => {
      const [result] = getEpaEquivalencies(0);
      expect(result.value).toBe(0);
    });

    it('scales linearly', () => {
      const [single] = getEpaEquivalencies(-LBS_PER_METRIC_TON);
      const [double] = getEpaEquivalencies(-LBS_PER_METRIC_TON * 2);
      expect(double.value).toBeCloseTo(single.value * 2, 4);
    });

    it('includes the correct i18n message ID', () => {
      const [result] = getEpaEquivalencies(-1000);
      expect(result.labelMessageId).toBe('energyCalculator.calculateImpact.epa.forestAcres');
    });
  });

  it('returns one result per defined equivalency', () => {
    const results = getEpaEquivalencies(-5000);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => typeof r.value === 'number')).toBe(true);
  });
});
