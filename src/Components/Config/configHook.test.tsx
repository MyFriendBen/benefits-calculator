/**
 * Tests for configHook error handling
 *
 * These tests verify that transformation errors in transformConfigData
 * don't leave configResponse as undefined while configLoading is false,
 * which would cause downstream crashes in useConfig() calls without defaultValue.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useGetConfig, useFeatureFlag } from './configHook';
import { Context } from '../Wrapper/Wrapper';
import { WrapperContext } from '../../Types/WrapperContext';
import { PropsWithChildren } from 'react';
import { Config } from '../../Types/Config';

// Mock the API endpoint
jest.mock('../../apiCalls', () => ({
  configEndpoint: 'http://test-api/',
  header: { 'Content-Type': 'application/json' },
}));

// Mock fetch globally
global.fetch = jest.fn();

describe('useGetConfig - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear console mocks
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    (console.log as jest.Mock).mockRestore();
  });

  describe('Transformation Error Handling', () => {
    it('should set configResponse to empty object when JSON parsing fails', async () => {
      // Mock API response where json() throws an error (malformed JSON)
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const { result } = renderHook(() => useGetConfig(false, 'co'));

      // Wait for the hook to finish loading
      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      const { configLoading, configResponse } = result.current;

      // Critical assertion: Even after JSON parse error, config should be defined
      // This prevents downstream crashes in useConfig() without defaultValue
      expect(configLoading).toBe(false);
      expect(configResponse).toBeDefined();
      expect(configResponse).toEqual({});

      // Verify fallback was attempted
      expect(console.error).toHaveBeenCalled();
    });

    it('should set configResponse to empty object when data parsing throws in getConfig', async () => {
      // Mock response with data that will cause JSON.parse to throw
      // This error happens in getConfig's .then() handler, triggering the outer .catch()
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([
            {
              name: 'test_config',
              data: 'invalid json string that will break JSON.parse',
            },
          ]),
        })
        // Fallback to _default also fails
        .mockRejectedValueOnce(new Error('Default config unavailable'));

      const { result } = renderHook(() => useGetConfig(false, 'co'));

      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      const { configLoading, configResponse } = result.current;

      // Even with parsing errors, config should be safely set to empty object
      expect(configLoading).toBe(false);
      expect(configResponse).toBeDefined();
      expect(configResponse).toEqual({});

      // Verify errors were logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load config'),
        expect.any(Error)
      );
    });

    it('should set configResponse to empty object when fallback data parsing fails', async () => {
      // First call fails (primary white label)
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('404 Not Found'))
        // Second call has data that breaks JSON.parse in getConfig (fallback to _default)
        // This triggers the fallback's .catch() handler
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([
            {
              name: 'malformed_config',
              data: 'not valid json',
            },
          ]),
        });

      const { result } = renderHook(() => useGetConfig(false, 'invalid_label'));

      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      const { configLoading, configResponse } = result.current;

      // Even after fallback parsing error, should be safe
      expect(configLoading).toBe(false);
      expect(configResponse).toBeDefined();
      expect(configResponse).toEqual({});

      // Verify both errors were logged
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load config'),
        expect.any(Error)
      );
      expect(console.error).toHaveBeenCalledWith(
        'Failed to load default config:',
        expect.any(Error)
      );
    });

    it('should set configResponse to empty object when fallback JSON parsing fails', async () => {
      // First call fails
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('404 Not Found'))
        // Fallback json() throws
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.reject(new Error('Invalid JSON in fallback')),
        });

      const { result } = renderHook(() => useGetConfig(false, 'test_label'));

      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      const { configLoading, configResponse } = result.current;

      // Should be safe even when fallback completely fails
      expect(configLoading).toBe(false);
      expect(configResponse).toBeDefined();
      expect(configResponse).toEqual({});
    });
  });

  describe('Successful Config Loading', () => {
    it('should load valid config successfully', async () => {
      // Mock successful API response with valid config structure
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            name: 'option_translations',
            data: JSON.stringify({
              en: {
                label: 'Test Option',
                default_message: 'Test Message',
              },
            }),
          },
          {
            name: 'results_page_options',
            data: JSON.stringify({
              display_back_to_screener_button: true,
            }),
          },
        ]),
      });

      const { result } = renderHook(() => useGetConfig(false, 'co'));

      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      const { configLoading, configResponse } = result.current;

      expect(configLoading).toBe(false);
      expect(configResponse).toBeDefined();
      // Config should have properties from successful transformation
      expect(configResponse).toHaveProperty('option_translations');
    });
  });

  describe('Loading State Management', () => {
    it('should not load config when screenLoading is true', () => {
      const { result } = renderHook(() => useGetConfig(true, 'co'));

      const { configLoading, configResponse } = result.current;

      // Should stay in loading state
      expect(configLoading).toBe(true);
      expect(configResponse).toBeUndefined();

      // API should not be called
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should start with loading true and configResponse undefined', () => {
      // Mock fetch to return a pending promise
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result, unmount } = renderHook(() => useGetConfig(false, 'co'));

      const { configLoading, configResponse } = result.current;

      expect(configLoading).toBe(true);
      expect(configResponse).toBeUndefined();

      // Clean up to prevent memory leaks
      unmount();
    });
  });

  describe('Feature Flags Extraction', () => {
    it('should extract feature_flags from the API response into _feature_flags', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            name: 'test_config',
            data: JSON.stringify({ key: 'value' }),
            feature_flags: { eligibility_tags: true, nps_survey: false },
          },
        ]),
      });

      const { result } = renderHook(() => useGetConfig(false, 'co'));

      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      expect(result.current.configResponse?._feature_flags).toEqual({
        eligibility_tags: true,
        nps_survey: false,
      });
    });

    it('should handle missing feature_flags in API response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([
          {
            name: 'test_config',
            data: JSON.stringify({ key: 'value' }),
          },
        ]),
      });

      const { result } = renderHook(() => useGetConfig(false, 'co'));

      await waitFor(() => {
        expect(result.current.configLoading).toBe(false);
      });

      expect(result.current.configResponse?._feature_flags).toBeUndefined();
    });
  });
});

describe('useFeatureFlag', () => {
  const createWrapper = (config: Config | undefined) => {
    const contextValue = {
      config,
      configLoading: false,
      formData: {} as any,
      setFormData: jest.fn(),
      locale: 'en-us' as any,
      selectLanguage: jest.fn(),
      getReferrer: jest.fn(() => '') as any,
      theme: {} as any,
      setTheme: jest.fn(),
      styleOverride: undefined,
      stepLoading: false,
      setStepLoading: jest.fn(),
      pageIsLoading: false,
      setScreenLoading: jest.fn(),
      staffToken: undefined,
      setStaffToken: jest.fn(),
      whiteLabel: '',
      setWhiteLabel: jest.fn(),
    } as WrapperContext;

    return ({ children }: PropsWithChildren) => (
      <Context.Provider value={contextValue}>{children}</Context.Provider>
    );
  };

  it('should return true when feature flag is enabled', () => {
    const wrapper = createWrapper({ _feature_flags: { eligibility_tags: true } });
    const { result } = renderHook(() => useFeatureFlag('eligibility_tags'), { wrapper });
    expect(result.current).toBe(true);
  });

  it('should return false when feature flag is disabled', () => {
    const wrapper = createWrapper({ _feature_flags: { eligibility_tags: false } });
    const { result } = renderHook(() => useFeatureFlag('eligibility_tags'), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should return false when feature flag does not exist', () => {
    const wrapper = createWrapper({ _feature_flags: { nps_survey: true } });
    const { result } = renderHook(() => useFeatureFlag('eligibility_tags'), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should return false when _feature_flags is not present in config', () => {
    const wrapper = createWrapper({});
    const { result } = renderHook(() => useFeatureFlag('eligibility_tags'), { wrapper });
    expect(result.current).toBe(false);
  });

  it('should return false when config is undefined', () => {
    const wrapper = createWrapper(undefined);
    const { result } = renderHook(() => useFeatureFlag('eligibility_tags'), { wrapper });
    expect(result.current).toBe(false);
  });
});