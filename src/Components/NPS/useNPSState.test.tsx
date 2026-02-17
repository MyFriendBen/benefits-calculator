import { render, act } from '@testing-library/react';
import { useNPSState, NPSVariantType } from './useNPSState';
import * as apiCalls from '../../apiCalls';
import React from 'react';

jest.mock('../../apiCalls', () => ({
  postNPSScore: jest.fn(),
  patchNPSReason: jest.fn(),
}));

const mockPostNPSScore = apiCalls.postNPSScore as jest.MockedFunction<typeof apiCalls.postNPSScore>;
const mockPatchNPSReason = apiCalls.patchNPSReason as jest.MockedFunction<typeof apiCalls.patchNPSReason>;

type HookResult = ReturnType<typeof useNPSState>;

function renderHook(variant: NPSVariantType, uuid?: string) {
  const resultRef: { current: HookResult | null } = { current: null };

  function TestComponent() {
    resultRef.current = useNPSState(variant, uuid);
    return null;
  }

  render(<TestComponent />);
  return { result: resultRef as { current: HookResult } };
}

describe('useNPSState', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPostNPSScore.mockResolvedValue({ status: 'success' });
    mockPatchNPSReason.mockResolvedValue({ status: 'success' });
  });

  describe('initial state', () => {
    it('should have null selectedScore initially', () => {
      const { result } = renderHook('floating', 'test-uuid');
      expect(result.current.selectedScore).toBeNull();
    });

    it('should have isScoreSubmitted as false initially', () => {
      const { result } = renderHook('floating', 'test-uuid');
      expect(result.current.isScoreSubmitted).toBe(false);
    });

    it('should have isFullySubmitted as false initially', () => {
      const { result } = renderHook('floating', 'test-uuid');
      expect(result.current.isFullySubmitted).toBe(false);
    });

    it('should have empty reason initially', () => {
      const { result } = renderHook('floating', 'test-uuid');
      expect(result.current.reason).toBe('');
    });
  });

  describe('submitScore', () => {
    it('should update selectedScore when submitting', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.selectedScore).toBe(8);
    });

    it('should set isScoreSubmitted to true when submitting', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.isScoreSubmitted).toBe(true);
    });

    it('should not set isFullySubmitted when submitting score', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.isFullySubmitted).toBe(false);
    });

    it('should call postNPSScore with correct data', () => {
      const { result } = renderHook('floating', 'test-uuid');

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
      const { result } = renderHook('inline', 'another-uuid');

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
      const { result } = renderHook('floating');

      act(() => {
        result.current.submitScore(5);
      });

      expect(mockPostNPSScore).not.toHaveBeenCalled();
    });

    it('should still update state when uuid is undefined', () => {
      const { result } = renderHook('floating');

      act(() => {
        result.current.submitScore(5);
      });

      expect(result.current.selectedScore).toBe(5);
      expect(result.current.isScoreSubmitted).toBe(true);
    });

    it('should accept score of 1', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(1);
      });

      expect(result.current.selectedScore).toBe(1);
      expect(mockPostNPSScore).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        score: 1,
        variant: 'floating',
      });
    });

    it('should accept score of 10', () => {
      const { result } = renderHook('inline', 'test-uuid');

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

  describe('reason state', () => {
    it('should update reason via setReason', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.setReason('Great service!');
      });

      expect(result.current.reason).toBe('Great service!');
    });
  });

  describe('submitReason', () => {
    it('should set isFullySubmitted to true', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      act(() => {
        result.current.setReason('Great service!');
      });

      act(() => {
        result.current.submitReason();
      });

      expect(result.current.isFullySubmitted).toBe(true);
    });

    it('should call patchNPSReason with correct data', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      act(() => {
        result.current.setReason('Great service!');
      });

      act(() => {
        result.current.submitReason();
      });

      expect(mockPatchNPSReason).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        score_reason: 'Great service!',
      });
    });

    it('should trim whitespace from reason before sending', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.setReason('  Great service!  ');
      });

      act(() => {
        result.current.submitReason();
      });

      expect(mockPatchNPSReason).toHaveBeenCalledWith({
        uuid: 'test-uuid',
        score_reason: 'Great service!',
      });
    });

    it('should not call patchNPSReason when reason is empty', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitReason();
      });

      expect(mockPatchNPSReason).not.toHaveBeenCalled();
      expect(result.current.isFullySubmitted).toBe(true);
    });

    it('should not call patchNPSReason when reason is only whitespace', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.setReason('   ');
      });

      act(() => {
        result.current.submitReason();
      });

      expect(mockPatchNPSReason).not.toHaveBeenCalled();
      expect(result.current.isFullySubmitted).toBe(true);
    });

    it('should not call patchNPSReason when uuid is undefined', () => {
      const { result } = renderHook('floating');

      act(() => {
        result.current.setReason('Great service!');
      });

      act(() => {
        result.current.submitReason();
      });

      expect(mockPatchNPSReason).not.toHaveBeenCalled();
      expect(result.current.isFullySubmitted).toBe(true);
    });

    it('should handle PATCH API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPatchNPSReason.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.setReason('Great service!');
      });

      act(() => {
        result.current.submitReason();
      });

      expect(result.current.isFullySubmitted).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit NPS reason:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('skipReason', () => {
    it('should set isFullySubmitted to true', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.skipReason();
      });

      expect(result.current.isFullySubmitted).toBe(true);
    });

    it('should not call patchNPSReason', () => {
      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.skipReason();
      });

      expect(mockPatchNPSReason).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle POST API errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockPostNPSScore.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.selectedScore).toBe(8);
      expect(result.current.isScoreSubmitted).toBe(true);

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to submit NPS score:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not block UI when API call is slow', () => {
      mockPostNPSScore.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook('floating', 'test-uuid');

      act(() => {
        result.current.submitScore(8);
      });

      expect(result.current.selectedScore).toBe(8);
      expect(result.current.isScoreSubmitted).toBe(true);
    });
  });
});
