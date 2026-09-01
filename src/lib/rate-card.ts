import type { ProviderId } from "./types";

export type ModelRateCard = {
  provider: ProviderId;
  model: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

export function findExactRateCard(rates: ModelRateCard[], provider: ProviderId, model: string) {
  return rates.find((rate) => rate.provider === provider && rate.model === model) ?? null;
}

export function estimateRateCardCost(
  usage: { promptTokens: number; completionTokens: number },
  rate: Pick<ModelRateCard, "inputUsdPerMillion" | "outputUsdPerMillion">,
) {
  const cost = usage.promptTokens / 1_000_000 * rate.inputUsdPerMillion
    + usage.completionTokens / 1_000_000 * rate.outputUsdPerMillion;
  return Math.round((cost + Number.EPSILON) * 1_000_000) / 1_000_000;
}
