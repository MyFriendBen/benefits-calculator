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

  it('calls the autocomplete proxy with the URL-encoded input', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ description: '123 Main St', place_id: 'abc' }],
    });
    global.fetch = mockFetch as unknown as typeof fetch;

    const result = await fetchAddressSuggestions('123 Main St & 1st Ave');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/api/places/autocomplete/?input=');
    // Special characters (space, ampersand) must be percent-encoded in the query string.
    expect(calledUrl).toContain('input=123+Main+St+%26+1st+Ave');
    expect(result).toEqual([{ description: '123 Main St', place_id: 'abc' }]);
  });

  it('throws when the proxy responds with a non-ok status', async () => {
    const mockFetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    global.fetch = mockFetch as unknown as typeof fetch;

    await expect(fetchAddressSuggestions('123 Main')).rejects.toThrow('Places API error: 500');
  });
});
