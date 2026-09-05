export async function dashboardJson<T extends object>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  let data: Partial<T> = {};
  try {
    const value: unknown = await response.json();
    if (value !== null && typeof value === "object" && !Array.isArray(value)) data = value as Partial<T>;
  } catch {
    // Some successful mutations have no body, and gateways may return plain text.
  }
  return { ok: response.ok, status: response.status, data };
}
