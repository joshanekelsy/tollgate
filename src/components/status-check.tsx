"use client";

import { useEffect, useState } from "react";

type Health = { ok: boolean; checkedAt: number; services: Array<{ name: string; status: "operational" | "degraded" }> };

export function StatusCheck() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json() as Health;
        setHealth(result);
        setFailed(!response.ok || !result.ok);
      })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, []);

  const services = health?.services ?? [
    { name: "Web application", status: failed ? "degraded" as const : "operational" as const },
    { name: "Metering datastore", status: failed ? "degraded" as const : "operational" as const },
  ];
  return <section className="status-ledger" aria-live="polite">
    <header data-status={failed ? "degraded" : health?.ok ? "operational" : "checking"}>
      <span>{failed ? "Degraded" : health?.ok ? "Operational" : "Checking"}</span>
      <strong>{failed ? "The live check did not pass." : health?.ok ? "All checked systems are responding." : "Running a live service check."}</strong>
    </header>
    {services.map((service) => <div key={service.name}><span>{service.name}</span><b data-status={failed ? "degraded" : service.status}>{failed ? "degraded" : service.status}</b></div>)}
    <p>{health ? `Last checked ${new Date(health.checkedAt).toLocaleString()}.` : "This page checks the web application and Convex datastore when it opens."}</p>
  </section>;
}
