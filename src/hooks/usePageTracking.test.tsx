import { renderHook } from '@testing-library/react';
import { usePageTracking } from './usePageTracking';
import { MemoryRouter } from 'react-router-dom';
import dataLayerPush from '../Assets/analytics';

// Mock the analytics module
jest.mock('../Assets/analytics', () => jest.fn());

describe('usePageTracking', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.location
    delete (window as any).location;
    window.location = { pathname: '/test-path', search: '?param=value' } as any;
  });

  afterEach(() => {
    window.location = originalLocation;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={['/test-path']}>
      {children}
    </MemoryRouter>
  );

  it('should track page change on mount', () => {
    renderHook(() => usePageTracking(), { wrapper });

    expect(dataLayerPush).toHaveBeenCalledWith({
      event: 'Page Change',
      url: '/test-path?param=value',
    });
  });

  it('should include search params in tracked URL', () => {
    window.location = { pathname: '/another-path', search: '?foo=bar&baz=qux' } as any;

    renderHook(() => usePageTracking(), { wrapper });

    expect(dataLayerPush).toHaveBeenCalledWith({
      event: 'Page Change',
      url: '/another-path?foo=bar&baz=qux',
    });
  });
});
