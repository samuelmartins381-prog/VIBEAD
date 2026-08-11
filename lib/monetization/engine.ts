import type { CrawlResult } from "@/lib/crawler/crawl";
import type { AuditAnalysis } from "@/lib/ai/schema";
import { deriveSignals, computeSuitability, type SuitabilityScores } from "@/lib/monetization/signals";
import { decidePrimaryModel, computeOverallScore, type MonetizationModel } from "@/lib/monetization/rules";

export interface EngineRecommendation {
  type: string;
  title: string;
  description: string;
  reason: string;
  priority: "high" | "medium" | "low";
  implementationDifficulty: "high" | "medium" | "low";
  expectedImpact: "high" | "medium" | "low";
}

export interface MonetizationResult {
  score: number;
  primaryModel: MonetizationModel;
  secondaryModel: MonetizationModel | null;
  primaryReason: string;
  trafficConstrained: boolean;
  suitability: SuitabilityScores;
  recommendations: EngineRecommendation[];
  estimatedRevenue: { low: number; mid: number; high: number; currency: string; period: string; basis: string } | null;
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 } as const;
const GROWTH_TYPES = new Set(["seo", "conversion", "retention", "other"]);

/**
 * Combines the deterministic rules engine (which owns the primary/secondary
 * model decision — see lib/monetization/rules.ts) with the AI's grounded,
 * per-site recommendations and revenue scenario. The AI never decides the
 * model; it explains and elaborates on evidence the engine already used.
 */
export function buildMonetizationResult(crawl: CrawlResult, ai: AuditAnalysis): MonetizationResult {
  const signals = deriveSignals(crawl, ai.business_type);
  const suitability = computeSuitability(signals);
  const decision = decidePrimaryModel(signals);
  const score = computeOverallScore(suitability, signals, decision.primaryModel);

  const aiRecommendations: EngineRecommendation[] = ai.recommendations.map((r) => ({
    type: r.type,
    title: r.title,
    description: r.description,
    reason: r.reason,
    priority: r.priority,
    implementationDifficulty: r.implementation_difficulty,
    expectedImpact: r.expected_impact,
  }));

  let recommendations: EngineRecommendation[];
  if (decision.trafficConstrained) {
    const growthRecommendations = aiRecommendations.filter((r) => GROWTH_TYPES.has(r.type));
    recommendations =
      growthRecommendations.length > 0
        ? growthRecommendations
        : [
            {
              type: "seo",
              title: "Grow your audience before monetizing",
              description:
                "Traffic is currently the main constraint. Focus on SEO, content, and distribution to build an audience worth monetizing.",
              reason: decision.primaryReason,
              priority: "high",
              implementationDifficulty: "medium",
              expectedImpact: "high",
            },
          ];
  } else {
    recommendations = [...aiRecommendations].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  return {
    score,
    primaryModel: decision.primaryModel,
    secondaryModel: decision.secondaryModel,
    primaryReason: decision.primaryReason,
    trafficConstrained: decision.trafficConstrained,
    suitability,
    recommendations,
    estimatedRevenue: decision.trafficConstrained ? null : { ...ai.estimated_revenue },
  };
}
