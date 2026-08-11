import type { MonetizationSignals, SuitabilityScores } from "@/lib/monetization/signals";

export type MonetizationModel = "advertising" | "affiliate" | "subscription" | "lead_generation" | "sponsorship" | "none";

export interface RuleDecision {
  primaryModel: MonetizationModel;
  secondaryModel: MonetizationModel | null;
  primaryReason: string;
  trafficConstrained: boolean;
}

const MIN_TRAFFIC_PROXY_FOR_MONETIZATION = 15;

/**
 * Deterministic, LLM-independent decision rules. This mirrors the product
 * spec's IF/THEN monetization logic: the engine — not the AI — decides the
 * primary/secondary model, using structural signals extracted by the
 * crawler and the AI's business-type classification. The AI's job is to
 * explain and flesh out recommendations, not to pick the model.
 */
export function decidePrimaryModel(signals: MonetizationSignals): RuleDecision {
  if (signals.trafficProxy < MIN_TRAFFIC_PROXY_FOR_MONETIZATION) {
    return {
      primaryModel: "none",
      secondaryModel: null,
      primaryReason:
        "Traffic and engagement signals are currently too thin to monetize effectively. Growing an audience will do more for revenue right now than adding a monetization method.",
      trafficConstrained: true,
    };
  }

  if (signals.hasPricing && (signals.isUtilityLike || signals.isCommerceLike) && signals.contentVolume >= 20) {
    return {
      primaryModel: "subscription",
      secondaryModel: signals.hasCommercialCta ? "affiliate" : "advertising",
      primaryReason:
        "The site already signals recurring value (a pricing page and utility/product content), which favors a subscription over one-off ad revenue.",
      trafficConstrained: false,
    };
  }

  if (signals.hasCommercialCta && signals.isContentLike) {
    return {
      primaryModel: "affiliate",
      secondaryModel: "advertising",
      primaryReason:
        "Visitors show commercial intent (comparison/purchase-style calls to action) on content-oriented pages — a strong fit for affiliate placements.",
      trafficConstrained: false,
    };
  }

  if (signals.hasLeadCapture && !signals.hasPaymentCapture) {
    return {
      primaryModel: "lead_generation",
      secondaryModel: signals.isCommerceLike ? "subscription" : "advertising",
      primaryReason:
        "The site captures visitor contact information without processing payment, which points to selling qualified leads rather than direct monetization.",
      trafficConstrained: false,
    };
  }

  if (signals.isCommunityLike) {
    return {
      primaryModel: "sponsorship",
      secondaryModel: "advertising",
      primaryReason: "The site centers on a community or audience, which sponsors typically value more than raw ad inventory.",
      trafficConstrained: false,
    };
  }

  if (signals.isUtilityLike || signals.isContentLike) {
    return {
      primaryModel: "advertising",
      secondaryModel: signals.hasCommercialCta ? "affiliate" : null,
      primaryReason:
        "The site provides utility-oriented content with repeat visits — ads can monetize that traffic without introducing a paywall.",
      trafficConstrained: false,
    };
  }

  return {
    primaryModel: "advertising",
    secondaryModel: null,
    primaryReason: "No stronger monetization signal was found, so advertising is the lowest-friction starting point.",
    trafficConstrained: false,
  };
}

export function computeOverallScore(suitability: SuitabilityScores, signals: MonetizationSignals, primary: MonetizationModel): number {
  const bestSuitability = primary === "none" ? 0 : suitability[primary as keyof SuitabilityScores] ?? 0;
  const score =
    signals.trafficProxy * 0.35 +
    suitability.conversionPotential * 0.25 +
    bestSuitability * 0.2 +
    signals.contentVolume * 0.2;
  return Math.max(0, Math.min(100, Math.round(score)));
}
