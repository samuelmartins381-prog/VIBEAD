export interface AdPlacement {
  id: string;
  html: string;
}

/**
 * Abstraction over an ad network. The MVP ships MockAdProvider only;
 * swapping in AdSense or another network later means implementing this
 * interface, not rewriting call sites.
 */
export interface AdProvider {
  initialize(config: Record<string, unknown>): Promise<void>;
  render(placementId: string): Promise<AdPlacement>;
  trackImpression(placementId: string): Promise<void>;
  trackClick(placementId: string): Promise<void>;
}

export class MockAdProvider implements AdProvider {
  async initialize(): Promise<void> {
    // No-op: nothing to authenticate against for the mock provider.
  }

  async render(placementId: string): Promise<AdPlacement> {
    return {
      id: placementId,
      html: `<div style="padding:12px;border:1px dashed #d4d4d8;border-radius:8px;font:12px sans-serif;color:#71717a;text-align:center">Demo ad placement (${placementId})</div>`,
    };
  }

  async trackImpression(): Promise<void> {
    // No-op for the mock provider — real events go through /api/events.
  }

  async trackClick(): Promise<void> {
    // No-op for the mock provider — real events go through /api/events.
  }
}
