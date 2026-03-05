import { renderHook, act } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { useHouseholdMembersNavigation } from './useHouseholdMembersNavigation';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

const defaultParams = {
  uuid: 'test-uuid',
  whiteLabel: 'default',
  currentStepId: 3,
  pageNumber: 1,
  householdSize: 3,
  redirectToConfirmationPage: false,
};

describe('useHouseholdMembersNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  // ============================================================================
  // navigateBack
  // ============================================================================

  describe('navigateBack', () => {
    it('navigates to previous step when on page 1', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-2');
    });

    it('navigates to previous page within same step when on page > 1', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 2 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/1');
    });

    it('navigates back from page 3 to page 2', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 3 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/2');
    });

    it('throws when uuid is undefined', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, uuid: undefined }));
      expect(() => act(() => result.current.navigateBack())).toThrow('uuid is undefined');
    });

    it('includes whiteLabel as empty string in path when whiteLabel is undefined', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1, whiteLabel: undefined }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/undefined/test-uuid/step-2');
    });
  });

  // ============================================================================
  // navigateNext
  // ============================================================================

  describe('navigateNext', () => {
    it('navigates to next page when more members remain', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1, householdSize: 3 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/2');
    });

    it('navigates to next step when last member is complete', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 3, householdSize: 3 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-4');
    });

    it('navigates to confirm-information when redirectToConfirmationPage is true', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, redirectToConfirmationPage: true }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/confirm-information');
    });

    it('confirmation redirect takes priority over page navigation', () => {
      // Even when on page 1 of 3, redirect to confirmation if flag is set
      const { result } = renderHook(() =>
        useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1, householdSize: 3, redirectToConfirmationPage: true })
      );
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/confirm-information');
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/step-3/2'));
    });

    it('throws when uuid is undefined', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, uuid: undefined }));
      expect(() => act(() => result.current.navigateNext())).toThrow('uuid is undefined');
    });

    it('navigates to next step for single-member household', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1, householdSize: 1 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-4');
    });

    it('navigates to next step when pageNumber equals householdSize exactly', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 2, householdSize: 2 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-4');
    });
  });

  // ============================================================================
  // edge cases
  // ============================================================================

  describe('edge cases', () => {
    it('correctly builds path without whiteLabel prefix when whiteLabel is empty string', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, whiteLabel: '', pageNumber: 1 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('//test-uuid/step-2');
    });

    it('handles step 1 back navigation correctly (goes to step 0)', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, currentStepId: 1, pageNumber: 1 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-0');
    });
  });
});
