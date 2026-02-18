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
  const STORAGE_KEY = 'experiment_override_npsVariant';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('returns null when not configured', () => {
    it('returns null when config is undefined', () => {
      const result = renderHook('npsVariant', 'seed-123');
      expect(result.current).toBeNull();
    });

    it('returns null when experiment is not in config', () => {
      const result = renderHook('npsVariant', 'seed-123', '/', {
        otherExperiment: { variants: ['a', 'b'] },
      });
      expect(result.current).toBeNull();
    });

    it('returns null when variants array is empty', () => {
      const result = renderHook('npsVariant', 'seed-123', '/', {
        npsVariant: { variants: [] },
      });
      expect(result.current).toBeNull();
    });

    it('returns null when no seed is provided', () => {
      const result = renderHook('npsVariant', undefined, '/', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      expect(result.current).toBeNull();
    });
  });

  describe('deterministic hash-based assignment', () => {
    it('assigns a variant from the configured list', () => {
      const result = renderHook('npsVariant', 'user-abc', '/', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      expect(['floating', 'inline']).toContain(result.current);
    });

    it('returns the same variant for the same seed', () => {
      const r1 = renderHook('npsVariant', 'stable-uuid', '/', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      const r2 = renderHook('npsVariant', 'stable-uuid', '/', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      expect(r1.current).toBe(r2.current);
    });

    it('can assign different variants to different seeds', () => {
      const variants = new Set<string | null>();

      for (let i = 0; i < 50; i++) {
        const result = renderHook('npsVariant', `uuid-${i}`, '/', {
          npsVariant: { variants: ['floating', 'inline'] },
        });
        variants.add(result.current);
      }

      expect(variants.has('floating')).toBe(true);
      expect(variants.has('inline')).toBe(true);
    });

    it('always returns the single variant when only one is configured', () => {
      const result = renderHook('npsVariant', 'any-seed', '/', {
        npsVariant: { variants: ['floating'] },
      });
      expect(result.current).toBe('floating');
    });
  });

  describe('URL parameter override', () => {
    it('returns URL param value over hash assignment', () => {
      const result = renderHook('npsVariant', 'seed-123', '/?npsVariant=inline', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      expect(result.current).toBe('inline');
    });

    it('accepts URL param even without backend config', () => {
      const result = renderHook('npsVariant', 'seed-123', '/?npsVariant=floating');
      expect(result.current).toBe('floating');
    });

    it('ignores URL param not in variants list', () => {
      const result = renderHook('npsVariant', 'seed-123', '/?npsVariant=invalid', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      // Falls through to hash assignment
      expect(['floating', 'inline']).toContain(result.current);
    });
  });

  describe('localStorage override', () => {
    it('returns localStorage value over hash assignment', () => {
      localStorage.setItem(STORAGE_KEY, 'inline');

      const result = renderHook('npsVariant', 'seed-123', '/', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      expect(result.current).toBe('inline');
    });

    it('ignores localStorage value not in variants list', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid');

      const result = renderHook('npsVariant', 'seed-123', '/', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      // Falls through to hash assignment
      expect(['floating', 'inline']).toContain(result.current);
    });

    it('URL param takes priority over localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'inline');

      const result = renderHook('npsVariant', 'seed-123', '/?npsVariant=floating', {
        npsVariant: { variants: ['floating', 'inline'] },
      });
      expect(result.current).toBe('floating');
    });
  });

  describe('helper functions', () => {
    it('setExperimentOverride stores value in localStorage', () => {
      setExperimentOverride('npsVariant', 'floating');
      expect(localStorage.getItem(STORAGE_KEY)).toBe('floating');
    });

    it('clearExperimentOverride removes value from localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'floating');
      clearExperimentOverride('npsVariant');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
