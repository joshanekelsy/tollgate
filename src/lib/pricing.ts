type Usage = {
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
  exceptionalPricing?: boolean;
};

export const PRICING_VERIFIED_AT = "2026-08-30";

export const MODEL_PRICING = {
  "gpt-5.4-mini": { label: "GPT-5.4 Mini", input: 0.75, cachedInput: 0.075, output: 4.5, source: "https://developers.openai.com/api/docs/models/gpt-5.4-mini" },
  "gpt-5.4-nano": { label: "GPT-5.4 nano", input: 0.2, cachedInput: 0.02, output: 1.25, source: "https://developers.openai.com/api/docs/models/gpt-5.4-nano" },
  "gpt-5-nano": { label: "GPT-5 nano", input: 0.05, cachedInput: 0.005, output: 0.4, source: "https://developers.openai.com/api/docs/models/gpt-5-nano" },
  "gpt-5.6-luna": { label: "GPT-5.6 Luna", input: 0.2, cachedInput: 0.02, output: 1.2, source: "https://developers.openai.com/api/docs/models/gpt-5.6-luna" },
} as const;

export type PricedModel = keyof typeof MODEL_PRICING;
export const SUPPORTED_MODELS = Object.keys(MODEL_PRICING) as PricedModel[];

export function isPricedModel(value: unknown): value is PricedModel {
  return typeof value === "string" && Object.hasOwn(MODEL_PRICING, value);
}

// Kept for the controlled model-comparison UI, which only offers priced models.
export const isSupportedModel = isPricedModel;

function validCount(value: number) {
  return Number.isSafeInteger(value) && value >= 0;
}

export function priceCall(usage: Usage, model: string = "gpt-5.4-mini") {
  const { promptTokens, cachedPromptTokens, completionTokens, exceptionalPricing = false } = usage;
  if (
    exceptionalPricing ||
    !isPricedModel(model) ||
    !validCount(promptTokens) ||
    !validCount(cachedPromptTokens) ||
    !validCount(completionTokens) ||
    cachedPromptTokens > promptTokens
  ) {
    return { costStatus: "unavailable" as const };
  }

  const uncachedPromptTokens = promptTokens - cachedPromptTokens;
  const calculate = (pricedModel: PricedModel) => {
    const rates = MODEL_PRICING[pricedModel];
    return (uncachedPromptTokens * rates.input + cachedPromptTokens * rates.cachedInput + completionTokens * rates.output) / 1_000_000;
  };

  return {
    costStatus: "estimated" as const,
    estimatedCostUsd: calculate(model),
    sameTokenEstimateUsd: calculate("gpt-5.4-nano"),
  };
}

export function estimateModelAlternatives(usage: Pick<Usage, "promptTokens" | "cachedPromptTokens" | "completionTokens">) {
  if (!validCount(usage.promptTokens) || !validCount(usage.cachedPromptTokens) || !validCount(usage.completionTokens) || usage.cachedPromptTokens > usage.promptTokens) return [];
  const uncached = usage.promptTokens - usage.cachedPromptTokens;
  return (["gpt-5.4-nano", "gpt-5-nano", "gpt-5.6-luna"] as const).map((model) => {
    const pricing = MODEL_PRICING[model];
    return {
      model,
      label: pricing.label,
      source: pricing.source,
      estimatedCostUsd: (uncached * pricing.input + usage.cachedPromptTokens * pricing.cachedInput + usage.completionTokens * pricing.output) / 1_000_000,
    };
  }).sort((a, b) => a.estimatedCostUsd - b.estimatedCostUsd);
}
