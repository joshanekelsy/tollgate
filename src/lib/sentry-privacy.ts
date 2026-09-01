type SentryLikeEvent = {
  breadcrumbs?: Array<{ data?: unknown; message?: string }>;
  exception?: { values?: Array<{ value?: string }> };
  extra?: unknown;
  logentry?: { message?: string; params?: unknown };
  message?: string;
  request?: {
    cookies?: unknown;
    data?: unknown;
    headers?: unknown;
    query_string?: unknown;
    url?: string;
  };
  user?: unknown;
};

const SECRET_PATTERNS = [
  /\b(?:tgw_(?:test|live)_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]+|rk_(?:test|live)_[A-Za-z0-9]+|whsec_[A-Za-z0-9]+)\b/g,
  /\b[A-Za-z0-9_-]{32}\b/g,
  /\b(?:authorization|x-api-key|x-goog-api-key|x-tollgate-key)\s*[:=]\s*[^\s,;]+/gi,
];

export function redactSecrets(value: string) {
  return SECRET_PATTERNS.reduce((text, pattern) => text.replace(pattern, "[redacted]"), value);
}

export function scrubSentryEvent<T extends SentryLikeEvent>(event: T): T {
  if (event.request) {
    event.request.headers = undefined;
    event.request.cookies = undefined;
    event.request.data = undefined;
    event.request.query_string = undefined;
    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        event.request.url = `${url.origin}${url.pathname}`;
      } catch {
        event.request.url = event.request.url.split("?")[0];
      }
    }
  }
  event.user = undefined;
  event.extra = undefined;
  event.breadcrumbs = event.breadcrumbs?.map((breadcrumb) => ({
    ...breadcrumb,
    data: undefined,
    message: breadcrumb.message ? redactSecrets(breadcrumb.message) : undefined,
  }));
  if (event.message) event.message = redactSecrets(event.message);
  if (event.logentry) {
    event.logentry.message = event.logentry.message ? redactSecrets(event.logentry.message) : undefined;
    event.logentry.params = undefined;
  }
  event.exception?.values?.forEach((exception) => {
    if (exception.value) exception.value = redactSecrets(exception.value);
  });
  return event;
}
