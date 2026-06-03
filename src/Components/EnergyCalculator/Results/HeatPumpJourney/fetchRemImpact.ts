import type { CalculateImpactRemAddressQuery, RemImpactApiResponse } from './remCalculateImpactTypes';

export async function fetchRemImpact(
  whiteLabel: string,
  query: CalculateImpactRemAddressQuery,
): Promise<RemImpactApiResponse> {
  const params = new URLSearchParams({
    upgrade: query.upgrade,
    address: query.address,
    heating_fuel: query.heating_fuel,
  });
  if (query.water_heater_fuel) {
    params.append('water_heater_fuel', query.water_heater_fuel);
  }

  const res = await fetch(`/api/screener-options/${whiteLabel}/rem-impact/?${params.toString()}`);

  if (!res.ok) {
    throw new Error(`REM API error: ${res.status}`);
  }

  return res.json() as Promise<RemImpactApiResponse>;
}
