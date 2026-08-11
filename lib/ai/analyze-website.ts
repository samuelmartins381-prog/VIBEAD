import "server-only";
import { getAnthropicClient } from "@/lib/ai/client";
import { AUDIT_ANALYSIS_JSON_SCHEMA, auditAnalysisSchema, type AuditAnalysis } from "@/lib/ai/schema";
import type { CrawlResult } from "@/lib/crawler/crawl";

const MODEL = "claude-opus-5";

export class AiRefusalError extends Error {
  category: string | null;
  constructor(category: string | null) {
    super(`Analysis was declined by the model's safety classifiers${category ? ` (${category})` : ""}`);
    this.category = category;
  }
}

export class AiAnalysisError extends Error {}

const SYSTEM_PROMPT = `You are the monetization analyst inside MonetizeOS, a product that audits websites built by independent creators and recommends how to monetize them.

You will be given structured data crawled from a website: its title, meta description, headings, a sample of its body text, calls-to-action, pricing-related text found on the page, form signals, and markers of monetization already present (ad scripts, affiliate links, payment/donation links).

Produce an honest, evidence-based assessment. Ground every judgment in the data you were given — do not invent details about the site that weren't provided, and do not assume traffic volume you have no evidence for.

Critical rules:
- Real traffic numbers are never provided to you. Always state in "traffic_note" that traffic data is unavailable and that estimates are scenario-based assumptions, not measurements.
- "estimated_revenue" is always a hypothetical scenario, never a promise. Say so explicitly in "basis".
- If the site shows little content, thin traffic signals (few internal links, no pricing page, no existing monetization, generic or sparse copy), recommended_model should still reflect the best-fit model in principle, but recommendations should prioritize SEO, content, and audience-acquisition steps over aggressive monetization — monetizing near-zero traffic is not useful advice.
- Prefer 2-4 recommendations, ranked by priority, each with a concrete implementation reason grounded in the site's actual data.
- currency is "EUR" and period is "monthly" unless the site's own pricing text clearly uses another currency.`;

function buildUserPrompt(crawl: CrawlResult, goal?: string): string {
  const lines = [
    `Website: ${crawl.domain}`,
    goal ? `User's stated goal: ${goal}` : null,
    `Title: ${crawl.title || "(none found)"}`,
    `Meta description: ${crawl.metaDescription || "(none found)"}`,
    `Headings: ${crawl.headings.map((h) => `H${h.level}: ${h.text}`).join(" | ") || "(none found)"}`,
    `Pages crawled: ${crawl.pagesCrawled.length}`,
    `Internal links found: ${crawl.internalLinkCount}, external links: ${crawl.externalLinkCount}`,
    `Has a pricing/plans page: ${crawl.hasPricingPage}`,
    `Pricing-like text found on page: ${crawl.pricingSignals.join(", ") || "(none)"}`,
    `Calls-to-action found: ${crawl.ctas.join(", ") || "(none)"}`,
    `Forms: ${crawl.forms.totalForms} total, has email capture: ${crawl.forms.hasEmailField}, has payment-like field: ${crawl.forms.hasPaymentLikeField}`,
    `Existing monetization markers detected: ${crawl.existingMonetization.join(", ") || "(none)"}`,
    `Body text sample:\n${crawl.bodyTextSample.slice(0, 6000)}`,
  ]
    .filter((l): l is string => Boolean(l))
    .join("\n");

  return `Analyze this website and produce the monetization assessment.\n\n${lines}`;
}

export async function analyzeWebsite(crawl: CrawlResult, goal?: string): Promise<AuditAnalysis> {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: AUDIT_ANALYSIS_JSON_SCHEMA },
    },
    messages: [{ role: "user", content: buildUserPrompt(crawl, goal) }],
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError(response.stop_details?.category ?? null);
  }

  if (response.stop_reason === "max_tokens") {
    throw new AiAnalysisError("The analysis response was truncated. Please try again.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new AiAnalysisError("The model did not return a text response.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    throw new AiAnalysisError("The model's response was not valid JSON.");
  }

  const result = auditAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiAnalysisError(`The model's response didn't match the expected shape: ${result.error.message}`);
  }

  return result.data;
}
