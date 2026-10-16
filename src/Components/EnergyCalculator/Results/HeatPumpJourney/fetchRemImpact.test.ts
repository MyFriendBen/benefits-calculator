import { fetchRemImpact, RemAddressNotSupportedError } from './fetchRemImpact';
import type { CalculateImpactRemAddressQuery } from './remCalculateImpactTypes';

const QUERY: CalculateImpactRemAddressQuery = {
  upgrade: 'water_heater__heat_pump_uef3.35',
  address: '742 Invented Lane, Nowhere, CO 80000',
  heating_fuel: 'natural_gas',
  water_heater_fuel: null,
};

describe('fetchRemImpact', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  const mockFetchWith = (response: Partial<Response>): jest.Mock => {
    const mockFetch = jest.fn().mockResolvedValue(response);
    global.fetch = mockFetch as unknown as typeof fetch;
    return mockFetch;
  };

  it('POSTs the query in a JSON body and keeps the address out of the URL', async () => {
    const mockFetch = mockFetchWith({ ok: true, status: 200, json: async () => ({ ok: 1 }) });

    await fetchRemImpact('cesn', QUERY);

    const [calledUrl, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toMatch(/\/api\/screener-options\/cesn\/rem-impact\/$/);
    expect(calledUrl).not.toContain('Invented');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({
      upgrade: 'water_heater__heat_pump_uef3.35',
      address: '742 Invented Lane, Nowhere, CO 80000',
      heating_fuel: 'natural_gas',
    });
  });

  it('includes water_heater_fuel when set', async () => {
    const mockFetch = mockFetchWith({ ok: true, status: 200, json: async () => ({}) });

    await fetchRemImpact('cesn', { ...QUERY, water_heater_fuel: 'electricity' });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).water_heater_fuel).toBe('electricity');
  });

  it('throws RemAddressNotSupportedError on 422', async () => {
    mockFetchWith({ ok: false, status: 422, json: async () => ({}) });

    await expect(fetchRemImpact('cesn', QUERY)).rejects.toBeInstanceOf(RemAddressNotSupportedError);
  });

  it('throws on other non-ok statuses', async () => {
    mockFetchWith({ ok: false, status: 502, json: async () => ({}) });

    await expect(fetchRemImpact('cesn', QUERY)).rejects.toThrow('REM API error: 502');
  });
});
