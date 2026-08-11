export interface AffiliateLink {
  url: string;
  campaignId: string;
}

/**
 * Abstraction over an affiliate network. The MVP ships
 * MockAffiliateProvider with demo links only — real network integrations
 * (Amazon Associates, Impact, etc.) implement this same interface.
 */
export interface AffiliateProvider {
  generateLink(destinationUrl: string, campaignId: string): Promise<AffiliateLink>;
  trackClick(campaignId: string): Promise<void>;
  trackConversion(campaignId: string, amount: number): Promise<void>;
  getRevenue(campaignId: string): Promise<number>;
}

export class MockAffiliateProvider implements AffiliateProvider {
  async generateLink(destinationUrl: string, campaignId: string): Promise<AffiliateLink> {
    const url = new URL(destinationUrl);
    url.searchParams.set("ref", `monetizeos-${campaignId}`);
    return { url: url.toString(), campaignId };
  }

  async trackClick(): Promise<void> {
    // No-op for the mock provider — real events go through /api/events.
  }

  async trackConversion(): Promise<void> {
    // No-op for the mock provider — real events go through /api/events.
  }

  async getRevenue(): Promise<number> {
    return 0;
  }
}
