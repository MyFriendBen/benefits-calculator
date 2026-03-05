import { backfillIncomeTypes, getDefaultFormItems, sortFrequencyOptions, calculateAge, formatToUSD, createHouseholdMemberData, scrollToFirstError } from './helpers';
import { FREQUENCY_ORDER } from './constants';
import { calcAge } from '../../../../Assets/age';

jest.mock('../../../../Assets/age', () => ({
  calcAge: jest.fn(),
}));

// Polyfill crypto.randomUUID for jsdom
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).slice(2),
    },
    writable: true,
  });
}

const mockCalcAge = jest.mocked(calcAge);

// ============================================================================
// getDefaultFormItems
// ============================================================================

describe('getDefaultFormItems', () => {
  const template = { incomeCategory: '', incomeStreamName: '', incomeAmount: '', incomeFrequency: '', hoursPerWeek: '' };

  it('returns existing items when they are present', () => {
    const existing = [template, template];
    expect(getDefaultFormItems(existing, false, true, template)).toBe(existing);
  });

  it('returns empty array when user has progressed and no existing items', () => {
    expect(getDefaultFormItems(undefined, true, true, template)).toEqual([]);
    expect(getDefaultFormItems([], true, true, template)).toEqual([]);
  });

  it('seeds one empty template for eligible first-time visitors (undefined = never visited)', () => {
    expect(getDefaultFormItems(undefined, false, true, template)).toEqual([template]);
  });

  it('seeds when existing is an empty array and user has not yet progressed (API returns [] for new member)', () => {
    // API returns [] for a brand-new member; without downstream progress this is a first visit, seed it
    expect(getDefaultFormItems([], false, true, template)).toEqual([template]);
  });

  it('returns empty array for ineligible first-time visitors', () => {
    expect(getDefaultFormItems(undefined, false, false, template)).toEqual([]);
  });

  it('existing items take priority over eligibility and progression', () => {
    const existing = [template];
    expect(getDefaultFormItems(existing, true, false, template)).toBe(existing);
  });

  it('does not seed when existing is an empty array and user has progressed', () => {
    // Empty array = user intentionally cleared; respect their choice
    expect(getDefaultFormItems([], true, true, template)).toEqual([]);
  });
});

// ============================================================================
// sortFrequencyOptions
// ============================================================================

describe('sortFrequencyOptions', () => {
  it('orders known frequencies per FREQUENCY_ORDER', () => {
    const input = {
      weekly: 'Weekly',
      once: 'One Time',
      monthly: 'Monthly',
    } as any;
    const result = sortFrequencyOptions(input);
    const keys = Object.keys(result);
    const orderedKnown = FREQUENCY_ORDER.filter(k => keys.includes(k));
    expect(keys.slice(0, orderedKnown.length)).toEqual(orderedKnown);
  });

  it('appends unknown frequencies at the end', () => {
    const input = { weekly: 'Weekly', custom: 'Custom', once: 'One Time' } as any;
    const result = sortFrequencyOptions(input);
    const keys = Object.keys(result);
    expect(keys[keys.length - 1]).toBe('custom');
  });

  it('omits frequencies not present in input', () => {
    const input = { monthly: 'Monthly' } as any;
    const result = sortFrequencyOptions(input);
    expect(Object.keys(result)).toEqual(['monthly']);
  });

  it('returns empty object for empty input', () => {
    expect(sortFrequencyOptions({})).toEqual({});
  });

  it('preserves values while reordering keys', () => {
    const input = { weekly: 'Wkly', monthly: 'Mnthly' } as any;
    const result = sortFrequencyOptions(input);
    expect(result['monthly']).toBe('Mnthly');
    expect(result['weekly']).toBe('Wkly');
  });
});

// ============================================================================
// calculateAge
// ============================================================================

describe('calculateAge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns null when birthYear is missing', () => {
    expect(calculateAge(undefined, 6)).toBeNull();
  });

  it('returns null when birthMonth is missing', () => {
    expect(calculateAge(1990, undefined)).toBeNull();
  });

  it('returns null when both are missing', () => {
    expect(calculateAge(undefined, undefined)).toBeNull();
  });

  it('delegates to calcAge with correct args', () => {
    mockCalcAge.mockReturnValue(35);
    const result = calculateAge(1990, 6);
    expect(mockCalcAge).toHaveBeenCalledWith({ birthYear: 1990, birthMonth: 6 });
    expect(result).toBe(35);
  });

  it('returns 0 when calcAge returns 0', () => {
    mockCalcAge.mockReturnValue(0);
    expect(calculateAge(2025, 1)).toBe(0);
  });
});

// ============================================================================
// formatToUSD
// ============================================================================

describe('formatToUSD', () => {
  it('formats a whole number correctly', () => {
    expect(formatToUSD(1000)).toBe('$1,000');
  });

  it('formats zero', () => {
    expect(formatToUSD(0)).toBe('$0');
  });

  it('formats decimals with 2 decimal places', () => {
    expect(formatToUSD(1000.99)).toBe('$1,000.99');
  });

  it('handles large numbers with commas', () => {
    expect(formatToUSD(1000000)).toBe('$1,000,000');
  });

  it('formats negative numbers', () => {
    expect(formatToUSD(-500)).toBe('-$500');
  });
});

// ============================================================================
// createHouseholdMemberData
// ============================================================================

describe('createHouseholdMemberData', () => {
  const existingMember = { id: 'existing-id', frontendId: 'existing-fid' } as any;

  const baseMemberData = {
    birthYear: 1990,
    birthMonth: 6,
    relationshipToHH: 'spouse',
    hasIncome: 'false',
    incomeStreams: [],
    conditions: {
      student: false,
      pregnant: false,
      disabled: false,
    },
    healthInsurance: { none: true },
  } as any;

  it('preserves existing id and frontendId', () => {
    const result = createHouseholdMemberData({
      memberData: baseMemberData,
      currentMemberIndex: 0,
      existingHouseholdData: [existingMember],
    });
    expect(result.id).toBe('existing-id');
    expect(result.frontendId).toBe('existing-fid');
  });

  it('generates new id and frontendId for new members', () => {
    const result = createHouseholdMemberData({
      memberData: baseMemberData,
      currentMemberIndex: 0,
      existingHouseholdData: [],
    });
    expect(result.id).toBeDefined();
    expect(result.frontendId).toBeDefined();
    expect(typeof result.id).toBe('string');
  });

  it('sets hasIncome true when income streams are present', () => {
    const result = createHouseholdMemberData({
      memberData: {
        ...baseMemberData,
        incomeStreams: [{ incomeCategory: 'employment', incomeStreamName: 'wages', incomeAmount: '1000', incomeFrequency: 'monthly', hoursPerWeek: '' }],
      },
      currentMemberIndex: 0,
      existingHouseholdData: [],
    });
    expect(result.hasIncome).toBe(true);
  });

  it('sets hasIncome false when no income streams', () => {
    const result = createHouseholdMemberData({
      memberData: { ...baseMemberData, incomeStreams: [] },
      currentMemberIndex: 0,
      existingHouseholdData: [],
    });
    expect(result.hasIncome).toBe(false);
  });

  it('defaults to empty array when incomeStreams is missing from memberData', () => {
    const { incomeStreams: _, ...dataWithoutStreams } = baseMemberData;
    const result = createHouseholdMemberData({
      memberData: dataWithoutStreams,
      currentMemberIndex: 0,
      existingHouseholdData: [],
    });
    expect(result.incomeStreams).toEqual([]);
  });

  describe('energyCalculator workflow', () => {
    const ecMemberData = {
      ...baseMemberData,
      conditions: {
        survivingSpouse: true,
        disabled: true,
        medicalEquipment: false,
      },
      receivesSsi: 'true' as 'true' | 'false',
    };

    it('builds energyCalculator sub-object from conditions', () => {
      const result = createHouseholdMemberData({
        memberData: ecMemberData,
        currentMemberIndex: 0,
        existingHouseholdData: [],
        workflowType: 'energyCalculator',
      }) as any;
      expect(result.energyCalculator).toEqual({
        survivingSpouse: true,
        receivesSsi: true,
        medicalEquipment: false,
      });
    });

    it('converts receivesSsi string "true" to boolean true', () => {
      const result = createHouseholdMemberData({
        memberData: { ...ecMemberData, receivesSsi: 'true' },
        currentMemberIndex: 0,
        existingHouseholdData: [],
        workflowType: 'energyCalculator',
      }) as any;
      expect(result.energyCalculator.receivesSsi).toBe(true);
    });

    it('converts receivesSsi string "false" to boolean false', () => {
      const result = createHouseholdMemberData({
        memberData: { ...ecMemberData, receivesSsi: 'false' },
        currentMemberIndex: 0,
        existingHouseholdData: [],
        workflowType: 'energyCalculator',
      }) as any;
      expect(result.energyCalculator.receivesSsi).toBe(false);
    });

    it('does not build energyCalculator sub-object for main workflow', () => {
      const result = createHouseholdMemberData({
        memberData: ecMemberData,
        currentMemberIndex: 0,
        existingHouseholdData: [],
        workflowType: 'main',
      }) as any;
      expect(result.energyCalculator).toBeUndefined();
    });

    it('defaults to main workflow when workflowType is omitted', () => {
      const result = createHouseholdMemberData({
        memberData: ecMemberData,
        currentMemberIndex: 0,
        existingHouseholdData: [],
      }) as any;
      expect(result.energyCalculator).toBeUndefined();
    });
  });
});

// ============================================================================
// scrollToFirstError
// ============================================================================

describe('scrollToFirstError', () => {
  const mockScrollIntoView = jest.fn();
  const mockWindowScroll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.scroll = mockWindowScroll;
  });

  it('scrolls to the first section with an error', () => {
    const el = document.createElement('div');
    el.scrollIntoView = mockScrollIntoView;
    jest.spyOn(document, 'getElementById').mockReturnValue(el);

    scrollToFirstError({ birthMonth: { message: 'required' } });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('falls back to window.scroll when no element is found', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    scrollToFirstError({ birthMonth: { message: 'required' } });

    expect(mockWindowScroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('falls back to window.scroll when no matching error key', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    scrollToFirstError({ unknownField: { message: 'error' } });

    expect(mockWindowScroll).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'smooth' });
  });

  it('uses EC error map for energyCalculator workflow', () => {
    const el = document.createElement('div');
    el.scrollIntoView = mockScrollIntoView;
    const getSpy = jest.spyOn(document, 'getElementById').mockReturnValue(el);

    scrollToFirstError({ receivesSsi: { message: 'required' } }, 'energyCalculator');

    // receivesSsi maps to conditions-section in EC map
    expect(getSpy).toHaveBeenCalledWith('conditions-section');
    expect(mockScrollIntoView).toHaveBeenCalled();
  });

  it('does not scroll to receivesSsi section in main workflow (not in main map)', () => {
    jest.spyOn(document, 'getElementById').mockReturnValue(null);

    scrollToFirstError({ receivesSsi: { message: 'required' } }, 'main');

    expect(mockWindowScroll).toHaveBeenCalled();
  });

  it('stops at first matching error and does not scroll multiple times', () => {
    const el = document.createElement('div');
    el.scrollIntoView = mockScrollIntoView;
    jest.spyOn(document, 'getElementById').mockReturnValue(el);

    scrollToFirstError({ birthMonth: { message: 'err' }, healthInsurance: { message: 'err' } });

    expect(mockScrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('scrolls to the specific income row when incomeStreams has an array error', () => {
    const rowEl = document.createElement('div');
    rowEl.scrollIntoView = mockScrollIntoView;
    // Row 0 has no error (null), row 1 has an error — should scroll to income-stream-1
    const getSpy = jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      return id === 'income-stream-1' ? rowEl : null;
    });

    scrollToFirstError({ incomeStreams: [null, { incomeStreamName: { message: 'required' } }] });

    expect(getSpy).toHaveBeenCalledWith('income-stream-1');
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('falls back to income-section when the specific income row element is not in the DOM', () => {
    const sectionEl = document.createElement('div');
    sectionEl.scrollIntoView = mockScrollIntoView;
    jest.spyOn(document, 'getElementById').mockImplementation((id) => {
      return id === 'income-section' ? sectionEl : null;
    });

    scrollToFirstError({ incomeStreams: [{ incomeCategory: { message: 'required' } }] });

    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});

// ============================================================================
// backfillIncomeTypes
// ============================================================================

describe('backfillIncomeTypes', () => {
  // FormattedMessageType is ReactElement; use `as any` so we can use plain strings in tests
  const incomeOptions = {
    employment: { wages: 'Wages', selfEmployed: 'Self-Employed' },
    benefits: { ssi: 'SSI', snap: 'SNAP' },
  } as any;

  it('returns undefined when memberData is undefined', () => {
    expect(backfillIncomeTypes(undefined, incomeOptions)).toBeUndefined();
  });

  it('returns undefined when incomeOptions is undefined (config not yet loaded)', () => {
    const memberData = { incomeStreams: [{ incomeCategory: '', incomeStreamName: 'wages', incomeAmount: 1000, incomeFrequency: 'monthly', hoursPerWeek: 0 }] } as any;
    expect(backfillIncomeTypes(memberData, undefined)).toBeUndefined();
  });

  it('returns undefined when incomeOptions is empty (config still loading — race condition guard)', () => {
    const memberData = { incomeStreams: [{ incomeCategory: '', incomeStreamName: 'wages', incomeAmount: 1000, incomeFrequency: 'monthly', hoursPerWeek: 0 }] } as any;
    expect(backfillIncomeTypes(memberData, {})).toBeUndefined();
  });

  it('derives incomeCategory from incomeStreamName for streams missing it', () => {
    const memberData = {
      incomeStreams: [{ incomeCategory: '', incomeStreamName: 'wages', incomeAmount: 1000, incomeFrequency: 'monthly', hoursPerWeek: 0 }],
    } as any;
    const result = backfillIncomeTypes(memberData, incomeOptions);
    expect(result?.incomeStreams[0].incomeCategory).toBe('employment');
  });

  it('leaves incomeCategory unchanged when already populated', () => {
    const memberData = {
      incomeStreams: [{ incomeCategory: 'benefits', incomeStreamName: 'ssi', incomeAmount: 500, incomeFrequency: 'monthly', hoursPerWeek: 0 }],
    } as any;
    const result = backfillIncomeTypes(memberData, incomeOptions);
    expect(result?.incomeStreams[0].incomeCategory).toBe('benefits');
  });

  it('leaves incomeCategory empty string when incomeStreamName is not found in any category', () => {
    const memberData = {
      incomeStreams: [{ incomeCategory: '', incomeStreamName: 'unknown_source', incomeAmount: 100, incomeFrequency: 'monthly', hoursPerWeek: 0 }],
    } as any;
    const result = backfillIncomeTypes(memberData, incomeOptions);
    expect(result?.incomeStreams[0].incomeCategory).toBe('');
  });

  it('handles members with no income streams', () => {
    const memberData = { incomeStreams: [] } as any;
    const result = backfillIncomeTypes(memberData, incomeOptions);
    expect(result?.incomeStreams).toEqual([]);
  });
});
