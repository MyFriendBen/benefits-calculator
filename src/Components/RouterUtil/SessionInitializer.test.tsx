/**
 * Tests for SessionInitializer white label handling.
 *
 * These tests verify that the component correctly:
 * - Sets white label from props or URL params
 * - Validates white labels against allowed list
 * - Prioritizes props over URL params
 * - Triggers config loading by setting screenLoading to false
 */

import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SessionInitializer from './SessionInitializer';
import { Context } from '../Wrapper/Wrapper';
import { ALL_VALID_WHITE_LABELS } from '../../Types/WhiteLabel';

describe('SessionInitializer', () => {
  const mockSetWhiteLabel = jest.fn();
  const mockSetScreenLoading = jest.fn();

  const defaultContextValue = {
    setWhiteLabel: mockSetWhiteLabel,
    setScreenLoading: mockSetScreenLoading,
    whiteLabel: '',
    locale: 'en',
    config: {},
    screenLoading: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('White Label from Props', () => {
    it('should set white label from props when provided', () => {
      render(
        <MemoryRouter initialEntries={['/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <SessionInitializer whiteLabel="co" />
          </Context.Provider>
        </MemoryRouter>
      );

      expect(mockSetWhiteLabel).toHaveBeenCalledWith('co');
      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
    });

    it('should not set invalid white label from props', () => {
      render(
        <MemoryRouter initialEntries={['/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <SessionInitializer whiteLabel="invalid_label" />
          </Context.Provider>
        </MemoryRouter>
      );

      // Should not call setWhiteLabel with invalid value
      expect(mockSetWhiteLabel).not.toHaveBeenCalled();
      // Should still trigger config loading
      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
    });

    it('should prioritize props over URL params', () => {
      render(
        <MemoryRouter initialEntries={['/nc/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <Routes>
              <Route path=":whiteLabel/*" element={<SessionInitializer whiteLabel="co" />} />
            </Routes>
          </Context.Provider>
        </MemoryRouter>
      );

      // Should use 'co' from props, not 'nc' from URL
      expect(mockSetWhiteLabel).toHaveBeenCalledWith('co');
      expect(mockSetWhiteLabel).not.toHaveBeenCalledWith('nc');
    });
  });

  describe('White Label from URL Params', () => {
    it('should set white label from URL params when no prop provided', () => {
      render(
        <MemoryRouter initialEntries={['/co/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <Routes>
              <Route path=":whiteLabel/*" element={<SessionInitializer />} />
            </Routes>
          </Context.Provider>
        </MemoryRouter>
      );

      expect(mockSetWhiteLabel).toHaveBeenCalledWith('co');
      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
    });

    it('should not set invalid white label from URL params', () => {
      render(
        <MemoryRouter initialEntries={['/invalid_label/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <Routes>
              <Route path=":whiteLabel/*" element={<SessionInitializer />} />
            </Routes>
          </Context.Provider>
        </MemoryRouter>
      );

      // Should not call setWhiteLabel with invalid value
      expect(mockSetWhiteLabel).not.toHaveBeenCalled();
      // Should still trigger config loading
      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
    });

    it('should handle all valid white labels from URL', () => {
      ALL_VALID_WHITE_LABELS.forEach((label) => {
        jest.clearAllMocks();

        render(
          <MemoryRouter initialEntries={[`/${label}/some-path`]}>
            <Context.Provider value={defaultContextValue as any}>
              <Routes>
                <Route path=":whiteLabel/*" element={<SessionInitializer />} />
              </Routes>
            </Context.Provider>
          </MemoryRouter>
        );

        expect(mockSetWhiteLabel).toHaveBeenCalledWith(label);
      });
    });
  });

  describe('Screen Loading Trigger', () => {
    it('should always set screenLoading to false to trigger config load', () => {
      render(
        <MemoryRouter initialEntries={['/co/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <Routes>
              <Route path=":whiteLabel/*" element={<SessionInitializer />} />
            </Routes>
          </Context.Provider>
        </MemoryRouter>
      );

      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
    });

    it('should set screenLoading to false even when white label is invalid', () => {
      render(
        <MemoryRouter initialEntries={['/invalid/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <Routes>
              <Route path=":whiteLabel/*" element={<SessionInitializer />} />
            </Routes>
          </Context.Provider>
        </MemoryRouter>
      );

      // Even with invalid white label, should trigger config load
      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
    });

    it('should set screenLoading to false when no white label is provided', () => {
      render(
        <MemoryRouter initialEntries={['/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <SessionInitializer />
          </Context.Provider>
        </MemoryRouter>
      );

      // Should still trigger config loading
      expect(mockSetScreenLoading).toHaveBeenCalledWith(false);
      expect(mockSetWhiteLabel).not.toHaveBeenCalled();
    });
  });

  describe('Rendering Behavior', () => {
    it('should render Outlet for child routes', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/co/child-route']}>
          <Context.Provider value={defaultContextValue as any}>
            <Routes>
              <Route path=":whiteLabel/*" element={<SessionInitializer whiteLabel="co" />}>
                <Route path="child-route" element={<div data-testid="child">Child Route</div>} />
              </Route>
            </Routes>
          </Context.Provider>
        </MemoryRouter>
      );

      // Should render child routes via Outlet
      const child = container.querySelector('[data-testid="child"]');
      expect(child).toBeInTheDocument();
      expect(child?.textContent).toBe('Child Route');
    });
  });

  describe('Effect Dependencies', () => {
    it('should re-run effect when white label changes', () => {
      const { rerender } = render(
        <MemoryRouter initialEntries={['/co/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <SessionInitializer whiteLabel="co" />
          </Context.Provider>
        </MemoryRouter>
      );

      expect(mockSetWhiteLabel).toHaveBeenCalledTimes(1);
      expect(mockSetWhiteLabel).toHaveBeenCalledWith('co');

      jest.clearAllMocks();

      // Re-render with different white label
      rerender(
        <MemoryRouter initialEntries={['/nc/some-path']}>
          <Context.Provider value={defaultContextValue as any}>
            <SessionInitializer whiteLabel="nc" />
          </Context.Provider>
        </MemoryRouter>
      );

      expect(mockSetWhiteLabel).toHaveBeenCalledTimes(1);
      expect(mockSetWhiteLabel).toHaveBeenCalledWith('nc');
    });
  });
});
