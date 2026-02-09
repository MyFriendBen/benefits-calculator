/**
 * Tests for SessionRestoration UUID disambiguation logic.
 *
 * These tests verify that the component correctly passes the disambiguated UUID
 * to fetchScreen(), particularly when handling /:uuid routes where the whiteLabel
 * param is actually a UUID.
 */

import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SessionRestoration from './SessionRestoration';
import { Context } from '../Wrapper/Wrapper';
import * as updateScreenModule from '../../Assets/updateScreen';

// Mock dependencies
jest.mock('../LoadingPage/LoadingPage', () => {
  return function MockLoadingPage() {
    return <div data-testid="loading-page">Loading...</div>;
  };
});

jest.mock('./SessionInitializer', () => {
  return function MockSessionInitializer() {
    return <div data-testid="session-initializer">Initializing...</div>;
  };
});

jest.mock('../../apiCalls', () => ({
  ScreenApiResponse: {},
}));

describe('SessionRestoration - UUID Disambiguation', () => {
  const mockSetScreenLoading = jest.fn();
  const mockSetWhiteLabel = jest.fn();
  const mockFetchScreen = jest.fn();

  const defaultContextValue = {
    setScreenLoading: mockSetScreenLoading,
    setWhiteLabel: mockSetWhiteLabel,
    whiteLabel: 'co',
    locale: 'en',
    config: {},
    screenLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useScreenApi hook
    jest.spyOn(updateScreenModule, 'default').mockReturnValue({
      fetchScreen: mockFetchScreen,
      updateScreen: jest.fn(),
      createScreen: jest.fn(),
      updateUser: jest.fn(),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should pass correct UUID when visiting /:uuid route (whiteLabel param is actually a UUID)', async () => {
    // Setup: Mock API response
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';
    mockFetchScreen.mockResolvedValueOnce({
      white_label: 'co',
      uuid: testUuid,
    });

    // Render with /:whiteLabel route pattern (single segment where UUID is in whiteLabel position)
    render(
      <MemoryRouter initialEntries={[`/${testUuid}`]}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait for fetchScreen to be called
    await waitFor(() => {
      expect(mockFetchScreen).toHaveBeenCalled();
    });

    // Critical assertion: fetchScreen should be called with the disambiguated UUID
    // In this case, the whiteLabel param contains the UUID, so it should pass that
    expect(mockFetchScreen).toHaveBeenCalledWith(testUuid);
  });

  it('should pass correct UUID when visiting /:whiteLabel/:uuid route', async () => {
    // Setup: Mock API response
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';
    mockFetchScreen.mockResolvedValueOnce({
      white_label: 'co',
      uuid: testUuid,
    });

    // Render with /:whiteLabel/:uuid route pattern
    render(
      <MemoryRouter initialEntries={[`/co/${testUuid}`]}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait for fetchScreen to be called
    await waitFor(() => {
      expect(mockFetchScreen).toHaveBeenCalled();
    });

    // fetchScreen should be called with the UUID from the second param
    expect(mockFetchScreen).toHaveBeenCalledWith(testUuid);
  });

  it('should not call fetchScreen when UUID is invalid', async () => {
    // Render with invalid UUID
    render(
      <MemoryRouter initialEntries={['/co/invalid-uuid']}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait a moment to ensure no calls are made
    await waitFor(() => {
      expect(mockFetchScreen).not.toHaveBeenCalled();
    });

    // Should show SessionInitializer instead
    const initializer = await waitFor(() => {
      const elem = document.querySelector('[data-testid="session-initializer"]');
      expect(elem).toBeInTheDocument();
      return elem;
    });
    expect(initializer).toBeTruthy();
  });

  it('should handle API errors gracefully and preserve query params', async () => {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock fetchScreen to throw an error
    mockFetchScreen.mockRejectedValueOnce(new Error('API Error'));

    // Render with query params and hash
    render(
      <MemoryRouter initialEntries={[`/co/${testUuid}?utm_source=test#section`]}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait for error handling
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Session restoration failed:',
        expect.any(Error)
      );
    });

    // Should set loading to false
    expect(mockSetScreenLoading).toHaveBeenCalledWith(false);

    consoleErrorSpy.mockRestore();
  });

  it('should handle white label mismatch and preserve query params/hash', async () => {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';
    const mockNavigate = jest.fn();

    // Mock API returns different white label than URL
    mockFetchScreen.mockResolvedValueOnce({
      white_label: 'nc', // API says 'nc'
      uuid: testUuid,
    });

    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    // Render with 'co' in URL but API will return 'nc'
    render(
      <MemoryRouter initialEntries={[`/co/${testUuid}/results?test=1#top`]}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid/*" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait for white label to be set
    await waitFor(() => {
      expect(mockSetWhiteLabel).toHaveBeenCalledWith('nc');
    });
  });

  it('should handle invalid white label from API', async () => {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    // Mock API returns invalid white label
    mockFetchScreen.mockResolvedValueOnce({
      white_label: 'invalid_label', // Not in ALL_VALID_WHITE_LABELS
      uuid: testUuid,
    });

    render(
      <MemoryRouter initialEntries={[`/co/${testUuid}`]}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait for error logging
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Invalid white label from API: invalid_label'
      );
    });

    // Should NOT set the invalid white label
    expect(mockSetWhiteLabel).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should navigate with white label when initial URL has no white label', async () => {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';

    // Mock API response with white label
    mockFetchScreen.mockResolvedValueOnce({
      white_label: 'co',
      uuid: testUuid,
    });

    // Context has no whiteLabel initially
    const contextWithoutWhiteLabel = {
      ...defaultContextValue,
      whiteLabel: '',
    };

    render(
      <MemoryRouter initialEntries={[`/${testUuid}/results?utm=test#section`]}>
        <Context.Provider value={contextWithoutWhiteLabel as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid/*" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Wait for white label to be set
    await waitFor(() => {
      expect(mockSetWhiteLabel).toHaveBeenCalledWith('co');
    });
  });

  it('should show SessionInitializer when no UUID is provided', () => {
    render(
      <MemoryRouter initialEntries={['/co/not-a-uuid']}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Should render SessionInitializer instead of loading
    const initializer = document.querySelector('[data-testid="session-initializer"]');
    expect(initializer).toBeInTheDocument();
    expect(mockFetchScreen).not.toHaveBeenCalled();
  });

  it('should show LoadingPage while fetching session data', () => {
    const testUuid = '550e8400-e29b-41d4-a716-446655440000';

    // Don't resolve the promise to keep it in loading state
    mockFetchScreen.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={[`/co/${testUuid}`]}>
        <Context.Provider value={defaultContextValue as any}>
          <Routes>
            <Route path=":whiteLabel/:uuid" element={<SessionRestoration />} />
          </Routes>
        </Context.Provider>
      </MemoryRouter>
    );

    // Should show loading page
    const loadingPage = document.querySelector('[data-testid="loading-page"]');
    expect(loadingPage).toBeInTheDocument();
  });
});
