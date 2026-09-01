export type DashboardView = "overview" | "events" | "customers" | "pricing" | "billing" | "setup";
export type SetupProvider = "openai" | "anthropic" | "gemini" | "openrouter";

function cleanOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

export function dashboardPath(projectId: string, view?: DashboardView) {
  const path = `/p/${encodeURIComponent(projectId)}/dashboard`;
  return view ? `${path}?view=${view}` : path;
}

export function demoDashboardPath(view?: DashboardView) {
  return view ? `/demo?view=${view}` : "/demo";
}

export function dashboardUrl(origin: string, projectId: string, view?: DashboardView) {
  return `${cleanOrigin(origin)}${dashboardPath(projectId, view)}`;
}

export function proxyBaseUrl(origin: string, projectId: string) {
  return `${cleanOrigin(origin)}/p/${encodeURIComponent(projectId)}/v1`;
}

export function providerProxyBaseUrl(origin: string, projectId: string, provider: SetupProvider) {
  const root = `${cleanOrigin(origin)}/p/${encodeURIComponent(projectId)}/providers/${provider}`;
  if (provider === "openai") return `${root}/v1`;
  if (provider === "openrouter") return `${root}/api/v1`;
  return root;
}

export function providerProxyEndpoint(origin: string, projectId: string, provider: SetupProvider, model?: string) {
  const baseUrl = providerProxyBaseUrl(origin, projectId, provider);
  if (provider === "openai" || provider === "openrouter") return `${baseUrl}/chat/completions`;
  if (provider === "anthropic") return `${baseUrl}/v1/messages`;
  return `${baseUrl}/v1beta/models/${encodeURIComponent(model || "gemini-2.5-flash")}:generateContent`;
}
