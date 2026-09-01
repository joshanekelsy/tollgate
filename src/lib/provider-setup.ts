import { providerProxyBaseUrl, providerProxyEndpoint, type SetupProvider } from "./meter-links";

export type SetupLanguage = "javascript" | "python" | "curl";

export const PROVIDER_SETUP_OPTIONS: Array<{ id: SetupProvider; label: string }> = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "gemini", label: "Gemini" },
  { id: "openrouter", label: "OpenRouter" },
];

const EXAMPLE_MODELS: Record<SetupProvider, string> = {
  openai: "gpt-5.4-mini",
  anthropic: "claude-sonnet-4-5",
  gemini: "gemini-2.5-flash",
  openrouter: "openai/gpt-4.1-mini",
};

export function providerSetup(origin: string, projectId: string, provider: SetupProvider) {
  const model = EXAMPLE_MODELS[provider];
  const baseUrl = providerProxyBaseUrl(origin, projectId, provider);
  const endpoint = providerProxyEndpoint(origin, projectId, provider, model);

  if (provider === "openai" || provider === "openrouter") {
    const isOpenAI = provider === "openai";
    const key = isOpenAI ? "OPENAI_API_KEY" : "OPENROUTER_API_KEY";
    const label = isOpenAI ? "OpenAI" : "OpenRouter";
    return {
      provider,
      label,
      model,
      baseUrl,
      endpoint,
      snippets: {
        javascript: `import crypto from "node:crypto";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.${key},
  baseURL: "${baseUrl}",
  defaultHeaders: {
    "X-Tollgate-Key": process.env.TOLLGATE_WRITE_KEY,
    "X-Tollgate-Customer": "customer-acme",
    "X-Tollgate-Idempotency-Key": crypto.randomUUID()
  }
});

const result = await client.chat.completions.create({
  model: "${model}",
  messages: [{ role: "user", content: "Hello" }],
  stream: false
});
console.log(result.choices[0].message.content);`,
        python: `import os
import uuid
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["${key}"],
    base_url="${baseUrl}",
    default_headers={
        "X-Tollgate-Key": os.environ["TOLLGATE_WRITE_KEY"],
        "X-Tollgate-Customer": "customer-acme",
        "X-Tollgate-Idempotency-Key": str(uuid.uuid4()),
    },
)

result = client.chat.completions.create(
    model="${model}",
    messages=[{"role": "user", "content": "Hello"}],
    stream=False,
)
print(result.choices[0].message.content)`,
        curl: `REQUEST_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl "${endpoint}" \
  -H "Authorization: Bearer $${key}" \
  -H "Content-Type: application/json" \
  -H "X-Tollgate-Key: $TOLLGATE_WRITE_KEY" \
  -H "X-Tollgate-Customer: customer-acme" \
  -H "X-Tollgate-Idempotency-Key: $REQUEST_ID" \
  -d '{"model":"${model}","messages":[{"role":"user","content":"Hello"}],"stream":false}'`,
      } satisfies Record<SetupLanguage, string>,
    };
  }

  if (provider === "anthropic") {
    return {
      provider,
      label: "Anthropic",
      model,
      baseUrl,
      endpoint,
      snippets: {
        javascript: `import crypto from "node:crypto";

const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "x-api-key": process.env.ANTHROPIC_API_KEY,
    "anthropic-version": "2023-06-01",
    "content-type": "application/json",
    "X-Tollgate-Key": process.env.TOLLGATE_WRITE_KEY,
    "X-Tollgate-Customer": "customer-acme",
    "X-Tollgate-Idempotency-Key": crypto.randomUUID()
  },
  body: JSON.stringify({
    model: "${model}",
    max_tokens: 256,
    messages: [{ role: "user", content: "Hello" }],
    stream: false
  })
});
console.log(await response.json());`,
        python: `import os
import uuid
import requests

response = requests.post(
    "${endpoint}",
    headers={
        "x-api-key": os.environ["ANTHROPIC_API_KEY"],
        "anthropic-version": "2023-06-01",
        "X-Tollgate-Key": os.environ["TOLLGATE_WRITE_KEY"],
        "X-Tollgate-Customer": "customer-acme",
        "X-Tollgate-Idempotency-Key": str(uuid.uuid4()),
    },
    json={
        "model": "${model}",
        "max_tokens": 256,
        "messages": [{"role": "user", "content": "Hello"}],
        "stream": False,
    },
)
print(response.json())`,
        curl: `REQUEST_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl "${endpoint}" \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -H "X-Tollgate-Key: $TOLLGATE_WRITE_KEY" \
  -H "X-Tollgate-Customer: customer-acme" \
  -H "X-Tollgate-Idempotency-Key: $REQUEST_ID" \
  -d '{"model":"${model}","max_tokens":256,"messages":[{"role":"user","content":"Hello"}],"stream":false}'`,
      } satisfies Record<SetupLanguage, string>,
    };
  }

  return {
    provider,
    label: "Gemini",
    model,
    baseUrl,
    endpoint,
    snippets: {
      javascript: `import crypto from "node:crypto";

const response = await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "x-goog-api-key": process.env.GEMINI_API_KEY,
    "content-type": "application/json",
    "X-Tollgate-Key": process.env.TOLLGATE_WRITE_KEY,
    "X-Tollgate-Customer": "customer-acme",
    "X-Tollgate-Idempotency-Key": crypto.randomUUID()
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "Hello" }] }]
  })
});
console.log(await response.json());`,
      python: `import os
import uuid
import requests

response = requests.post(
    "${endpoint}",
    headers={
        "x-goog-api-key": os.environ["GEMINI_API_KEY"],
        "X-Tollgate-Key": os.environ["TOLLGATE_WRITE_KEY"],
        "X-Tollgate-Customer": "customer-acme",
        "X-Tollgate-Idempotency-Key": str(uuid.uuid4()),
    },
    json={"contents": [{"parts": [{"text": "Hello"}]}]},
)
print(response.json())`,
      curl: `REQUEST_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
curl "${endpoint}" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "content-type: application/json" \
  -H "X-Tollgate-Key: $TOLLGATE_WRITE_KEY" \
  -H "X-Tollgate-Customer: customer-acme" \
  -H "X-Tollgate-Idempotency-Key: $REQUEST_ID" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'`,
    } satisfies Record<SetupLanguage, string>,
  };
}

