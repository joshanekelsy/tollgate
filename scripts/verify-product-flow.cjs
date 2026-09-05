// eslint-disable-next-line @typescript-eslint/no-require-imports
const { loadEnvConfig } = require("@next/env");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { chromium } = require("playwright");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ConvexHttpClient } = require("convex/browser");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { anyApi: api } = require("convex/server");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require("node:fs");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require("node:path");

loadEnvConfig(process.cwd());

const origin = process.env.TOLLGATE_TEST_ORIGIN || "http://127.0.0.1:3100";
const providerKey = process.env.OPENAI_API_KEY || "";
const convexUrl = process.env.TOLLGATE_TEST_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL || "";
const serviceToken = process.env.CONVEX_SERVICE_TOKEN || "";
const resultsDir = path.join(process.cwd(), "test-results");
const convex = convexUrl && serviceToken ? new ConvexHttpClient(convexUrl) : null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function previousPeriod() {
  const now = new Date();
  return {
    periodStart: Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    periodEnd: Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  };
}

async function json(response) {
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function assertNoOverflow(page, label) {
  const dimensions = await page.locator("html").evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  assert(dimensions.scrollWidth <= dimensions.clientWidth, `${label}: horizontal overflow ${JSON.stringify(dimensions)}`);
}

async function assertTapTargets(page, label) {
  const undersized = await page.locator("main button:visible, main a:visible").evaluateAll((elements) => elements.flatMap((element) => {
    const box = element.getBoundingClientRect();
    return box.width < 44 || box.height < 44
      ? [{ name: element.textContent?.trim().slice(0, 60), width: box.width, height: box.height }]
      : [];
  }));
  assert(undersized.length === 0, `${label}: undersized controls ${JSON.stringify(undersized)}`);
}

async function createMeter(browser, viewport, label) {
  const context = await browser.newContext({ viewport, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(15_000);
  await page.goto(origin, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Create a private meter" }).first().click();
  await page.getByLabel("Work email").fill(`e2e-${label}-${Date.now()}@example.com`);
  await page.getByRole("button", { name: "Create my meter" }).click();
  await page.getByRole("heading", { name: "Save these three secrets." }).waitFor();

  const recoveryCode = (await page.locator(".access-code code").textContent())?.trim();
  const writeKeys = await page.locator(".one-time-keys code").allTextContents();
  assert(recoveryCode, `${label}: recovery code was not shown`);
  assert(writeKeys[0]?.startsWith("tgw_test_"), `${label}: test write key was not shown`);
  assert(writeKeys[1]?.startsWith("tgw_live_"), `${label}: live write key was not shown`);

  const setupDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download setup.txt" }).click();
  const download = await setupDownload;
  const setupText = await fs.promises.readFile(await download.path(), "utf8");
  assert(setupText.includes(writeKeys[0]) && setupText.includes(writeKeys[1]), `${label}: setup download omitted write keys`);
  assert(setupText.includes("X-Tollgate-Idempotency-Key".toLowerCase()), `${label}: setup download omitted retry header`);

  await page.getByRole("button", { name: "Continue to setup" }).click();
  await page.waitForURL(/\/p\/[^/]+\/dashboard\?view=setup$/);
  const projectId = new URL(page.url()).pathname.split("/")[2];
  await page.getByRole("heading", { name: "Make one trusted event invoice-ready." }).waitFor();
  for (const name of ["Overview", "Events", "Customers", "Pricing", "Billing runs", "Setup"]) {
    await page.getByRole("button", { name: new RegExp(`^${name}`) }).waitFor();
  }
  await assertNoOverflow(page, `${label} setup`);
  await assertTapTargets(page, `${label} setup`);
  return { context, page, projectId, recoveryCode, testKey: writeKeys[0], liveKey: writeKeys[1] };
}

function proxyHeaders(writeKey, retryId, key = providerKey) {
  return {
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
    "x-tollgate-key": writeKey,
    "x-tollgate-idempotency-key": retryId,
  };
}

function openAiBody(message = "Reply with the single word OK.") {
  return {
    model: "gpt-5.4-mini",
    messages: [{ role: "user", content: message }],
    max_completion_tokens: 20,
  };
}

async function verifyProtectedIngestion(meter) {
  const endpoint = `${origin}/p/${encodeURIComponent(meter.projectId)}/providers/openai/v1/chat/completions`;
  const missingWriteKey = await meter.page.request.post(endpoint, {
    headers: { authorization: "Bearer not-sent", "content-type": "application/json" },
    data: openAiBody(),
  });
  assert(missingWriteKey.status() === 401, `missing write key returned ${missingWriteKey.status()}`);

  const wrongWriteKey = await meter.page.request.post(endpoint, {
    headers: proxyHeaders("tgw_test_not-a-real-key", "wrong-key-check", "not-sent"),
    data: openAiBody(),
  });
  assert(wrongWriteKey.status() === 401, `wrong write key returned ${wrongWriteKey.status()}`);

  const missingRetry = await meter.page.request.post(endpoint, {
    headers: { authorization: "Bearer not-sent", "content-type": "application/json", "x-tollgate-key": meter.testKey },
    data: openAiBody(),
  });
  assert(missingRetry.status() === 400, `missing retry ID returned ${missingRetry.status()}`);

  const unsafeModel = await meter.page.request.post(endpoint, {
    headers: proxyHeaders(meter.testKey, "unsafe-model-check", "not-sent"),
    data: { ...openAiBody(), model: "model with spaces" },
  });
  assert(unsafeModel.status() === 400, `unsafe model ID returned ${unsafeModel.status()}`);

  const streaming = await meter.page.request.post(endpoint, {
    headers: proxyHeaders(meter.testKey, "stream-check", "not-sent"),
    data: { ...openAiBody(), stream: true },
  });
  assert(streaming.status() === 400, `streaming request returned ${streaming.status()}`);

  const blockedPath = await meter.page.request.post(`${origin}/p/${encodeURIComponent(meter.projectId)}/providers/openai/v1/responses`, {
    headers: proxyHeaders(meter.testKey, "blocked-path-check", "not-sent"),
    data: { model: "gpt-5.4-mini", input: "Do not send" },
  });
  assert(blockedPath.status() === 404, `blocked provider path returned ${blockedPath.status()}`);

  const providerCases = [
    ["openai", "v1/chat/completions", openAiBody()],
    ["openrouter", "api/v1/chat/completions", { model: "openai/gpt-5.4-mini", messages: [] }],
    ["anthropic", "v1/messages", { model: "claude-sonnet-4-5", max_tokens: 1, messages: [] }],
    ["gemini", "v1beta/models/gemini-2.5-flash:generateContent", { contents: [] }],
  ];
  for (const [provider, providerPath, data] of providerCases) {
    const response = await meter.page.request.post(`${origin}/p/${encodeURIComponent(meter.projectId)}/providers/${provider}/${providerPath}`, {
      headers: { "content-type": "application/json", "x-tollgate-key": meter.testKey, "x-tollgate-idempotency-key": `missing-provider-key-${provider}` },
      data,
    });
    assert(response.status() === 401, `${provider} missing provider key returned ${response.status()}`);
  }

  const failedProvider = await meter.page.request.post(endpoint, {
    headers: proxyHeaders(meter.testKey, "provider-rejection", "sk-invalid-e2e-only"),
    data: openAiBody(),
  });
  assert(failedProvider.status() >= 400 && failedProvider.status() < 500, `provider rejection returned ${failedProvider.status()}`);

  if (!providerKey) return false;

  const retryId = `happy-test-${Date.now()}`;
  const happyBody = openAiBody();
  const happy = await meter.page.request.post(endpoint, {
    headers: { ...proxyHeaders(meter.testKey, retryId), "x-tollgate-customer": "e2e-test-customer" },
    data: happyBody,
  });
  assert(happy.ok(), `real test provider call failed with HTTP ${happy.status()}: ${await happy.text()}`);
  assert(happy.headers()["x-tollgate-provider"] === "openai", "provider response omitted Tollgate metadata");

  const duplicate = await meter.page.request.post(endpoint, {
    headers: { ...proxyHeaders(meter.testKey, retryId), "x-tollgate-customer": "e2e-test-customer" },
    data: happyBody,
  });
  assert(duplicate.status() === 409, `identical retry returned ${duplicate.status()}`);

  const conflict = await meter.page.request.post(endpoint, {
    headers: { ...proxyHeaders(meter.testKey, retryId), "x-tollgate-customer": "different-customer" },
    data: happyBody,
  });
  assert(conflict.status() === 409, `conflicting retry returned ${conflict.status()}`);

  const unattributed = await meter.page.request.post(endpoint, {
    headers: proxyHeaders(meter.testKey, `unattributed-test-${Date.now()}`),
    data: openAiBody("Reply only YES."),
  });
  assert(unattributed.ok(), `unattributed test call failed with HTTP ${unattributed.status()}`);

  const live = await meter.page.request.post(endpoint, {
    headers: { ...proxyHeaders(meter.liveKey, `happy-live-${Date.now()}`), "x-tollgate-customer": "e2e-live-customer" },
    data: openAiBody("Reply only LIVE."),
  });
  assert(live.ok(), `real live provider call failed with HTTP ${live.status()}: ${await live.text()}`);

  const testEvents = await json(await meter.page.request.get(`${origin}/p/${meter.projectId}/dashboard/events?environment=test`));
  const liveEvents = await json(await meter.page.request.get(`${origin}/p/${meter.projectId}/dashboard/events?environment=live`));
  assert(testEvents.response.ok() && liveEvents.response.ok(), "event APIs did not load");
  assert(testEvents.body.events.some((event) => event.customerId === "e2e-test-customer" && event.duplicateAttempts >= 2), "duplicate test attempts are not visible");
  assert(testEvents.body.events.some((event) => event.customerId === "unattributed"), "unattributed test event is not visible");
  assert(testEvents.body.events.every((event) => event.environment === "test"), "live data leaked into test events");
  assert(liveEvents.body.events.some((event) => event.customerId === "e2e-live-customer"), "live event is missing");
  assert(liveEvents.body.events.every((event) => event.environment === "live"), "test data leaked into live events");
  return true;
}

async function seedHistoricalCall(projectId) {
  assert(convex, "NEXT_PUBLIC_CONVEX_URL is required for the completed-month test");
  const { periodStart, periodEnd } = previousPeriod();
  await convex.mutation(api.calls.record, {
    serviceToken,
    projectId,
    environment: "live",
    idempotencyKey: `historical-${Date.now()}`,
    eventStatus: "accepted",
    pricingStatus: "priced",
    pricingSource: "built_in",
    customerId: "e2e-billing-customer",
    createdAt: periodStart + Math.min(86_400_000, Math.max(1, periodEnd - periodStart - 1)),
    provider: "openai",
    providerRequestId: "req_historical_e2e",
    requestedModel: "gpt-5.4-mini",
    reportedModel: "gpt-5.4-mini",
    promptTokens: 800,
    cachedPromptTokens: 0,
    completionTokens: 200,
    estimatedCostUsd: 0.01,
    costStatus: "estimated",
    latencyMs: 120,
    status: "ok",
    trafficType: "external",
    privacyMode: "private",
    toolCallCount: 0,
  });
  return { periodStart, periodEnd };
}

async function verifyBillingLoop(meter) {
  const base = `${origin}/p/${encodeURIComponent(meter.projectId)}/dashboard`;
  const period = previousPeriod();

  const emptyClose = await json(await meter.page.request.post(`${base}/billing-runs`, { data: period }));
  assert(emptyClose.response.status() === 409 && emptyClose.body.blockers?.some((item) => item.code === "no_usage"), "empty month did not return no_usage blocker");

  await seedHistoricalCall(meter.projectId);
  const incompleteClose = await json(await meter.page.request.post(`${base}/billing-runs`, { data: period }));
  assert(incompleteClose.response.status() === 409, `incomplete close returned ${incompleteClose.response.status()}`);
  assert(incompleteClose.body.blockers?.some((item) => item.code === "missing_billing_contact"), "missing billing contact did not block close");
  assert(incompleteClose.body.blockers?.some((item) => item.code === "missing_rule"), "missing pricing did not block close");

  const invalidCustomer = await meter.page.request.post(`${base}/customers`, {
    data: { environment: "live", customerId: "bad customer", billingEmail: "bad" },
  });
  assert(invalidCustomer.status() === 400, `invalid customer returned ${invalidCustomer.status()}`);

  const savedCustomer = await meter.page.request.post(`${base}/customers`, {
    data: {
      environment: "live",
      customerId: "e2e-billing-customer",
      name: "E2E Billing Customer",
      billingEmail: "billing@example.com",
      stripeCustomerId: "cus_E2ETEST12345",
      status: "active",
    },
  });
  assert(savedCustomer.ok(), `customer save returned ${savedCustomer.status()}`);

  const negativeRule = await meter.page.request.post(`${base}/billing-rule`, {
    data: { environment: "live", mode: "percentage", value: -1 },
  });
  assert(negativeRule.status() === 400, `negative pricing returned ${negativeRule.status()}`);

  const invalidRate = await meter.page.request.post(`${base}/rates`, {
    data: { environment: "live", provider: "anthropic", model: "bad model", inputUsdPerMillion: -1, outputUsdPerMillion: 1 },
  });
  assert(invalidRate.status() === 400, `invalid rate card returned ${invalidRate.status()}`);

  await meter.page.goto(`${base}?view=pricing`);
  await meter.page.getByRole("heading", { name: "Price customer usage without guessing cost." }).waitFor();
  await meter.page.getByRole("button", { name: "Live", exact: true }).click();
  await meter.page.getByText("live pricing", { exact: false }).waitFor();
  await meter.page.getByText("USD per 1,000 tokens", { exact: true }).click();
  await meter.page.getByLabel("USD / 1K tokens").fill("2");
  await meter.page.getByLabel("Monthly base USD").fill("5");
  await meter.page.getByLabel("Included tokens").fill("100");
  await meter.page.getByRole("button", { name: "Save rule" }).click();
  await meter.page.getByText("Versioned price rule saved. Closed billing runs were not changed.").waitFor();

  const rate = await meter.page.request.post(`${base}/rates`, {
    data: { environment: "live", provider: "anthropic", model: "claude-sonnet-4-5", inputUsdPerMillion: 3, outputUsdPerMillion: 15 },
  });
  assert(rate.ok(), `valid rate card returned ${rate.status()}`);

  const ready = await json(await meter.page.request.get(`${base}/billing-runs?periodStart=${period.periodStart}&periodEnd=${period.periodEnd}`));
  assert(ready.response.ok() && ready.body.preview.blockers.length === 0, `billing preview remained blocked: ${JSON.stringify(ready.body.preview.blockers)}`);
  assert(ready.body.preview.rows[0].billedAmountUsd === 6.8, `billing preview was ${ready.body.preview.rows[0].billedAmountUsd}, expected 6.8`);

  const closed = await json(await meter.page.request.post(`${base}/billing-runs`, { data: period }));
  assert(closed.response.ok() && closed.body.closed && !closed.body.existing, `month close failed: ${JSON.stringify(closed.body)}`);
  const runId = closed.body.run._id;
  const amountCents = closed.body.run.totalAmountCents;
  assert(amountCents === 680, `closed amount was ${amountCents} cents, expected 680`);

  const repeated = await json(await meter.page.request.post(`${base}/billing-runs`, { data: period }));
  assert(repeated.response.ok() && repeated.body.existing && repeated.body.run._id === runId, "repeat close created or returned a different run");

  const changedRule = await meter.page.request.post(`${base}/billing-rule`, {
    data: { environment: "live", mode: "per_thousand_tokens", value: 99, baseAmountUsd: 50, includedTokens: 0 },
  });
  assert(changedRule.ok(), `replacement pricing returned ${changedRule.status()}`);
  const afterChange = await json(await meter.page.request.get(`${base}/billing-runs?periodStart=${period.periodStart}&periodEnd=${period.periodEnd}`));
  const fixedRun = afterChange.body.runs.find((run) => run._id === runId);
  assert(fixedRun?.totalAmountCents === 680, "pricing edit changed a closed billing run");

  const csv = await meter.page.request.get(`${base}/billing-runs/${encodeURIComponent(runId)}/csv`);
  const csvText = await csv.text();
  assert(csv.ok() && csv.headers()["content-type"].startsWith("text/csv"), "CSV export failed");
  assert(csvText.includes("E2E Billing Customer") && csvText.includes("6.80"), "CSV omitted the fixed customer amount");

  const stripeWithoutConnection = await meter.page.request.post(`${base}/billing-runs/${encodeURIComponent(runId)}/stripe`);
  assert(stripeWithoutConnection.status() === 409, `Stripe export without connection returned ${stripeWithoutConnection.status()}`);

  const badStripe = await meter.page.request.post(`${base}/stripe`, {
    data: { secretKey: "rk_test_bad", webhookSecret: "whsec_bad" },
  });
  assert(badStripe.status() === 400, `malformed Stripe credentials returned ${badStripe.status()}`);

  const missingWebhookConnection = await meter.page.request.post(`${origin}/api/stripe/webhook/${encodeURIComponent(meter.projectId)}`, {
    headers: { "stripe-signature": "t=1,v1=bad" },
    data: { id: "evt_bad", type: "invoice.paid" },
  });
  assert(missingWebhookConnection.status() === 404, `webhook without Stripe connection returned ${missingWebhookConnection.status()}`);

  const current = new Date();
  const currentPeriod = {
    periodStart: Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1),
    periodEnd: Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1),
  };
  const currentClose = await meter.page.request.post(`${base}/billing-runs`, { data: currentPeriod });
  assert(currentClose.status() === 400, `current month close returned ${currentClose.status()}`);

  await meter.page.goto(`${base}?view=billing`);
  await meter.page.getByRole("heading", { name: "Close once. Export without duplicates." }).waitFor();
  await meter.page.getByText("live usage active", { exact: true }).waitFor();
  await meter.page.locator(".close-preview > header > strong").getByText("$6.80", { exact: true }).waitFor();
  const closedButton = meter.page.getByRole("button", { name: "Already closed" });
  await closedButton.waitFor();
  assert(await closedButton.isDisabled(), "closed period still offered an active close button");
  await meter.page.getByText("E2E Billing Customer", { exact: false }).waitFor();
  await meter.page.getByRole("link", { name: /CSV/ }).waitFor();
  await assertNoOverflow(meter.page, "desktop billing run");
  await meter.page.screenshot({ path: path.join(resultsDir, "product-flow-desktop.png"), fullPage: true });
}

async function verifyAccessAndFailures(browser, meter) {
  const invalidJson = await meter.page.request.post(`${origin}/apply`, {
    headers: { "content-type": "application/json" }, data: "{broken-json",
  });
  assert(invalidJson.status() === 400, `invalid application JSON returned ${invalidJson.status()}`);
  const invalidEmail = await meter.page.request.post(`${origin}/apply`, {
    data: { email: "not-an-email", provider: "openai", source: "other" },
  });
  assert(invalidEmail.status() === 400, `invalid email returned ${invalidEmail.status()}`);

  const keyMetadata = await json(await meter.page.request.get(`${origin}/p/${meter.projectId}/dashboard/write-keys`));
  assert(keyMetadata.response.ok(), "write-key metadata did not load");
  const serializedMetadata = JSON.stringify(keyMetadata.body);
  assert(!serializedMetadata.includes(meter.testKey) && !serializedMetadata.includes(meter.liveKey), "full write key leaked after creation");

  const crossMeter = await meter.page.request.get(`${origin}/p/not-this-meter/dashboard/events`);
  assert(crossMeter.status() === 403, `cross-meter session returned ${crossMeter.status()}`);

  const failurePage = await meter.context.newPage();
  await failurePage.route("**/dashboard/invoices", (route) => route.fulfill({ status: 503, contentType: "application/json", body: "{}" }));
  await failurePage.goto(`${origin}/p/${encodeURIComponent(meter.projectId)}/dashboard`);
  await failurePage.getByRole("heading", { name: "The operating data did not load." }).waitFor();
  await failurePage.getByRole("button", { name: "Retry" }).waitFor();
  await failurePage.close();

  const failedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const failedApply = await failedContext.newPage();
  await failedApply.route("**/apply", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"test failure"}' }));
  await failedApply.goto(origin);
  await failedApply.getByRole("link", { name: "Create a private meter" }).first().click();
  await failedApply.getByLabel("Work email").fill("failure@example.com");
  await failedApply.getByRole("button", { name: "Create my meter" }).click();
  await failedApply.getByRole("alert").filter({ hasText: "That did not go through" }).waitFor();
  assert(await failedApply.getByLabel("Work email").inputValue() === "failure@example.com", "failed application cleared the email");
  await failedContext.close();

  const wrongContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const wrongPage = await wrongContext.newPage();
  wrongPage.setDefaultTimeout(15_000);
  await wrongPage.goto(`${origin}/p/${encodeURIComponent(meter.projectId)}/dashboard`);
  await wrongPage.getByRole("heading", { name: "Open your usage ledger." }).waitFor();
  await wrongPage.getByLabel("Recovery code").fill("wrong-code");
  await wrongPage.getByRole("button", { name: "Open meter" }).click();
  await wrongPage.getByRole("alert").filter({ hasText: "That code does not open this meter" }).waitFor();
  await wrongPage.getByLabel("Recovery code").fill(meter.recoveryCode);
  await wrongPage.getByRole("button", { name: "Open meter" }).click();
  await wrongPage.locator(".view-heading h1").waitFor();
  await assertNoOverflow(wrongPage, "mobile recovered meter");
  await wrongPage.screenshot({ path: path.join(resultsDir, "product-flow-mobile.png"), fullPage: true });
  await wrongContext.close();

  await meter.page.getByRole("button", { name: "Sign out" }).click();
  await meter.page.getByRole("heading", { name: "Open your usage ledger." }).waitFor();
}

async function verifyPublicSample(browser, viewport, label) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(15_000);
  const browserErrors = [];
  const protectedRequests = [];
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("request", (request) => {
    if (/\/p\/sample-meter\/dashboard\//.test(request.url())) protectedRequests.push(request.url());
  });

  const landing = await page.goto(origin, { waitUntil: "networkidle" });
  assert(landing?.ok(), `${label} landing returned HTTP ${landing?.status()}`);
  assert((await page.title()) === "Tollgate — Turn AI usage into customer billing", `${label} landing title changed`);
  await page.getByText("What happens after I enter my email?").waitFor();
  await page.getByText("What does Tollgate not do?").waitFor();
  await page.getByText(/creates Stripe draft invoices but does not send them/).waitFor();
  await assertNoOverflow(page, `${label} landing`);
  await assertTapTargets(page, `${label} landing`);
  await page.screenshot({ path: path.join(resultsDir, `landing-${label}.png`), fullPage: true });
  console.log(`[${label}] landing passed`);

  if (label === "desktop") {
    await page.getByRole("button", { name: /Inspect/ }).click();
    await page.getByRole("dialog", { name: "Expanded sample dashboard" }).waitFor();
    assert((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes("Close"), "proof dialog did not receive focus");
    await page.keyboard.press("Tab");
    assert((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes("Close"), "proof dialog leaked keyboard focus");
    await page.keyboard.press("Escape");
  }

  await page.getByRole("link", { name: "Explore sample dashboard" }).first().click();
  await page.waitForURL(/\/demo$/);
  await page.getByText("Read-only sample dashboard").waitFor();
  await page.getByRole("heading", { name: "Sample revenue control room" }).waitFor();
  await page.getByText("$80.71", { exact: true }).first().waitFor();
  await assertNoOverflow(page, `${label} sample overview`);
  await assertTapTargets(page, `${label} sample overview`);
  await page.screenshot({ path: path.join(resultsDir, `sample-dashboard-${label}.png`), fullPage: true });
  console.log(`[${label}] sample overview passed`);

  const views = [
    ["Events", "Every accepted and rejected call."],
    ["Customers", "Map usage to billing identities."],
    ["Pricing", "Price customer usage without guessing cost."],
    ["Billing runs", "Close once. Export without duplicates."],
    ["Setup", "Make one trusted event invoice-ready."],
  ];
  for (const [view, heading] of views) {
    await page.getByRole("button", { name: new RegExp(`^${view}`) }).click();
    await page.getByRole("heading", { name: heading }).waitFor();
    await assertNoOverflow(page, `${label} sample ${view}`);
    console.log(`[${label}] ${view} passed`);
  }

  for (const [provider, endpoint] of [
    ["OpenAI", /providers\/openai\/v1\/chat\/completions/],
    ["Anthropic", /providers\/anthropic\/v1\/messages/],
    ["Gemini", /providers\/gemini\/v1beta\/models\/gemini-2\.5-flash:generateContent/],
    ["OpenRouter", /providers\/openrouter\/api\/v1\/chat\/completions/],
  ]) {
    await page.getByRole("tab", { name: provider, exact: true }).click();
    await page.getByText(endpoint).first().waitFor();
  }
  await assertTapTargets(page, `${label} sample setup`);
  await page.screenshot({ path: path.join(resultsDir, `sample-setup-${label}.png`), fullPage: true });
  console.log(`[${label}] provider setup passed`);

  await page.goto(`${origin}/invoices?demo=1`);
  await page.waitForURL(`${origin}/demo?view=overview`);
  await page.goto(`${origin}/settings?demo=1`);
  await page.waitForURL(`${origin}/demo?view=pricing`);
  await page.getByRole("heading", { name: "Price customer usage without guessing cost." }).waitFor();

  assert(protectedRequests.length === 0, `${label} sample called protected APIs ${JSON.stringify(protectedRequests)}`);
  assert(browserErrors.length === 0, `${label} browser errors ${JSON.stringify(browserErrors)}`);
  await context.close();
  console.log(`[${label}] public sample passed`);
}

async function verifyPublicPages(browser, viewport, label) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(15_000);
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));
  const pages = [
    ["docs", "From first request to fixed billing run."],
    ["api-reference", "Four fixed request formats. One usage record."],
    ["security", "Usage metadata stays. Request content does not."],
    ["privacy", "A factual record of what Tollgate handles."],
    ["changelog", "What changed, with the boundary attached."],
    ["status", "Current system status."],
    ["contact", "Bring one real billing workflow."],
  ];
  for (const [route, heading] of pages) {
    const response = await page.goto(`${origin}/${route}`, { waitUntil: "networkidle" });
    assert(response?.ok(), `${label} ${route} returned HTTP ${response?.status()}`);
    await page.getByRole("heading", { name: heading }).waitFor();
    await assertNoOverflow(page, `${label} ${route}`);
    await assertTapTargets(page, `${label} ${route}`);
  }
  await page.goto(origin);
  const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
  assert(ogTitle === "Tollgate — Know what to bill", `${label} Open Graph title is missing`);
  assert(ogImage?.endsWith("/social/tollgate-launch-v3.png"), `${label} Open Graph image is missing`);
  assert(twitterCard === "summary_large_image", `${label} Twitter card is missing`);
  const imagePath = new URL(ogImage).pathname;
  const [imageResponse, robotsResponse, sitemapResponse] = await Promise.all([
    context.request.get(`${origin}${imagePath}`),
    context.request.get(`${origin}/robots.txt`),
    context.request.get(`${origin}/sitemap.xml`),
  ]);
  assert(imageResponse.ok() && imageResponse.headers()["content-type"]?.startsWith("image/png"), `${label} launch image is unavailable`);
  assert(robotsResponse.ok() && (await robotsResponse.text()).includes("Disallow: /p/"), `${label} robots rules are missing`);
  assert(sitemapResponse.ok() && (await sitemapResponse.text()).includes("https://tollgate-sigma.vercel.app/privacy"), `${label} sitemap is missing privacy`);
  await page.goto(`${origin}/status`);
  await page.getByText("All checked systems are responding.", { exact: true }).waitFor();

  await page.goto(`${origin}/contact`);
  await page.getByLabel("Name").fill("E2E Product Check");
  await page.getByLabel("Work email").fill(`contact-e2e-${Date.now()}@example.com`);
  await page.getByLabel("What do you need to meter or bill?").fill("Verify the private beta contact workflow.");
  await page.getByRole("button", { name: "Send message" }).click();
  await page.getByText("Message received. We will reply by email.", { exact: true }).waitFor();
  await page.screenshot({ path: path.join(resultsDir, `public-pages-${label}.png`), fullPage: true });

  assert(errors.length === 0, `${label} public page browser errors ${JSON.stringify(errors)}`);
  await context.close();
  console.log(`[${label}] public pages, privacy, and social preview passed`);
}

(async () => {
  fs.mkdirSync(resultsDir, { recursive: true });
  assert(convexUrl, "NEXT_PUBLIC_CONVEX_URL is missing");
  assert(serviceToken.length >= 32, "CONVEX_SERVICE_TOKEN is missing or too short");
  const browser = await chromium.launch({ headless: true });
  try {
    const meter = await createMeter(browser, { width: 1440, height: 900 }, "desktop");
    console.log("[product] meter creation passed");
    const realProviderVerified = await verifyProtectedIngestion(meter);
    console.log("[product] protected ingestion passed");
    await verifyBillingLoop(meter);
    console.log("[product] billing loop passed");
    await verifyAccessAndFailures(browser, meter);
    console.log("[product] access and failure paths passed");
    await verifyPublicSample(browser, { width: 1440, height: 900 }, "desktop");
    await verifyPublicSample(browser, { width: 390, height: 844 }, "mobile");
    await verifyPublicPages(browser, { width: 1440, height: 900 }, "desktop");
    await verifyPublicPages(browser, { width: 390, height: 844 }, "mobile");
    await meter.context.close();
    console.log(`Product flow verified at 1440x900 and 390x844. Real OpenAI calls: ${realProviderVerified ? "passed" : "skipped (OPENAI_API_KEY unavailable)"}.`);
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
