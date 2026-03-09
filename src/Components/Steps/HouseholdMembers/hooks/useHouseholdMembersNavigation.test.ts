import { renderHook, act } from '@testing-library/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useHouseholdMembersNavigation } from './useHouseholdMembersNavigation';

const mockNavigate = jest.fn();
const mockLocationState: Record<string, unknown> = {};

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(() => ({ state: mockLocationState })),
}));

// Default context: householdSize=3
const mockFormData = { householdSize: 3 };
jest.mock('react', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockContext = require('../../../Wrapper/Wrapper').Context;
  return {
    ...jest.requireActual('react'),
    useContext: (ctx: unknown) => {
      if (ctx === mockContext) return { formData: mockFormData };
      return jest.requireActual('react').useContext(ctx);
    },
  };
});

(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

const defaultParams = {
  uuid: 'test-uuid',
  whiteLabel: 'default',
  currentStepId: 3,
  pageNumber: 1,
  redirectToConfirmationPage: false,
};

describe('useHouseholdMembersNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useLocation as jest.Mock).mockReturnValue({ state: mockLocationState });
    mockFormData.householdSize = 3;
    Object.keys(mockLocationState).forEach((k) => delete mockLocationState[k]);
  });

  // ============================================================================
  // navigateBack
  // ============================================================================

  describe('navigateBack', () => {
    it('navigates to page 0 when on page 1 with householdSize > 1', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/0');
    });

    it('navigates to previous step when on page 1 with householdSize === 1', () => {
      mockFormData.householdSize = 1;
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

    it('logs error and does not navigate when uuid is undefined', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, uuid: undefined }));
      act(() => result.current.navigateBack());
      expect(consoleSpy).toHaveBeenCalledWith('UUID is undefined');
      expect(mockNavigate).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('includes whiteLabel in path when whiteLabel is undefined', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1, whiteLabel: undefined }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/undefined/test-uuid/step-3/0');
    });
  });

  // ============================================================================
  // navigateNext
  // ============================================================================

  describe('navigateNext', () => {
    it('navigates to next page when more members remain', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/2');
    });

    it('navigates to next step when last member is complete', () => {
      mockFormData.householdSize = 3;
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 3 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-4');
    });

    it('navigates to confirm-information when redirectToConfirmationPage is true', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, redirectToConfirmationPage: true }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/confirm-information');
    });

    it('confirmation redirect takes priority over page navigation', () => {
      const { result } = renderHook(() =>
        useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1, redirectToConfirmationPage: true })
      );
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/confirm-information');
      expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/step-3/2'));
    });

    it('logs error and does not navigate when uuid is undefined', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, uuid: undefined }));
      act(() => result.current.navigateNext());
      expect(consoleSpy).toHaveBeenCalledWith('UUID is undefined');
      expect(mockNavigate).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('navigates to next step for single-member household', () => {
      mockFormData.householdSize = 1;
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-4');
    });

    it('navigates to next step when pageNumber equals householdSize exactly', () => {
      mockFormData.householdSize = 2;
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 2 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-4');
    });

    it('returns to returnToPage when isEditing is set on location state', () => {
      mockLocationState.isEditing = true;
      mockLocationState.returnToPage = 3;
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, pageNumber: 1 }));
      act(() => result.current.navigateNext());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-3/3');
    });
  });

  // ============================================================================
  // edge cases
  // ============================================================================

  describe('edge cases', () => {
    it('correctly builds path without whiteLabel prefix when whiteLabel is empty string', () => {
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, whiteLabel: '', pageNumber: 2 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('//test-uuid/step-3/1');
    });

    it('handles step 1 back navigation correctly (goes to step 0) for single member', () => {
      mockFormData.householdSize = 1;
      const { result } = renderHook(() => useHouseholdMembersNavigation({ ...defaultParams, currentStepId: 1, pageNumber: 1 }));
      act(() => result.current.navigateBack());
      expect(mockNavigate).toHaveBeenCalledWith('/default/test-uuid/step-0');
    });
  });
});
