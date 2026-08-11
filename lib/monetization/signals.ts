import type { CrawlResult } from "@/lib/crawler/crawl";

export interface MonetizationSignals {
  hasPricing: boolean;
  hasCommercialCta: boolean;
  hasLeadCapture: boolean;
  hasPaymentCapture: boolean;
  alreadyMonetized: boolean;
  isUtilityLike: boolean;
  isContentLike: boolean;
  isCommerceLike: boolean;
  isCommunityLike: boolean;
  /** 0-100 proxy for traffic/engagement — we have no real analytics at audit time. */
  trafficProxy: number;
  /** 0-100 proxy for how much substantive content the site has. */
  contentVolume: number;
}

const COMMERCIAL_CTA_PATTERN = /buy|subscribe|upgrade|trial|add to cart|book a demo|contact sales|join now/i;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function deriveSignals(crawl: CrawlResult, businessType: string): MonetizationSignals {
  const type = businessType.toLowerCase();

  return {
    hasPricing: crawl.hasPricingPage || crawl.pricingSignals.length > 0,
    hasCommercialCta: crawl.ctas.some((c) => COMMERCIAL_CTA_PATTERN.test(c)),
    hasLeadCapture: crawl.forms.hasEmailField && !crawl.forms.hasPaymentLikeField,
    hasPaymentCapture: crawl.forms.hasPaymentLikeField,
    alreadyMonetized: crawl.existingMonetization.length > 0,
    isUtilityLike: ["utility", "tool", "saas", "educational"].some((t) => type.includes(t)),
    isContentLike: ["blog", "directory", "community", "educational"].some((t) => type.includes(t)),
    isCommerceLike: type.includes("ecommerce") || type.includes("saas"),
    isCommunityLike: type.includes("community"),
    trafficProxy: clamp(crawl.internalLinkCount * 4 + crawl.pagesCrawled.length * 8),
    contentVolume: clamp(crawl.headings.length * 4 + crawl.bodyTextSample.length / 100),
  };
}

export interface SuitabilityScores {
  advertising: number;
  affiliate: number;
  subscription: number;
  lead_generation: number;
  sponsorship: number;
  conversionPotential: number;
  monetizationMaturity: number;
}

export function computeSuitability(signals: MonetizationSignals): SuitabilityScores {
  const {
    hasPricing,
    hasCommercialCta,
    hasLeadCapture,
    isUtilityLike,
    isContentLike,
    isCommerceLike,
    isCommunityLike,
    trafficProxy,
    contentVolume,
    alreadyMonetized,
  } = signals;

  const advertising = clamp(
    30 + (isUtilityLike ? 25 : 0) + (isContentLike ? 20 : 0) + trafficProxy * 0.25 - (isCommerceLike ? 10 : 0)
  );
  const subscription = clamp(
    20 + ((isUtilityLike || isCommerceLike) ? 25 : 0) + (hasPricing ? 25 : 0) + contentVolume * 0.15
  );
  const affiliate = clamp(20 + (hasCommercialCta ? 30 : 0) + (isContentLike ? 15 : 0) + (hasPricing ? 10 : 0));
  const lead_generation = clamp(15 + (hasLeadCapture ? 35 : 0) + (isCommerceLike ? 10 : 0) + trafficProxy * 0.1);
  const sponsorship = clamp(10 + (isCommunityLike ? 40 : 0) + contentVolume * 0.2);

  const conversionPotential = clamp(
    (hasCommercialCta ? 35 : 0) + (hasPricing ? 30 : 0) + (hasLeadCapture ? 20 : 0) + trafficProxy * 0.15
  );
  const monetizationMaturity = clamp(alreadyMonetized ? 65 + Math.min(signals.trafficProxy, 20) : 15);

  return { advertising, affiliate, subscription, lead_generation, sponsorship, conversionPotential, monetizationMaturity };
}
