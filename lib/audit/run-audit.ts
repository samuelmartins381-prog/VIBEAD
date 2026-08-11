import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { crawlWebsite, CrawlError } from "@/lib/crawler/crawl";
import { SsrfBlockedError } from "@/lib/security/ssrf";
import { analyzeWebsite, AiRefusalError, AiAnalysisError } from "@/lib/ai/analyze-website";
import { buildMonetizationResult } from "@/lib/monetization/engine";

/**
 * Runs the full audit pipeline (crawl -> AI analysis -> monetization
 * engine) for a website and persists the result. Never throws — any
 * failure is recorded on the audit row as status 'failed' so the UI can
 * show it, since this typically runs synchronously inside the onboarding
 * server action.
 */
export async function runAudit(websiteId: string, auditId: string): Promise<void> {
  const supabase = createAdminClient();

  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .select("id, url")
    .eq("id", websiteId)
    .single();

  if (websiteError || !website) {
    await supabase.from("audits").update({ status: "failed", error_message: "Website not found" }).eq("id", auditId);
    return;
  }

  const { data: existingAudit } = await supabase.from("audits").select("analysis").eq("id", auditId).single();
  const goal =
    existingAudit?.analysis && typeof existingAudit.analysis === "object" && "goal" in existingAudit.analysis
      ? String((existingAudit.analysis as Record<string, unknown>).goal)
      : undefined;

  try {
    await supabase.from("audits").update({ status: "crawling" }).eq("id", auditId);
    const crawl = await crawlWebsite(website.url);

    await supabase.from("audits").update({ status: "analyzing" }).eq("id", auditId);
    const aiAnalysis = await analyzeWebsite(crawl, goal);

    const result = buildMonetizationResult(crawl, aiAnalysis);

    await supabase
      .from("audits")
      .update({
        status: "completed",
        score: result.score,
        analysis: {
          business_type: aiAnalysis.business_type,
          target_audience: aiAnalysis.target_audience,
          primary_use_case: aiAnalysis.primary_use_case,
          traffic_note: aiAnalysis.traffic_note,
          suitability: result.suitability,
          pages_crawled: crawl.pagesCrawled,
          goal: goal ?? null,
        },
        monetization_recommendation: {
          primary_model: result.primaryModel,
          secondary_model: result.secondaryModel,
          reason: result.primaryReason,
          traffic_constrained: result.trafficConstrained,
        },
        estimated_low: result.estimatedRevenue?.low ?? null,
        estimated_mid: result.estimatedRevenue?.mid ?? null,
        estimated_high: result.estimatedRevenue?.high ?? null,
        estimated_currency: result.estimatedRevenue?.currency ?? "EUR",
        completed_at: new Date().toISOString(),
      })
      .eq("id", auditId);

    if (result.recommendations.length > 0) {
      await supabase.from("recommendations").insert(
        result.recommendations.map((r) => ({
          audit_id: auditId,
          type: r.type,
          title: r.title,
          description: `${r.description}\n\nWhy: ${r.reason}`,
          priority: r.priority,
          estimated_impact: r.expectedImpact,
        }))
      );
    }
  } catch (err) {
    const message = describeAuditError(err);
    await supabase.from("audits").update({ status: "failed", error_message: message }).eq("id", auditId);
  }
}

function describeAuditError(err: unknown): string {
  if (err instanceof SsrfBlockedError) return `This URL can't be crawled: ${err.message}`;
  if (err instanceof CrawlError) return err.message;
  if (err instanceof AiRefusalError) return err.message;
  if (err instanceof AiAnalysisError) return err.message;
  console.error("Unexpected audit pipeline error", err);
  return "Something went wrong while analyzing this website. Please try again.";
}
