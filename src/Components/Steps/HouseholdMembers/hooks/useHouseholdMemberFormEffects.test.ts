import { renderHook, act } from '@testing-library/react';
import { useHouseholdMemberFormEffects } from './useHouseholdMemberFormEffects';
import { QUESTION_TITLES } from '../../../../Assets/pageTitleTags';
import { EMPTY_INCOME_STREAM } from '../utils/constants';

// ============================================================================
// Default params factory
// ============================================================================

const makeParams = (overrides: Partial<Parameters<typeof useHouseholdMemberFormEffects>[0]> = {}) => {
  const setValue = jest.fn();
  const getValues = jest.fn().mockReturnValue([]);
  const reset = jest.fn();
  const append = jest.fn();
  const replace = jest.fn();
  const calculateCurrentAgeStatus = jest.fn().mockReturnValue({ is16OrOlder: false, isUnder16: true });

  return {
    isEnergyCalculator: false,
    questionName: 'householdData' as const,
    pageNumber: 1,
    defaultValues: { birthMonth: 0, birthYear: '' },
    setValue,
    getValues,
    reset,
    append,
    replace,
    calculateCurrentAgeStatus,
    watchHasIncome: 'false',
    watchBirthMonth: 0,
    watchBirthYear: 0,
    watchIsStudent: false,
    watchIsDisabled: false,
    ...overrides,
    // Allow caller to override the mock fns themselves
    _mocks: { setValue, getValues, reset, append, replace, calculateCurrentAgeStatus },
  };
};

describe('useHouseholdMemberFormEffects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    document.title = '';
  });

  // ============================================================================
  // Page title effect
  // ============================================================================

  describe('page title', () => {
    it('sets document title from QUESTION_TITLES on mount', () => {
      const params = makeParams({ questionName: 'householdData' });
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(document.title).toBe(QUESTION_TITLES['householdData']);
    });

    it('updates title when questionName changes', () => {
      const params = makeParams({ questionName: 'householdData' });
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });
      const newParams = makeParams({ questionName: 'energyCalculatorHouseholdData' });
      rerender(newParams);
      expect(document.title).toBe(QUESTION_TITLES['energyCalculatorHouseholdData']);
    });
  });

  // ============================================================================
  // Income stream effects
  // ============================================================================

  describe('income stream management', () => {
    it('appends empty income stream when hasIncome becomes true with no streams', () => {
      const params = makeParams({ watchHasIncome: 'true' });
      params._mocks.getValues.mockReturnValue([]); // no streams
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(params._mocks.append).toHaveBeenCalledWith(EMPTY_INCOME_STREAM);
    });

    it('does not append when hasIncome is true but streams already exist', () => {
      const params = makeParams({ watchHasIncome: 'true' });
      params._mocks.getValues.mockReturnValue([EMPTY_INCOME_STREAM]); // already has one
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(params._mocks.append).not.toHaveBeenCalled();
    });

    it('clears income streams when hasIncome is false', () => {
      const params = makeParams({ watchHasIncome: 'false' });
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(params._mocks.replace).toHaveBeenCalledWith([]);
    });

    it('re-runs when hasIncome changes from false to true', () => {
      const params = makeParams({ watchHasIncome: 'false' });
      params._mocks.getValues.mockReturnValue([]);
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });

      const trueParams = makeParams({ watchHasIncome: 'true' });
      trueParams._mocks.getValues.mockReturnValue([]);
      act(() => rerender(trueParams));

      expect(trueParams._mocks.append).toHaveBeenCalledWith(EMPTY_INCOME_STREAM);
    });
  });

  // ============================================================================
  // Age-based income effect
  // ============================================================================

  describe('age-based income show/hide', () => {
    it('sets hasIncome to "true" when user turns 16 with no streams and hasIncome is not already true', () => {
      const params = makeParams({
        watchBirthMonth: 6,
        watchBirthYear: 2000,
      });
      params._mocks.calculateCurrentAgeStatus.mockReturnValue({ is16OrOlder: true, isUnder16: false });
      params._mocks.getValues
        .mockReturnValueOnce([]) // incomeStreams check in hasIncome effect
        .mockReturnValueOnce([]) // incomeStreams in age effect
        .mockReturnValueOnce('false'); // hasIncome value
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(params._mocks.setValue).toHaveBeenCalledWith('hasIncome', 'true', { shouldDirty: true });
    });

    it('sets hasIncome to "false" when member is under 16', () => {
      const params = makeParams({ watchBirthMonth: 1, watchBirthYear: 2020 });
      params._mocks.calculateCurrentAgeStatus.mockReturnValue({ is16OrOlder: false, isUnder16: true });
      params._mocks.getValues.mockReturnValue([]);
      // getValues for hasIncome returns 'true' to trigger the else branch
      params._mocks.getValues
        .mockReturnValueOnce([]) // incomeStreams for hasIncome effect
        .mockReturnValueOnce([]) // incomeStreams for age effect
        .mockReturnValueOnce('true'); // current hasIncome value
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(params._mocks.setValue).toHaveBeenCalledWith('hasIncome', 'false', { shouldDirty: true });
    });
  });

  // ============================================================================
  // Student eligibility reset (main workflow only)
  // ============================================================================

  describe('student eligibility reset', () => {
    it('resets student eligibility when student is deselected', () => {
      const params = makeParams({ watchIsStudent: true, isEnergyCalculator: false });
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });

      const deselectedParams = makeParams({ watchIsStudent: false, isEnergyCalculator: false });
      act(() => rerender(deselectedParams));

      expect(deselectedParams._mocks.setValue).toHaveBeenCalledWith(
        'studentEligibility',
        { studentFullTime: undefined, studentJobTrainingProgram: undefined, studentHasWorkStudy: undefined, studentWorks20PlusHrs: undefined },
        { shouldValidate: false }
      );
    });

    it('does not reset student eligibility when student is selected (only on deselect)', () => {
      const params = makeParams({ watchIsStudent: false, isEnergyCalculator: false });
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });

      const selectedParams = makeParams({ watchIsStudent: true, isEnergyCalculator: false });
      act(() => rerender(selectedParams));

      expect(selectedParams._mocks.setValue).not.toHaveBeenCalledWith(
        'studentEligibility',
        expect.anything(),
        expect.anything()
      );
    });

    it('does not reset student eligibility in energyCalculator workflow', () => {
      const params = makeParams({ watchIsStudent: true, isEnergyCalculator: true });
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });

      const deselectedParams = makeParams({ watchIsStudent: false, isEnergyCalculator: true });
      act(() => rerender(deselectedParams));

      expect(deselectedParams._mocks.setValue).not.toHaveBeenCalledWith('studentEligibility', expect.anything(), expect.anything());
    });
  });

  // ============================================================================
  // EC: receivesSsi reset when disabled unchecked
  // ============================================================================

  describe('EC receivesSsi reset', () => {
    it('resets receivesSsi to "false" when disabled becomes false in EC workflow', () => {
      const params = makeParams({ watchIsDisabled: false, isEnergyCalculator: true });
      params._mocks.getValues.mockImplementation((field: string) => {
        if (field === 'conditions.disabled') return false;
        return [];
      });
      renderHook(() => useHouseholdMemberFormEffects(params));
      expect(params._mocks.setValue).toHaveBeenCalledWith('receivesSsi', 'false');
    });

    it('does not reset receivesSsi in main workflow', () => {
      const params = makeParams({ watchIsDisabled: false, isEnergyCalculator: false });
      params._mocks.getValues.mockReturnValue([]);
      renderHook(() => useHouseholdMemberFormEffects(params));
      const receivesSsiCalls = params._mocks.setValue.mock.calls.filter(([field]: [string]) => field === 'receivesSsi');
      expect(receivesSsiCalls).toHaveLength(0);
    });
  });

  // ============================================================================
  // Page change: form reset
  // ============================================================================

  describe('page change reset', () => {
    it('resets form when pageNumber changes', () => {
      const params = makeParams({ pageNumber: 1, defaultValues: { birthMonth: 0 } });
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });

      const page2Params = makeParams({ pageNumber: 2, defaultValues: { birthMonth: 6 } });
      act(() => rerender(page2Params));

      expect(page2Params._mocks.reset).toHaveBeenCalledWith({ birthMonth: 6 });
    });

    it('does not reset form when pageNumber stays the same', () => {
      const params = makeParams({ pageNumber: 1 });
      const { rerender } = renderHook((p: any) => useHouseholdMemberFormEffects(p), { initialProps: params });

      const samePageParams = makeParams({ pageNumber: 1, watchBirthMonth: 6 });
      act(() => rerender(samePageParams));

      expect(samePageParams._mocks.reset).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // Return value
  // ============================================================================

  describe('return value', () => {
    it('returns hasTruthyIncome=true when watchHasIncome is "true"', () => {
      const params = makeParams({ watchHasIncome: 'true' });
      params._mocks.getValues.mockReturnValue([EMPTY_INCOME_STREAM]);
      const { result } = renderHook(() => useHouseholdMemberFormEffects(params));
      expect(result.current.hasTruthyIncome).toBe(true);
    });

    it('returns hasTruthyIncome=false when watchHasIncome is "false"', () => {
      const params = makeParams({ watchHasIncome: 'false' });
      const { result } = renderHook(() => useHouseholdMemberFormEffects(params));
      expect(result.current.hasTruthyIncome).toBe(false);
    });
  });
});
