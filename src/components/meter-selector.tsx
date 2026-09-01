"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { readRememberedMeters, rememberMeter, type RememberedMeter } from "@/lib/meter-memory";
import { dashboardPath, demoDashboardPath } from "@/lib/meter-links";

export function MeterSelector({ page }: { page: "settings" | "invoices" }) {
  const router = useRouter();
  const [meters, setMeters] = useState<RememberedMeter[]>([]);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<"idle" | "opening" | "error">("idle");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMeters(readRememberedMeters()));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function openRemembered(projectId: string) {
    router.replace(dashboardPath(projectId, page === "settings" ? "pricing" : "overview"));
  }

  async function openWithCode(event: FormEvent) {
    event.preventDefault();
    setStatus("opening");
    const response = await fetch("/meter/select", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (!response.ok) { setStatus("error"); return; }
    const meter = await response.json() as RememberedMeter;
    rememberMeter(meter);
    router.replace(dashboardPath(meter.projectId, page === "settings" ? "pricing" : "overview"));
  }

  return <main className="billing-shell billing-access">
    <section>
      <small>{page === "settings" ? "Pricing settings" : "Current-month invoices"}</small>
      <h1>{page === "settings" ? "Set the rule that turns usage into a price." : "See billable usage by customer."}</h1>
      {meters.length ? <div className="meter-list"><p>Your meters</p>{meters.map((meter) => <button className="tap-target" key={meter.projectId} type="button" onClick={() => openRemembered(meter.projectId)}><span>{meter.name}</span><small>{meter.projectId}</small></button>)}</div> : null}
      <form onSubmit={openWithCode}>
        <label htmlFor="meter-code">Meter access code</label>
        <input id="meter-code" value={code} onChange={(event) => setCode(event.target.value)} autoComplete="off" required />
        <button className="tap-target" disabled={status === "opening"}>{status === "opening" ? "Opening…" : "Open meter"}</button>
        {status === "error" ? <p role="alert">That access code was not recognised.</p> : null}
      </form>
      <footer><Link className="tap-target" href="/#get-started">Create a private meter</Link><Link className="tap-target" href={demoDashboardPath(page === "settings" ? "pricing" : "overview")}>See a sample</Link></footer>
    </section>
  </main>;
}
