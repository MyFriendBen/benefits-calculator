import { renderHook, waitFor, act } from '@testing-library/react';
import { useFormOptions, FormOptionsResponse } from './useFormOptions';

const sampleResponse: FormOptionsResponse = {
  condition_options: [{ value: 'housing', icon: 'house', text: { label: 'test.housing', default_message: 'Housing' } }],
  health_insurance_options: [],
};

// Mock fetch globally
global.fetch = jest.fn();

describe('useFormOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not fetch and resolves loading to false when whiteLabel is empty', async () => {
    const { result } = renderHook(() => useFormOptions(''));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.formOptions).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns form options and clears loading on a successful fetch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sampleResponse),
    });

    const { result } = renderHook(() => useFormOptions('co'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(result.current.formOptions).toEqual(sampleResponse);
    expect(result.current.error).toBeNull();
  });

  it('sets error and clears loading on a non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useFormOptions('co'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.formOptions).toBeNull();
  });

  it('aborts the in-flight request on unmount', () => {
    const abortSpy = jest.spyOn(AbortController.prototype, 'abort');
    // Never-resolving fetch so the success/error handlers do not run post-unmount.
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useFormOptions('co'));
    unmount();

    expect(abortSpy).toHaveBeenCalled();
    abortSpy.mockRestore();
  });

  it('swallows AbortError without setting error state', async () => {
    const abortError = Object.assign(new Error('aborted'), { name: 'AbortError' });
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    const { result } = renderHook(() => useFormOptions('co'));

    // Let the rejected fetch flush through the catch handler.
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.formOptions).toBeNull();
  });
});
