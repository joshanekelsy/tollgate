import type { Metadata } from "next";
import { PublicDocsLayout } from "@/components/public-docs-layout";

export const metadata: Metadata = { title: "Tollgate API reference", description: "Supported provider paths, Tollgate headers, response metadata, and errors." };

const endpoints = [
  ["OpenAI", "/p/{projectId}/providers/openai/v1/chat/completions", "Chat Completions"],
  ["OpenRouter", "/p/{projectId}/providers/openrouter/api/v1/chat/completions", "Chat Completions"],
  ["Anthropic", "/p/{projectId}/providers/anthropic/v1/messages", "Messages"],
  ["Gemini", "/p/{projectId}/providers/gemini/v1beta/models/{model}:generateContent", "GenerateContent"],
];

export default function ApiReferencePage() {
  return <PublicDocsLayout current="api" eyebrow="API / V1" title="Four fixed request formats. One usage record." description="Tollgate accepts JSON POST requests on the paths below. Streaming and every unlisted endpoint are rejected.">
    <section className="docs-section"><header><p>01 / Endpoints</p><h2>Supported provider routes.</h2></header><div className="api-table-wrap"><table className="api-table"><thead><tr><th>Provider</th><th>Path</th><th>Request format</th></tr></thead><tbody>{endpoints.map(([provider, path, format]) => <tr key={provider}><td>{provider}</td><th>{path}</th><td>{format}, non-streaming only</td></tr>)}</tbody></table></div></section>
    <section className="docs-section"><header><p>02 / Headers</p><h2>Required request identity.</h2></header><div className="api-table-wrap"><table className="api-table"><thead><tr><th>Header</th><th>Required</th><th>Meaning</th></tr></thead><tbody><tr><th>X-Tollgate-Key</th><td>Yes</td><td>Matching test or live write key.</td></tr><tr><th>X-Tollgate-Idempotency-Key</th><td>Yes</td><td>Stable safe ID for retries of one logical request.</td></tr><tr><th>X-Tollgate-Customer</th><td>Recommended</td><td>External customer ID. Missing values become unattributed.</td></tr><tr><th>Authorization / provider key</th><td>Yes</td><td>OpenAI/OpenRouter use Authorization, Anthropic uses x-api-key, and Gemini uses x-goog-api-key.</td></tr><tr><th>X-Tollgate-Task-Id</th><td>No</td><td>Safe trace ID using letters, numbers, dot, underscore, colon, or dash.</td></tr></tbody></table></div></section>
    <section className="docs-section"><header><p>03 / Response</p><h2>Provider body, Tollgate evidence.</h2></header><div className="docs-grid"><article><h3>Pass-through</h3><p>The provider response status and body return to the caller. Tollgate adds safe response headers such as <code>x-tollgate-provider</code>, <code>x-tollgate-cost-status</code>, and <code>x-tollgate-call-id</code>.</p></article><article><h3>Cost states</h3><p><code>reported</code> comes from the provider, <code>estimated</code> comes from a verified built-in price or exact rate card, and <code>unavailable</code> is never changed to zero.</p></article></div></section>
    <section className="docs-section"><header><p>04 / Errors</p><h2>Rejected before spend where possible.</h2></header><div className="api-table-wrap"><table className="api-table"><thead><tr><th>Status</th><th>Condition</th></tr></thead><tbody><tr><th>400</th><td>Invalid JSON, unsafe IDs, missing retry ID, streaming, or invalid model ID.</td></tr><tr><th>401</th><td>Missing, invalid, or rotated Tollgate write key; missing provider credential.</td></tr><tr><th>404</th><td>Unknown project, provider, or unsupported provider endpoint.</td></tr><tr><th>409</th><td>Duplicate retry ID or the same retry ID used for a different request.</td></tr><tr><th>502</th><td>The selected provider could not be reached.</td></tr></tbody></table></div></section>
  </PublicDocsLayout>;
}
