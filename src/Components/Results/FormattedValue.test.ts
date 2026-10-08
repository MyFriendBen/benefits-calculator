/**
 * The greeting total (MFB-2202) against the results-page summary it is derived from.
 *
 * MFB-2144 decided one-time lump sums stay in the summary and come out of Benji's
 * "worth about $X per year" — so the two must differ on exactly that, and agree on
 * everything else (override programs, caps).
 */
import { Program, ProgramCategory } from '../../Types/Results';
import { calculateGreetingTotal, calculateTotalValue } from './FormattedValue';
import { createProgram, createTranslation } from './testHelpers';

// Both value fields set: uncapped programs total `household_value` (via programValue),
// capped ones total `estimated_value`.
const program = (name: string, value: number, overrides: Partial<Program> = {}) =>
  createProgram({ name_abbreviated: name, household_value: value, estimated_value: value, members: [], ...overrides });

const category = (programs: Program[], overrides: Partial<ProgramCategory> = {}): ProgramCategory => ({
  external_name: 'test_category',
  icon: 'test',
  name: createTranslation('Test Category'),
  description: createTranslation(''),
  caps: [],
  tax_category: false,
  priority: null,
  programs,
  ...overrides,
});

describe('calculateGreetingTotal', () => {
  it('sums annual values across categories, tax credits included', () => {
    const total = calculateGreetingTotal([
      category([program('co_snap', 6636), program('co_wic', 1224)]),
      category([program('co_eitc', 500)], { tax_category: true }),
    ]);

    expect(total).toBe(8360);
  });

  it('leaves out one-time lump sums, which the summary keeps', () => {
    const housing = category([program('ks_wap', 7475, { value_format: 'lump_sum' }), program('ks_liheap', 600)]);

    expect(calculateGreetingTotal([housing])).toBe(600);
    expect(calculateTotalValue(housing)).toBe(8075);
  });

  it('counts annual and monthly formats', () => {
    const total = calculateGreetingTotal([
      category([program('mo_wap', 370, { value_format: 'estimated_annual' }), program('co_snap', 6636)]),
    ]);

    expect(total).toBe(7006);
  });

  it('leaves out override programs, as the summary does', () => {
    const housing = category([
      program('wa_wap', 7669, {
        value_format: 'lump_sum',
        estimated_value_override: createTranslation('Up to $7,669 per home'),
      }),
      program('tx_htw', 1200, { estimated_value_override: createTranslation('Varies based on services used') }),
      program('wa_snap', 3000),
    ]);

    expect(calculateGreetingTotal([housing])).toBe(3000);
    expect(calculateTotalValue(housing)).toBe(3000);
  });

  it('applies category caps, as the summary does', () => {
    const childCare = category([program('co_upk', 6000), program('co_head_start', 5000)], {
      caps: [{ programs: ['co_upk', 'co_head_start'], household_cap: 8000, member_caps: null }],
    });

    expect(calculateGreetingTotal([childCare])).toBe(8000);
  });

  it('is zero when every program is a lump sum or an override', () => {
    const total = calculateGreetingTotal([
      category([
        program('ks_wap', 7475, { value_format: 'lump_sum' }),
        program('tx_htw', 1200, { estimated_value_override: createTranslation('Varies') }),
      ]),
    ]);

    expect(total).toBe(0);
  });
});
