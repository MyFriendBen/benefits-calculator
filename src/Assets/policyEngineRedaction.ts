export function redactPolicyEngineData<T extends Record<string, any>>(data: T): T {
  const SENSITIVE_KEYS = new Set(['ssn', 'dob', 'date_of_birth', 'email', 'phone', 'address', 'street', 'zip', 'city']);
  const visit = (v: any): any => {
    if (Array.isArray(v)) return v.map(visit);
    if (v && typeof v === 'object') {
      return Object.fromEntries(
        Object.entries(v).map(([k, val]) => [k, SENSITIVE_KEYS.has(k.toLowerCase()) ? '***redacted***' : visit(val)]),
      );
    }
    return v;
  };
  return visit(data);
}
