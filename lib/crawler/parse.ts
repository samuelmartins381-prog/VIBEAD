import * as cheerio from "cheerio";

export interface PageData {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: number; text: string }[];
  bodyText: string;
  internalLinks: string[];
  externalLinks: string[];
  ctas: string[];
  forms: { hasEmailField: boolean; hasPaymentLikeField: boolean; count: number };
  pricingSignals: string[];
  hasPricingPage: boolean;
  existingMonetization: string[];
}

const CTA_PATTERN =
  /\b(buy now|sign up|get started|start free|subscribe|upgrade|book a demo|contact sales|try (it )?free|start (my |your )?trial|add to cart|download now|join now|claim (your )?offer)\b/i;

const PRICE_PATTERN = /(?:€|\$|£)\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:eur|usd|gbp)\b/gi;

const AD_MARKERS = ["adsbygoogle", "doubleclick", "media.net", "googlesyndication", "carbonads"];
const AFFILIATE_MARKERS = ["/ref=", "?ref=", "affiliate", "partnerize", "impact.com", "shareasale", "cj.com"];
const PAYMENT_MARKERS = [
  "stripe.com",
  "gumroad.com",
  "patreon.com",
  "buymeacoffee.com",
  "ko-fi.com",
  "paypal.me",
  "lemonsqueezy.com",
];

function matchAny(haystack: string, markers: string[]): string[] {
  const lower = haystack.toLowerCase();
  return markers.filter((m) => lower.includes(m));
}

export function parsePage(html: string, pageUrl: string): PageData {
  const $ = cheerio.load(html);
  const base = new URL(pageUrl);

  // Scan the untouched markup for monetization markers before stripping
  // <script> tags below — ad/affiliate scripts live in exactly those tags.
  const existingMonetization = Array.from(
    new Set([...matchAny(html, AD_MARKERS), ...matchAny(html, AFFILIATE_MARKERS), ...matchAny(html, PAYMENT_MARKERS)])
  );

  $("script, style, noscript").remove();

  const title = $("title").first().text().trim().slice(0, 300);
  const metaDescription = $('meta[name="description"]').attr("content")?.trim().slice(0, 500) ?? "";

  const headings: { level: number; text: string }[] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text) {
      headings.push({ level: Number(el.tagName.slice(1)), text: text.slice(0, 200) });
    }
  });

  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);

  const internalLinks = new Set<string>();
  const externalLinks = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    try {
      const resolved = new URL(href, base);
      if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return;
      resolved.hash = "";
      if (resolved.hostname === base.hostname) {
        internalLinks.add(resolved.toString());
      } else {
        externalLinks.add(resolved.toString());
      }
    } catch {
      // ignore malformed hrefs
    }
  });

  const ctas = new Set<string>();
  $("a, button").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text && CTA_PATTERN.test(text)) {
      ctas.add(text.slice(0, 80));
    }
  });

  let hasEmailField = false;
  let hasPaymentLikeField = false;
  const formCount = $("form").length;
  $("form input").each((_, el) => {
    const type = ($(el).attr("type") || "").toLowerCase();
    const name = ($(el).attr("name") || "").toLowerCase();
    if (type === "email" || name.includes("email")) hasEmailField = true;
    if (["card", "cardnumber", "cc-number"].some((k) => name.includes(k))) hasPaymentLikeField = true;
  });

  const pricingSignals = Array.from(new Set(bodyText.match(PRICE_PATTERN) ?? [])).slice(0, 20);
  const hasPricingPage = Array.from(internalLinks).some((l) => /\/pricing|\/plans/i.test(l));

  return {
    url: pageUrl,
    title,
    metaDescription,
    headings: headings.slice(0, 30),
    bodyText,
    internalLinks: Array.from(internalLinks),
    externalLinks: Array.from(externalLinks).slice(0, 30),
    ctas: Array.from(ctas),
    forms: { hasEmailField, hasPaymentLikeField, count: formCount },
    pricingSignals,
    hasPricingPage,
    existingMonetization,
  };
}
