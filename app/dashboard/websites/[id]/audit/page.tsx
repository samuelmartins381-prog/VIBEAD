import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WebsiteSubnav } from "@/components/dashboard/website-subnav";

const MODEL_LABELS: Record<string, string> = {
  advertising: "Advertising",
  affiliate: "Affiliate",
  subscription: "Subscription",
  lead_generation: "Lead generation",
  sponsorship: "Sponsorship",
  seo: "SEO / content",
  conversion: "Conversion",
  retention: "Retention",
  other: "Other",
  none: "Not yet — grow traffic first",
};

function modelLabel(model: string | null | undefined): string {
  if (!model) return "—";
  return MODEL_LABELS[model] ?? model;
}

export default async function AuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: website } = await supabase
    .from("websites")
    .select("id, url, domain, name")
    .eq("id", id)
    .single();

  if (!website) {
    notFound();
  }

  const { data: audit } = await supabase
    .from("audits")
    .select(
      "id, status, score, analysis, monetization_recommendation, estimated_low, estimated_mid, estimated_high, estimated_currency, error_message, created_at"
    )
    .eq("website_id", website.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: recommendations } = audit
    ? await supabase
        .from("recommendations")
        .select("id, type, title, description, priority, estimated_impact")
        .eq("audit_id", audit.id)
        .order("created_at", { ascending: true })
    : { data: null };

  const analysis = (audit?.analysis ?? {}) as Record<string, unknown>;
  const monetization = (audit?.monetization_recommendation ?? {}) as Record<string, unknown>;
  const trafficConstrained = monetization.traffic_constrained === true;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-zinc-500">{website.domain}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Monetization audit</h1>
      <div className="mt-4">
        <WebsiteSubnav websiteId={website.id} active="audit" />
      </div>

      {!audit ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No audit has been started for this website yet.
        </div>
      ) : audit.status === "completed" ? (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-1 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Monetization score</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-zinc-900">{audit.score ?? "—"}</p>
              <p className="text-sm text-zinc-400">/ 100</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Best opportunity</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">
                {modelLabel(monetization.primary_model as string | undefined)}
              </p>
              {monetization.secondary_model ? (
                <p className="mt-1 text-sm text-zinc-500">
                  Secondary: {modelLabel(monetization.secondary_model as string)}
                </p>
              ) : null}
            </div>
            <div className="p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Estimated potential</p>
              {trafficConstrained || audit.estimated_low == null ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Not estimated — traffic is currently the main constraint.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-lg font-semibold text-zinc-900">
                    {audit.estimated_currency ?? "EUR"} {audit.estimated_low}–{audit.estimated_high}/month
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">*Scenario estimate, not guaranteed revenue.</p>
                </>
              )}
            </div>
          </div>

          {monetization.reason ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <p className="text-sm font-medium text-zinc-900">Why this recommendation</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-600">{String(monetization.reason)}</p>
              {typeof analysis.traffic_note === "string" ? (
                <p className="mt-3 text-xs text-zinc-400">{analysis.traffic_note}</p>
              ) : null}
            </div>
          ) : null}

          {recommendations && recommendations.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="border-b border-zinc-200 px-6 py-4">
                <p className="text-sm font-medium text-zinc-900">Opportunities</p>
              </div>
              <div className="divide-y divide-zinc-200">
                {recommendations.map((r) => (
                  <div key={r.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-zinc-900">{r.title}</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-zinc-500">{r.description}</p>
                    </div>
                    <div className="flex shrink-0 gap-2 text-xs">
                      <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium uppercase text-zinc-600">
                        {r.priority} priority
                      </span>
                      {r.estimated_impact ? (
                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium uppercase text-zinc-600">
                          {r.estimated_impact} impact
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : audit.status === "failed" ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          {audit.error_message || "The analysis failed. Please try again or check that your website is reachable."}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 animate-pulse rounded-full bg-zinc-900" />
            <p className="text-sm font-medium text-zinc-900">
              {audit.status === "crawling"
                ? "Crawling website…"
                : audit.status === "analyzing"
                  ? "Analyzing monetization…"
                  : "Queued for analysis…"}
            </p>
          </div>
          <p className="mt-3 text-sm text-zinc-500">
            This usually takes under a minute. You can leave this page — we&apos;ll keep working in the
            background.
          </p>
        </div>
      )}
    </div>
  );
}
