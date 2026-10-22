const domain = process.env.REACT_APP_DOMAIN_URL;

export interface AddressSuggestion {
  description: string;
  place_id: string;
}

export async function fetchAddressSuggestions(input: string): Promise<AddressSuggestion[]> {
  if (!input.trim()) return [];

  // POST, not a query string: request URLs are logged, and the input is a street address.
  const res = await fetch(`${domain}/api/places/autocomplete/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  if (!res.ok) {
    throw new Error(`Places API error: ${res.status}`);
  }

  return res.json() as Promise<AddressSuggestion[]>;
}
