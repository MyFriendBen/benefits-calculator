import { renderHook } from '@testing-library/react';
import { useHttpsRedirect } from './useHttpsRedirect';

describe('useHttpsRedirect', () => {
  let mockSessionStorage: { [key: string]: string } = {};
  let mockLocation: any;

  beforeEach(() => {
    // Mock window.location with a writable href property
    mockLocation = {
      protocol: 'http:',
      hostname: 'example.com',
      href: 'http://example.com/path?query=1#hash',
    };
    delete (window as any).location;
    (window as any).location = mockLocation;

    // Mock sessionStorage
    mockSessionStorage = {};
    Storage.prototype.getItem = jest.fn((key) => mockSessionStorage[key] || null);
    Storage.prototype.setItem = jest.fn((key, value) => {
      mockSessionStorage[key] = value;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should redirect to HTTPS when protocol is HTTP', () => {
    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).not.toHaveBeenCalled(); // Flag is only set on HTTPS
    expect(window.location.href).toBe('https://example.com/path?query=1#hash');
  });

  it('should not redirect when already on HTTPS', () => {
    mockLocation.protocol = 'https:';
    mockLocation.href = 'https://example.com/path';

    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).toHaveBeenCalledWith('https-redirect-attempted', 'true');
  });

  it('should not redirect on localhost', () => {
    mockLocation.hostname = 'localhost';
    mockLocation.href = 'http://localhost:3000/';

    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.protocol).toBe('http:');
  });

  it('should not redirect on 127.0.0.1', () => {
    mockLocation.hostname = '127.0.0.1';
    mockLocation.href = 'http://127.0.0.1:3000/';

    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.protocol).toBe('http:');
  });

  it('should not redirect if already attempted this session', () => {
    mockSessionStorage['https-redirect-attempted'] = 'true';

    renderHook(() => useHttpsRedirect());

    // Should check sessionStorage but not set it again
    expect(sessionStorage.getItem).toHaveBeenCalledWith('https-redirect-attempted');
    expect(window.location.href).toBe('http://example.com/path?query=1#hash'); // Should not change
  });

  it('should set flag when on HTTPS to prevent future redirects', () => {
    // Simulate the full redirect flow: HTTP -> HTTPS -> flag set
    mockLocation.protocol = 'https:';
    mockLocation.href = 'https://example.com/path';

    renderHook(() => useHttpsRedirect());

    // When on HTTPS, should set the flag
    expect(sessionStorage.setItem).toHaveBeenCalledWith('https-redirect-attempted', 'true');
  });

  it('should handle sessionStorage errors gracefully on HTTPS', () => {
    mockLocation.protocol = 'https:';
    mockLocation.href = 'https://example.com/path';
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('SecurityError');
    });

    // Should not throw
    expect(() => renderHook(() => useHttpsRedirect())).not.toThrow();
  });

  it('should handle sessionStorage errors gracefully on HTTP', () => {
    Storage.prototype.getItem = jest.fn(() => {
      throw new Error('SecurityError');
    });

    renderHook(() => useHttpsRedirect());

    // Should still redirect even if sessionStorage is unavailable
    expect(window.location.href).toBe('https://example.com/path?query=1#hash');
  });
});
