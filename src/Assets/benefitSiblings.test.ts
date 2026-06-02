import { getBenefitSiblings, BENEFIT_SIBLING_GROUPS } from './benefitSiblings';

describe('getBenefitSiblings', () => {
  it('returns all variants for a key that is part of a sibling group', () => {
    expect(getBenefitSiblings('co_snap')).toEqual([
      'snap',
      'co_snap',
      'il_snap',
      'ma_snap',
      'nc_snap',
      'tx_snap',
      'cesn_snap',
      'wa_snap',
    ]);
  });

  it('returns the same group regardless of which variant in the group is queried', () => {
    expect(getBenefitSiblings('snap')).toEqual(getBenefitSiblings('cesn_snap'));
  });

  it('groups medicaid with its CESN variant', () => {
    expect(getBenefitSiblings('medicaid')).toEqual(['medicaid', 'cesn_medicaid']);
    expect(getBenefitSiblings('cesn_medicaid')).toEqual(getBenefitSiblings('medicaid'));
  });

  it('returns the single-key fallback for keys not in any group', () => {
    expect(getBenefitSiblings('lifeline')).toEqual(['lifeline']);
  });

  it('returns the single-key fallback for unknown keys', () => {
    expect(getBenefitSiblings('not_a_real_benefit')).toEqual(['not_a_real_benefit']);
  });

  it('exposes BENEFIT_SIBLING_GROUPS with no overlapping keys across groups', () => {
    const seen = new Set<string>();
    for (const group of BENEFIT_SIBLING_GROUPS) {
      for (const key of group) {
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
  });
});
