import { render } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useExperiment, setExperimentOverride, clearExperimentOverride } from './useExperiment';
import { Context } from '../Components/Wrapper/Wrapper';
import { createMockContextValue } from '../test-utils/renderHelpers';

function renderHook(
  experimentName: string,
  seed: string | undefined,
  initialPath = '/',
  experiments?: Record<string, { variants: string[] }>,
) {
  const resultRef: { current: string | null } = { current: null };

  function TestComponent() {
    resultRef.current = useExperiment(experimentName, seed);
    return null;
  }

  render(
    React.createElement(
      MemoryRouter,
      { initialEntries: [initialPath] },
      React.createElement(
        Context.Provider,
        { value: createMockContextValue({ config: experiments ? ({ experiments } as any) : undefined }) },
        React.createElement(TestComponent),
      ),
    ),
  );

  return resultRef;
}

describe('useExperiment', () => {
  const STORAGE_KEY = 'experiment_override_testExperiment';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('returns null when not configured', () => {
    it('returns null when config is undefined', () => {
      const result = renderHook('testExperiment', 'seed-123');
      expect(result.current).toBeNull();
    });

    it('returns null when experiment is not in config', () => {
      const result = renderHook('testExperiment', 'seed-123', '/', {
        otherExperiment: { variants: ['a', 'b'] },
      });
      expect(result.current).toBeNull();
    });

    it('returns null when variants array is empty', () => {
      const result = renderHook('testExperiment', 'seed-123', '/', {
        testExperiment: { variants: [] },
      });
      expect(result.current).toBeNull();
    });

    it('returns null when no seed is provided', () => {
      const result = renderHook('testExperiment', undefined, '/', {
        testExperiment: { variants: ['A', 'B'] },
      });
      expect(result.current).toBeNull();
    });
  });

  describe('deterministic hash-based assignment', () => {
    it('assigns a variant from the configured list', () => {
      const result = renderHook('testExperiment', 'user-abc', '/', {
        testExperiment: { variants: ['A', 'B'] },
      });
      expect(['A', 'B']).toContain(result.current);
    });

    it('returns the same variant for the same seed', () => {
      const r1 = renderHook('testExperiment', 'stable-uuid', '/', {
        testExperiment: { variants: ['A', 'B'] },
      });
      const r2 = renderHook('testExperiment', 'stable-uuid', '/', {
        testExperiment: { variants: ['A', 'B'] },
      });
      expect(r1.current).toBe(r2.current);
    });

    it('can assign different variants to different seeds', () => {
      const variants = new Set<string | null>();

      for (let i = 0; i < 100; i++) {
        const result = renderHook('testExperiment', `uuid-${i}`, '/', {
          testExperiment: { variants: ['A', 'B'] },
        });
        variants.add(result.current);
      }

      expect(variants.has('A')).toBe(true);
      expect(variants.has('B')).toBe(true);
    });

    it('always returns the single variant when only one is configured', () => {
      const result = renderHook('testExperiment', 'any-seed', '/', {
        testExperiment: { variants: ['A'] },
      });
      expect(result.current).toBe('A');
    });
  });

  describe('URL parameter override', () => {
    it('returns URL param value over hash assignment', () => {
      const result = renderHook('testExperiment', 'seed-123', '/?testExperiment=B', {
        testExperiment: { variants: ['A', 'B'] },
      });
      expect(result.current).toBe('B');
    });

    it('accepts URL param even without backend config', () => {
      const result = renderHook('testExperiment', 'seed-123', '/?testExperiment=A');
      expect(result.current).toBe('A');
    });

    it('ignores URL param not in variants list', () => {
      const result = renderHook('testExperiment', 'seed-123', '/?testExperiment=invalid', {
        testExperiment: { variants: ['A', 'B'] },
      });
      // Falls through to hash assignment
      expect(['A', 'B']).toContain(result.current);
    });
  });

  describe('localStorage override', () => {
    it('returns localStorage value over hash assignment', () => {
      localStorage.setItem(STORAGE_KEY, 'B');

      const result = renderHook('testExperiment', 'seed-123', '/', {
        testExperiment: { variants: ['A', 'B'] },
      });
      expect(result.current).toBe('B');
    });

    it('ignores localStorage value not in variants list', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');

      const result = renderHook('testExperiment', 'seed-123', '/', {
        testExperiment: { variants: ['A', 'B'] },
      });
      // Falls through to hash assignment
      expect(['A', 'B']).toContain(result.current);
    });

    it('URL param takes priority over localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'B');

      const result = renderHook('testExperiment', 'seed-123', '/?testExperiment=A', {
        testExperiment: { variants: ['A', 'B'] },
      });
      expect(result.current).toBe('A');
    });
  });

  describe('helper functions', () => {
    it('setExperimentOverride stores value in localStorage', () => {
      setExperimentOverride('testExperiment', 'A');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('A');
    });

    it('clearExperimentOverride removes value from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'A');
      clearExperimentOverride('testExperiment');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
