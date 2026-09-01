"use client";

import * as amplitude from "@amplitude/analytics-browser";

export const PRODUCT_EVENTS = [
  "landing_primary_cta_clicked",
  "sample_dashboard_opened",
  "technical_contract_opened",
  "meter_creation_started",
  "meter_created",
  "meter_creation_failed",
  "setup_opened",
  "dashboard_unlock_succeeded",
  "dashboard_unlock_failed",
  "customer_saved",
  "pricing_rule_saved",
  "rate_card_saved",
  "billing_run_closed",
  "stripe_connected",
  "stripe_drafts_created",
  "contact_submitted",
] as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[number];
type SafeValue = string | number | boolean;

const eventNames = new Set<string>(PRODUCT_EVENTS);
const safePropertyKeys = new Set(["environment", "mode", "outcome", "provider", "surface"]);
let initialized = false;

export function isProductEvent(value: string): value is ProductEvent {
  return eventNames.has(value);
}

export function analyticsSurface(pathname: string) {
  if (pathname === "/") return "landing";
  if (pathname === "/demo") return "demo";
  if (/^\/p\/[^/]+\/dashboard/.test(pathname)) return "dashboard";
  if (["/docs", "/api-reference", "/security", "/status", "/changelog", "/contact", "/how-it-works"].includes(pathname)) return "public_docs";
  return "other";
}

export function sanitizeAnalyticsProperties(properties: Record<string, SafeValue> = {}) {
  return Object.fromEntries(Object.entries(properties).filter(([key]) => safePropertyKeys.has(key)));
}

export function initializeProductAnalytics(apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "") {
  if (!apiKey || initialized) return false;
  amplitude.init(apiKey, {
    autocapture: {
      attribution: true,
      elementInteractions: false,
      fileDownloads: false,
      formInteractions: false,
      frustrationInteractions: false,
      networkTracking: false,
      pageViews: true,
      performanceTracking: false,
      sessions: true,
      webVitals: true,
    },
    trackingOptions: {
      ipAddress: false,
      language: true,
      platform: true,
    },
  });
  initialized = true;
  return true;
}

export function trackProductEvent(event: ProductEvent, properties: Record<string, SafeValue> = {}) {
  if (!initialized) return false;
  amplitude.track(event, sanitizeAnalyticsProperties(properties));
  return true;
}
