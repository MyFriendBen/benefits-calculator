import { renderHook } from '@testing-library/react';
import React from 'react';
import { useStepDirectory } from './stepDirectory';
import { Context } from '../Components/Wrapper/Wrapper';
import { createMockContextValue } from '../test-utils/renderHelpers';
import type { QuestionName } from '../Types/Questions';

const BASE_STEPS: QuestionName[] = ['zipcode', 'householdData', 'referralSource', 'signUpInfo'];

function makeWrapper(overrides: Partial<ReturnType<typeof createMockContextValue>>) {
  const contextValue = createMockContextValue({
    ...overrides,
    getReferrer: (key: string) => {
      if (key === 'stepDirectory') return BASE_STEPS;
      return undefined as any;
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Context.Provider, { value: contextValue }, children);
}

describe('useStepDirectory', () => {
  it('includes referralSource when no immutableReferrer is set', () => {
    const { result } = renderHook(() => useStepDirectory(), {
      wrapper: makeWrapper({
        formData: { immutableReferrer: undefined } as any,
        referralOptions: { generic: { friend: 'Friend' }, partners: { dhs: 'Denver Human Services' } },
        referralOptionsLoading: false,
      }),
    });

    expect(result.current).toContain('referralSource');
  });

  it('skips referralSource when immutableReferrer is a recognized code', () => {
    const { result } = renderHook(() => useStepDirectory(), {
      wrapper: makeWrapper({
        formData: { immutableReferrer: 'dhs' } as any,
        referralOptions: { generic: { friend: 'Friend' }, partners: { dhs: 'Denver Human Services' } },
        referralOptionsLoading: false,
      }),
    });

    expect(result.current).not.toContain('referralSource');
  });

  it('includes referralSource when immutableReferrer is unrecognized', () => {
    const { result } = renderHook(() => useStepDirectory(), {
      wrapper: makeWrapper({
        formData: { immutableReferrer: 'unknowncode' } as any,
        referralOptions: { generic: { friend: 'Friend' }, partners: { dhs: 'Denver Human Services' } },
        referralOptionsLoading: false,
      }),
    });

    expect(result.current).toContain('referralSource');
  });

  it('includes referralSource while referral options are still loading', () => {
    const { result } = renderHook(() => useStepDirectory(), {
      wrapper: makeWrapper({
        formData: { immutableReferrer: 'dhs' } as any,
        referralOptions: { generic: {}, partners: {} },
        referralOptionsLoading: true,
      }),
    });

    expect(result.current).toContain('referralSource');
  });

  it('includes referralSource when referral options failed to load (empty options, not loading)', () => {
    const { result } = renderHook(() => useStepDirectory(), {
      wrapper: makeWrapper({
        formData: { immutableReferrer: 'dhs' } as any,
        referralOptions: { generic: {}, partners: {} },
        referralOptionsLoading: false,
      }),
    });

    expect(result.current).toContain('referralSource');
  });

  it('checks both generic and partner options when determining if referrer is recognized', () => {
    const genericWrapper = makeWrapper({
      formData: { immutableReferrer: 'friend' } as any,
      referralOptions: { generic: { friend: 'Friend / Family' }, partners: {} },
      referralOptionsLoading: false,
    });
    const { result: genericResult } = renderHook(() => useStepDirectory(), { wrapper: genericWrapper });
    expect(genericResult.current).not.toContain('referralSource');

    const partnerWrapper = makeWrapper({
      formData: { immutableReferrer: 'bia' } as any,
      referralOptions: { generic: {}, partners: { bia: 'Benefits in Action' } },
      referralOptionsLoading: false,
    });
    const { result: partnerResult } = renderHook(() => useStepDirectory(), { wrapper: partnerWrapper });
    expect(partnerResult.current).not.toContain('referralSource');
  });
});
