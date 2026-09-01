"use client";

import { useEffect } from "react";
import { analyticsSurface, initializeProductAnalytics, isProductEvent, trackProductEvent } from "@/lib/analytics";

export function Telemetry() {
  useEffect(() => {
    initializeProductAnalytics();
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>("[data-analytics-event]");
      const eventName = target?.dataset.analyticsEvent;
      if (!eventName || !isProductEvent(eventName)) return;
      trackProductEvent(eventName, { surface: analyticsSurface(window.location.pathname) });
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return null;
}
