import { renderHook } from '@testing-library/react';
import { useHttpsRedirect } from './useHttpsRedirect';

describe('useHttpsRedirect', () => {
  const originalLocation = window.location;
  let mockSessionStorage: { [key: string]: string } = {};

  beforeEach(() => {
    // Mock window.location
    delete (window as any).location;
    window.location = {
      protocol: 'http:',
      hostname: 'example.com',
    } as any;

    // Mock sessionStorage
    mockSessionStorage = {};
    Storage.prototype.getItem = jest.fn((key) => mockSessionStorage[key] || null);
    Storage.prototype.setItem = jest.fn((key, value) => {
      mockSessionStorage[key] = value;
    });
  });

  afterEach(() => {
    window.location = originalLocation;
    jest.restoreAllMocks();
  });

  it('should redirect to HTTPS when protocol is HTTP', () => {
    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).toHaveBeenCalledWith('https-redirect-attempted', 'true');
    expect(window.location.protocol).toBe('https');
  });

  it('should not redirect when already on HTTPS', () => {
    window.location = { protocol: 'https:', hostname: 'example.com' } as any;

    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
  });

  it('should not redirect on localhost', () => {
    window.location = { protocol: 'http:', hostname: 'localhost' } as any;

    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.protocol).toBe('http:');
  });

  it('should not redirect on 127.0.0.1', () => {
    window.location = { protocol: 'http:', hostname: '127.0.0.1' } as any;

    renderHook(() => useHttpsRedirect());

    expect(sessionStorage.setItem).not.toHaveBeenCalled();
    expect(window.location.protocol).toBe('http:');
  });

  it('should not redirect if already attempted this session', () => {
    mockSessionStorage['https-redirect-attempted'] = 'true';

    renderHook(() => useHttpsRedirect());

    // Should check sessionStorage but not set it again
    expect(sessionStorage.getItem).toHaveBeenCalledWith('https-redirect-attempted');
    expect(window.location.protocol).toBe('http:'); // Should not change
  });
});
