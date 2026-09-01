export type RememberedMeter = { projectId: string; name: string };
const KEY = "tollgate_meters";

export function readRememberedMeters(): RememberedMeter[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is RememberedMeter => Boolean(item && typeof item === "object" && "projectId" in item && "name" in item && typeof item.projectId === "string" && typeof item.name === "string")).slice(0, 10);
  } catch { return []; }
}

export function rememberMeter(meter: RememberedMeter) {
  if (typeof window === "undefined") return;
  const meters = [meter, ...readRememberedMeters().filter((item) => item.projectId !== meter.projectId)].slice(0, 10);
  window.localStorage.setItem(KEY, JSON.stringify(meters));
}
