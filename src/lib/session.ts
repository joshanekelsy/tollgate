import { createHmac, timingSafeEqual } from "node:crypto";

const SESSION_MS = 12 * 60 * 60 * 1000;

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createDashboardSession(projectId: string, now: number, secret: string) {
  if (Buffer.byteLength(secret) < 32) throw new Error("Session secret must be at least 32 bytes");
  const payload = Buffer.from(JSON.stringify({ projectId, exp: now + SESSION_MS })).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

export function verifyDashboardSession(token: string, expectedProjectId: string, now: number, secret: string) {
  try {
    if (Buffer.byteLength(secret) < 32) return false;
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra) return false;
    const actual = Buffer.from(signature, "base64url");
    const expected = Buffer.from(sign(payload, secret), "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as { projectId?: string; exp?: number };
    return parsed.projectId === expectedProjectId && typeof parsed.exp === "number" && parsed.exp > now;
  } catch { return false; }
}

export function dashboardSessionCookie(token: string, requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `tollgate_dashboard_session=${token}; Path=/; Max-Age=43200; HttpOnly${secure}; SameSite=Strict`;
}

export function clearDashboardSessionCookie(requestUrl: string) {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  return `tollgate_dashboard_session=; Path=/; Max-Age=0; HttpOnly${secure}; SameSite=Strict`;
}
