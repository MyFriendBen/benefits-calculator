import { renderHook } from '@testing-library/react';
import { usePageTracking } from './usePageTracking';
import { MemoryRouter } from 'react-router-dom';
import dataLayerPush from '../Assets/analytics';

// Mock the analytics module
jest.mock('../Assets/analytics', () => jest.fn());

describe('usePageTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children, path = '/test-path' }: { children: React.ReactNode; path?: string }) => (
    <MemoryRouter initialEntries={[path]}>
      {children}
    </MemoryRouter>
  );

  it('should track page change on mount', () => {
    renderHook(() => usePageTracking(), { wrapper: (props) => wrapper({ ...props, path: '/test-path?param=value' }) });

    expect(dataLayerPush).toHaveBeenCalledWith({
      event: 'Page Change',
      url: '/test-path?param=value',
    });
  });

  it('should include search params in tracked URL', () => {
    renderHook(() => usePageTracking(), { wrapper: (props) => wrapper({ ...props, path: '/another-path?foo=bar&baz=qux' }) });

    expect(dataLayerPush).toHaveBeenCalledWith({
      event: 'Page Change',
      url: '/another-path?foo=bar&baz=qux',
    });
  });

  it('should track URL without search params', () => {
    renderHook(() => usePageTracking(), { wrapper: (props) => wrapper({ ...props, path: '/simple-path' }) });

    expect(dataLayerPush).toHaveBeenCalledWith({
      event: 'Page Change',
      url: '/simple-path',
    });
  });
});
