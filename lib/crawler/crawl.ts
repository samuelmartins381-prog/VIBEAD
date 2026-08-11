import "server-only";
import { safeFetch, CrawlFetchError } from "@/lib/crawler/safe-fetch";
import { loadRobotsCheck } from "@/lib/crawler/robots";
import { parsePage, type PageData } from "@/lib/crawler/parse";
import { assertPublicUrl, SsrfBlockedError } from "@/lib/security/ssrf";

const MAX_PAGES = 4;
const MIN_DELAY_BETWEEN_REQUESTS_MS = 400;

export class CrawlError extends Error {}

export interface CrawlResult {
  startUrl: string;
  finalUrl: string;
  domain: string;
  pagesCrawled: string[];
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  bodyTextSample: string;
  ctas: string[];
  pricingSignals: string[];
  hasPricingPage: boolean;
  existingMonetization: string[];
  forms: { hasEmailField: boolean; hasPaymentLikeField: boolean; totalForms: number };
  internalLinkCount: number;
  externalLinkCount: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAndParse(url: string): Promise<PageData> {
  const res = await safeFetch(url);
  if (res.status < 200 || res.status >= 300) {
    throw new CrawlError(`Received HTTP ${res.status} for ${url}`);
  }
  const contentType = res.headers["content-type"];
  if (contentType && !String(contentType).includes("html")) {
    throw new CrawlError(`Unsupported content type for ${url}`);
  }
  return parsePage(res.body, res.finalUrl || url);
}

/**
 * Crawls a small, bounded set of pages on a single site: the homepage plus
 * a handful of same-origin links it discovers there. Every request goes
 * through the SSRF-safe fetcher, honors robots.txt, and is rate-limited and
 * capped so a malicious or misbehaving target site can't turn this into a
 * denial-of-service vector against our own infrastructure.
 */
export async function crawlWebsite(startUrl: string): Promise<CrawlResult> {
  const { url } = await assertPublicUrl(startUrl);
  const origin = url.origin;

  const robots = await loadRobotsCheck(origin);
  if (!robots.isAllowed(url.toString())) {
    throw new CrawlError("robots.txt disallows crawling this URL");
  }

  const homepage = await fetchAndParse(url.toString());
  const pages: PageData[] = [homepage];

  const candidateLinks = homepage.internalLinks
    .filter((link) => link !== homepage.url && robots.isAllowed(link))
    .slice(0, MAX_PAGES - 1);

  for (const link of candidateLinks) {
    await sleep(Math.max(MIN_DELAY_BETWEEN_REQUESTS_MS, robots.crawlDelayMs));
    try {
      const page = await fetchAndParse(link);
      pages.push(page);
    } catch (err) {
      if (err instanceof SsrfBlockedError || err instanceof CrawlFetchError || err instanceof CrawlError) {
        continue; // skip pages we can't safely fetch, don't fail the whole crawl
      }
      throw err;
    }
  }

  const internalLinkCount = new Set(pages.flatMap((p) => p.internalLinks)).size;
  const externalLinkCount = new Set(pages.flatMap((p) => p.externalLinks)).size;

  return {
    startUrl,
    finalUrl: homepage.url,
    domain: url.hostname,
    pagesCrawled: pages.map((p) => p.url),
    title: homepage.title,
    metaDescription: homepage.metaDescription,
    headings: pages.flatMap((p) => p.headings).slice(0, 60),
    bodyTextSample: pages
      .map((p) => p.bodyText)
      .join("\n\n")
      .slice(0, 12000),
    ctas: Array.from(new Set(pages.flatMap((p) => p.ctas))),
    pricingSignals: Array.from(new Set(pages.flatMap((p) => p.pricingSignals))).slice(0, 20),
    hasPricingPage: pages.some((p) => p.hasPricingPage),
    existingMonetization: Array.from(new Set(pages.flatMap((p) => p.existingMonetization))),
    forms: {
      hasEmailField: pages.some((p) => p.forms.hasEmailField),
      hasPaymentLikeField: pages.some((p) => p.forms.hasPaymentLikeField),
      totalForms: pages.reduce((sum, p) => sum + p.forms.count, 0),
    },
    internalLinkCount,
    externalLinkCount,
  };
}
