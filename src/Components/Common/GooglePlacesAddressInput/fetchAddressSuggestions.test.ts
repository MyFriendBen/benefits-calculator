import { fetchAddressSuggestions } from './fetchAddressSuggestions';

describe('fetchAddressSuggestions', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns an empty array for blank input without calling fetch', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;

    await expect(fetchAddressSuggestions('')).resolves.toEqual([]);
    await expect(fetchAddressSuggestions('   ')).resolves.toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('POSTs the input to the autocomplete proxy in a JSON body, not the URL', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ description: '123 Main St', place_id: 'abc' }],
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchAddressSuggestions('123 Main St & 1st Ave');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toMatch(/\/api\/places\/autocomplete\/$/);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ input: '123 Main St & 1st Ave' });
    expect(result).toEqual([{ description: '123 Main St', place_id: 'abc' }]);
  });

  it('throws when the proxy responds with a non-ok status', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;

    await expect(fetchAddressSuggestions('123 Main')).rejects.toThrow('Places API error: 500');
  });
});
