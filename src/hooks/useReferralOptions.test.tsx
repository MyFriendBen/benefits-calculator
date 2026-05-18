import { renderHook } from '@testing-library/react';
import React, { PropsWithChildren } from 'react';
import { useReferralOptions } from './useReferralOptions';
import { Context } from '../Components/Wrapper/Wrapper';
import { createMockContextValue } from '../test-utils/renderHelpers';

function wrapperFor(contextValue: ReturnType<typeof createMockContextValue>) {
  return function ReferralOptionsTestWrapper({ children }: PropsWithChildren) {
    return React.createElement(Context.Provider, { value: contextValue }, children);
  };
}

describe('useReferralOptions', () => {
  it('returns loading state from context', () => {
    const contextValue = createMockContextValue({
      referralOptionsLoading: true,
      referralOptions: { generic: { a: 'A' }, partners: {} },
    });

    const { result } = renderHook(() => useReferralOptions(), { wrapper: wrapperFor(contextValue) });

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('returns referral options and merged allOptions from context', () => {
    const referralOptions = {
      generic: { friend: 'Friend / Family' },
      partners: { bia: 'Benefits in Action' },
    };
    const contextValue = createMockContextValue({
      referralOptions,
      referralOptionsLoading: false,
    });

    const { result } = renderHook(() => useReferralOptions(), { wrapper: wrapperFor(contextValue) });

    expect(result.current.loading).toBe(false);
    expect(result.current.referralOptions).toEqual(referralOptions);
    expect(result.current.allOptions).toEqual({ friend: 'Friend / Family', bia: 'Benefits in Action' });
    expect(result.current.error).toBeNull();
  });

  it('returns error from context', () => {
    const fetchError = new Error('500 Internal Server Error');
    const contextValue = createMockContextValue({
      referralOptions: { generic: {}, partners: {} },
      referralOptionsLoading: false,
      referralOptionsError: fetchError,
    });

    const { result } = renderHook(() => useReferralOptions(), { wrapper: wrapperFor(contextValue) });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(fetchError);
  });
});
