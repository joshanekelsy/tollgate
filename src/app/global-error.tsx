"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <html lang="en"><body><main className="meter-failed"><div><p className="meter-kicker">Unexpected error</p><h1>This page did not load.</h1><p>No usage or billing record was changed. Retry the page.</p><button type="button" onClick={reset}>Try again</button></div></main></body></html>;
}
