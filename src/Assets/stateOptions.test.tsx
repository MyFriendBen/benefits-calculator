import { renderHook } from '@testing-library/react';
import React from 'react';
import { StateOption, useStateOptions } from './stateOptions';
import { Context } from '../Components/Wrapper/Wrapper';
import { createMockContextValue } from '../test-utils/renderHelpers';

const CATALOG: StateOption[] = [
  { code: 'co', name: 'Colorado', public: true },
  { code: 'ks', name: 'Kansas', public: false },
  { code: 'mo', name: 'Missouri', public: false },
  { code: 'wa', name: 'Washington', public: true },
];

function makeWrapper(referrerCodes: string[] | undefined, catalog: unknown = CATALOG) {
  const contextValue = createMockContextValue({
    // null stands for a config that has not loaded, which leaves the key absent.
    config: (catalog === null ? {} : { state_options: catalog }) as any,
    getReferrer: ((key: string, defaultValue: unknown) =>
      key === 'stateOptions' ? referrerCodes ?? defaultValue : defaultValue) as any,
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(Context.Provider, { value: contextValue }, children);
}

function codesFrom(referrerCodes: string[] | undefined, catalog?: unknown) {
  const { result } = renderHook(() => useStateOptions(), { wrapper: makeWrapper(referrerCodes, catalog) });

  return result.current.map((state) => state.code);
}

describe('useStateOptions', () => {
  it('returns the public states when the referrer names none', () => {
    expect(codesFrom([])).toEqual(['co', 'wa']);
  });

  it('returns the public states when the referrer config is absent', () => {
    expect(codesFrom(undefined)).toEqual(['co', 'wa']);
  });

  it('returns the states the referrer names, including ones that are not public', () => {
    expect(codesFrom(['ks', 'mo'])).toEqual(['ks', 'mo']);
  });

  it('keeps the order the referrer config lists', () => {
    expect(codesFrom(['mo', 'ks'])).toEqual(['mo', 'ks']);
  });

  it('carries the display name from the catalog', () => {
    const { result } = renderHook(() => useStateOptions(), { wrapper: makeWrapper(['ks']) });

    expect(result.current).toEqual([{ code: 'ks', name: 'Kansas', public: false }]);
  });

  it('drops codes the catalog has no entry for', () => {
    expect(codesFrom(['ks', 'kansas'])).toEqual(['ks']);
  });

  it('drops catalog entries this build cannot route to', () => {
    const catalog = [...CATALOG, { code: 'pr', name: 'Puerto Rico', public: true }];

    expect(codesFrom([], catalog)).toEqual(['co', 'wa']);
    expect(codesFrom(['pr'], catalog)).toEqual(['co', 'wa']);
  });

  it('falls back to the public states when the referrer names nothing recognizable', () => {
    expect(codesFrom(['kansas'])).toEqual(['co', 'wa']);
  });

  describe('reporting an unresolved referrer config', () => {
    // The fallback serves the public list, which for a KS/MO referrer contains neither state, so
    // the mismatch has to reach us as something other than "the wrong states".
    beforeEach(() => {
      window.dataLayer = [];
    });

    function eventsFrom(referrerCodes: string[] | undefined, catalog?: unknown) {
      codesFrom(referrerCodes, catalog);

      return (window.dataLayer as Record<string, unknown>[]).filter(
        (entry) => entry.event === 'screener_state_options_unresolved',
      );
    }

    it('reports the named codes when none of them resolve', () => {
      expect(eventsFrom(['kansas'])).toEqual([
        expect.objectContaining({
          event: 'screener_state_options_unresolved',
          referrer_state_options: 'kansas',
        }),
      ]);
    });

    it('stays quiet when the referrer resolves', () => {
      expect(eventsFrom(['ks', 'mo'])).toEqual([]);
    });

    it('stays quiet when the referrer names no states at all', () => {
      expect(eventsFrom([])).toEqual([]);
      expect(eventsFrom(undefined)).toEqual([]);
    });
  });

  it('returns nothing when the catalog has not loaded', () => {
    expect(codesFrom([], null)).toEqual([]);
  });
});
