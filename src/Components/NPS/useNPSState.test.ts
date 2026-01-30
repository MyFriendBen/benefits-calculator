import { renderHook, act } from '@testing-library/react';
import { useNPSState } from './useNPSState';
import * as apiCalls from '../../apiCalls';

// Mock the API module
jest.mock('../../apiCalls', () => ({
  postNPSScore: jest.fn(),
}));

const mockPostNPSScore = apiCalls.postNPSScore as jest.MockedFunction<typeof apiCalls.postNPSScore>;

describe('useNPSState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostNPSScore.mockResolvedValue({ status: 'success' });
  });

  describe('initial state', () => {
    it('should have null selectedScore initially', () => {
      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));
      expect(result.current.selectedScore).toBeNull();
    });

    it('should have isSubmitted as false initially', () => {
      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));
      expect(result.current.isSubmitted).toBe(false);
    });
  });

  describe('submitScore', () => {
    it('should update selectedScore when submitting', () => {
      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.selectedScore).toBe(8);
    });

    it('should set isSubmitted to true when submitting', () => {
      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.isSubmitted).toBe(true);
    });

    it('should call postNPSScore with correct data', () => {
      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));

      act(() => {
        result.current.submitScore(9);
      });

      expect(mockPostNPSScore).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        score: 9,
        variant: 'floating',
      });
    });

    it('should call postNPSScore with inline variant', () => {
      const { result } = renderHook(() => useNPSState('inline', 'another-uuid'));

      act(() => {
        result.current.submitScore(7);
      });

      expect(mockPostNPSScore).toHaveBeenCalledWith({
        uuid: 'another-uuid',
        score: 7,
        variant: 'inline',
      });
    });

    it('should not call postNPSScore when uuid is undefined', () => {
      const { result } = renderHook(() => useNPSState('floating'));

      act(() => {
        result.current.submitScore(5);
      });

      expect(mockPostNPSScore).not.toHaveBeenCalled();
    });

    it('should still update state when uuid is undefined', () => {
      const { result } = renderHook(() => useNPSState('floating'));

      act(() => {
        result.current.submitScore(5);
      });

      expect(result.current.selectedScore).toBe(5);
      expect(result.current.isSubmitted).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPostNPSScore.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));

      act(() => {
        result.current.submitScore(8);
      });

      // State should still be updated even if API fails
      expect(result.current.selectedScore).toBe(8);
      expect(result.current.isSubmitted).toBe(true);

      // Wait for the promise to reject
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit NPS score:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not block UI when API call is slow', () => {
      // Make the API call never resolve
      mockPostNPSScore.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));

      act(() => {
        result.current.submitScore(8);
      });

      // UI state should update immediately regardless of API
      expect(result.current.selectedScore).toBe(8);
      expect(result.current.isSubmitted).toBe(true);
    });
  });

  describe('score values', () => {
    it('should accept score of 0', () => {
      const { result } = renderHook(() => useNPSState('floating', 'test-uuid'));

      act(() => {
        result.current.submitScore(0);
      });

      expect(result.current.selectedScore).toBe(0);
      expect(mockPostNPSScore).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        score: 0,
        variant: 'floating',
      });
    });

    it('should accept score of 10', () => {
      const { result } = renderHook(() => useNPSState('inline', 'test-uuid'));

      act(() => {
        result.current.submitScore(10);
      });

      expect(result.current.selectedScore).toBe(10);
      expect(mockPostNPSScore).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        score: 10,
        variant: 'inline',
      });
    });
  });
});
