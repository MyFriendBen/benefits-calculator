import { renderHook, waitFor } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';
import { useReferralOptions } from './useReferralOptions';
import { Context } from '../Components/Wrapper/Wrapper';
import { createMockContextValue } from '../test-utils/renderHelpers';

jest.mock('../apiCalls', () => ({
  getReferralOptions: jest.fn(),
}));

import { getReferralOptions } from '../apiCalls';

const mockGetReferralSources = getReferralOptions as jest.MockedFunction<typeof getReferralOptions>;

function wrapper({ children }: PropsWithChildren) {
  return React.createElement(
    Context.Provider,
    { value: createMockContextValue({ whiteLabel: 'co' }) },
    children,
  );
}

describe('useReferralOptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts with loading=true and empty options', () => {
    mockGetReferralSources.mockReturnValue(new Promise(() => {})); // never resolves

    const { result } = renderHook(() => useReferralOptions(), { wrapper });

    expect(result.current.loading).toBe(true);
    expect(result.current.referralOptions).toEqual({});
    expect(result.current.error).toBeNull();
  });

  it('populates referralOptions on success', async () => {
    const mockOptions = { friend: 'Friend / Family', other: 'Other' };
    mockGetReferralSources.mockResolvedValueOnce(mockOptions);

    const { result } = renderHook(() => useReferralOptions(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.referralOptions).toEqual(mockOptions);
    expect(result.current.error).toBeNull();
  });

  it('sets error and empty options on fetch failure', async () => {
    const fetchError = new Error('500 Internal Server Error');
    mockGetReferralSources.mockRejectedValueOnce(fetchError);

    const { result } = renderHook(() => useReferralOptions(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.referralOptions).toEqual({});
    expect(result.current.error).toBe(fetchError);
  });

  it('passes abort signal to getReferralOptions', () => {
    mockGetReferralSources.mockReturnValue(new Promise(() => {}));

    renderHook(() => useReferralOptions(), { wrapper });

    expect(mockGetReferralSources).toHaveBeenCalledWith('co', expect.any(AbortSignal));
  });

  it('aborts and re-fetches when whiteLabel changes', async () => {
    mockGetReferralSources.mockResolvedValue({ other: 'Other' });

    const contextValue = createMockContextValue({ whiteLabel: 'co' });
    let currentWhiteLabel = 'co';

    function dynamicWrapper({ children }: PropsWithChildren) {
      return React.createElement(
        Context.Provider,
        { value: { ...contextValue, whiteLabel: currentWhiteLabel } },
        children,
      );
    }

    const { rerender } = renderHook(() => useReferralOptions(), { wrapper: dynamicWrapper });

    await waitFor(() => expect(mockGetReferralSources).toHaveBeenCalledTimes(1));

    currentWhiteLabel = 'nc';
    rerender();

    await waitFor(() => expect(mockGetReferralSources).toHaveBeenCalledTimes(2));
    expect(mockGetReferralSources).toHaveBeenLastCalledWith('nc', expect.any(AbortSignal));
  });
});
