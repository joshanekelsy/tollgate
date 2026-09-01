export function compareSameTokens(estimatedCostUsd?: number, sameTokenEstimateUsd?: number) {
  if (
    estimatedCostUsd === undefined ||
    sameTokenEstimateUsd === undefined ||
    estimatedCostUsd <= 0 ||
    sameTokenEstimateUsd < 0
  ) return null;

  const differenceUsd = estimatedCostUsd - sameTokenEstimateUsd;
  return {
    differenceUsd,
    percentLower: Math.max(0, (differenceUsd / estimatedCostUsd) * 100),
  };
}
