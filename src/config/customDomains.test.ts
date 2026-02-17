import { handleCustomDomainRedirect } from './customDomains';

const originalLocation = window.location;

function mockLocation(overrides: Partial<Location>) {
  Object.defineProperty(window, 'location', {
    value: { ...originalLocation, ...overrides },
    writable: true,
  });
}

afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

describe('handleCustomDomainRedirect', () => {
  it('does not redirect for non-custom domains', () => {
    const replaceSpy = jest.fn();
    mockLocation({ hostname: 'localhost', pathname: '/', search: '', hash: '', replace: replaceSpy });

    handleCustomDomainRedirect();

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('redirects root path to white label base path', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/',
      search: '',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn');
  });

  it('redirects deep paths and preserves the path', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/some-path',
      search: '',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn/some-path');
  });

  it('preserves query params', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/',
      search: '?lang=es',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn?lang=es');
  });

  it('preserves hash fragments', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/some-path',
      search: '',
      hash: '#section',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn/some-path#section');
  });

  it('preserves both query params and hash', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/some-path',
      search: '?lang=es',
      hash: '#section',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn/some-path?lang=es#section');
  });

  it('does not redirect when already under the white label path', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/cesn/step-1',
      search: '',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('does not redirect when at the white label base path exactly', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/cesn',
      search: '',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('normalizes www prefix', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'www.energysavings.colorado.gov',
      pathname: '/',
      search: '',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn');
  });

  it('does not match paths that start with the white label but are not under it', () => {
    const replaceSpy = jest.fn();
    mockLocation({
      hostname: 'energysavings.colorado.gov',
      pathname: '/cesnextra',
      search: '',
      hash: '',
      replace: replaceSpy,
    });

    handleCustomDomainRedirect();

    expect(replaceSpy).toHaveBeenCalledWith('/cesn/cesnextra');
  });
});
