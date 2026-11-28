const PRIVATE_KEYS = /^(password|passcode|token|secret|cookie|session|authorization|api[_-]?key|phone|email|address|location|ip|government[_-]?id|aadhaar|ssn|dob)$/i;

/** Removes credentials and direct contact details before data reaches the browser. */
export function redactForFrontend<T>(value: T): T {
  if (Array.isArray(value)) return value.map(redactForFrontend) as T;
  if (!value || typeof value !== "object") return value;

  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (PRIVATE_KEYS.test(key)) continue;
    output[key] = redactForFrontend(child);
  }
  return output as T;
}
