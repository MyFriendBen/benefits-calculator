const domain = process.env.REACT_APP_DOMAIN_URL;

export interface AddressSuggestion {
  description: string;
  place_id: string;
}

export async function fetchAddressSuggestions(input: string): Promise<AddressSuggestion[]> {
  if (!input.trim()) return [];

  const params = new URLSearchParams({ input });
  const res = await fetch(`${domain}/api/places/autocomplete/?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`Places API error: ${res.status}`);
  }

  return res.json() as Promise<AddressSuggestion[]>;
}
