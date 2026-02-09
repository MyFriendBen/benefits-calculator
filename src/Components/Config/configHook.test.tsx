/**
 * Tests for configHook error handling
 *
 * These tests verify that transformation errors in transformConfigData
 * don't leave configResponse as undefined while configLoading is false,
 * which would cause downstream crashes in useConfig() calls without defaultValue.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useGetConfig } from './configHook';

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
      // Don't resolve the fetch to keep it in loading state
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useGetConfig(false, 'co'));

      const { configLoading, configResponse } = result.current;

      expect(configLoading).toBe(true);
      expect(configResponse).toBeUndefined();
    });
  });
});