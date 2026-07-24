import type { InvestorProfile, RankedProfile, SortOption } from "@/types/investor";

/**
 * Ranking weights (transparent, disclosed to investors):
 *   FinTwin Score:          35%
 *   Financial Health Score: 30%
 *   Growth Readiness Score: 20%
 *   Green Score:            15%
 *
 * Rankings are based on FinTwin platform indicators and are intended for
 * discovery only. Investors should conduct their own due diligence.
 */
export const RANKING_WEIGHTS = {
  fintwinScore:        0.35,
  financialHealthScore: 0.30,
  growthReadinessScore: 0.20,
  greenScore:          0.15,
} as const;

export function computeRankingScore(profile: InvestorProfile): number {
  const raw =
    profile.fintwinScore        * RANKING_WEIGHTS.fintwinScore        +
    profile.financialHealthScore * RANKING_WEIGHTS.financialHealthScore +
    profile.growthReadinessScore * RANKING_WEIGHTS.growthReadinessScore +
    profile.greenScore           * RANKING_WEIGHTS.greenScore;
  return Math.round(raw * 10) / 10;
}

export function rankProfiles(profiles: InvestorProfile[]): RankedProfile[] {
  const visible = profiles.filter((p) => p.investorDiscoveryEnabled);
  return visible
    .map((p) => ({ ...p, rankingScore: computeRankingScore(p), rank: 0 }))
    .sort((a, b) => b.rankingScore - a.rankingScore)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

const RISK_ORDER: Record<string, number> = { Low: 0, Moderate: 1, High: 2 };

export function sortRankedProfiles(
  profiles: RankedProfile[],
  sortBy: SortOption,
): RankedProfile[] {
  const sorted = [...profiles];
  switch (sortBy) {
    case "ranking":            return sorted.sort((a, b) => a.rank - b.rank);
    case "fintwinScore":       return sorted.sort((a, b) => b.fintwinScore - a.fintwinScore);
    case "greenScore":         return sorted.sort((a, b) => b.greenScore - a.greenScore);
    case "financialHealthScore": return sorted.sort((a, b) => b.financialHealthScore - a.financialHealthScore);
    case "growthReadinessScore": return sorted.sort((a, b) => b.growthReadinessScore - a.growthReadinessScore);
    case "riskLow":            return sorted.sort((a, b) => RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel]);
    case "fundingLow":         return sorted.sort((a, b) => a.fundingNeedMin - b.fundingNeedMin);
    case "fundingHigh":        return sorted.sort((a, b) => b.fundingNeedMax - a.fundingNeedMax);
    default:                   return sorted;
  }
}

/** Rule-based "why this profile stands out" generator — no AI, no external APIs. */
export function getStandoutReasons(profile: RankedProfile): string[] {
  const reasons: string[] = [];
  if (profile.greenScore >= 80)            reasons.push("Strong sustainability performance");
  if (profile.financialHealthScore >= 80)  reasons.push("Strong financial health indicators");
  if (profile.growthReadinessScore >= 80)  reasons.push("High growth readiness");
  if (profile.riskLevel === "Low")         reasons.push("Lower platform-indicated risk level");
  if (profile.fintwinScore >= 80)          reasons.push("High overall FinTwin score");
  if (profile.verified)                    reasons.push("Verified profile");
  if ((profile.yearsOperating ?? 0) >= 5)  reasons.push(`${profile.yearsOperating} years of operating history`);
  if (reasons.length === 0)               reasons.push("Active participant in the FinTwin platform");
  return reasons;
}
