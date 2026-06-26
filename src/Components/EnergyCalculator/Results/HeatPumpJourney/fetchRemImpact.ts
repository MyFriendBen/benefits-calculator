import type { CalculateImpactRemAddressQuery, RemImpactApiResponse } from './remCalculateImpactTypes';

const domain = process.env.REACT_APP_DOMAIN_URL;

/**
 * Thrown when the REM API returns a 422 from our proxy, indicating the address
 * is unsupported. The backend maps the following REM error types to 422
 * (per docs.rewiringamerica.org/api/residential-electrification-model#get-by-address):
 *   multifamily_not_supported, building_type_not_supported,
 *   address_not_parsable, building_not_supported
 */
export class RemAddressNotSupportedError extends Error {
  constructor() {
    super('Address not supported');
    this.name = 'RemAddressNotSupportedError';
  }
}

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

  const res = await fetch(`${domain}/api/screener-options/${whiteLabel}/rem-impact/?${params.toString()}`);

  if (res.status === 422) {
    throw new RemAddressNotSupportedError();
  }
  if (!res.ok) {
    throw new Error(`REM API error: ${res.status}`);
  }

  return res.json() as Promise<RemImpactApiResponse>;
}
