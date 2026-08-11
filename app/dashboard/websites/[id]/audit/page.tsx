import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
    .select("id, status, score, monetization_recommendation, estimated_low, estimated_high, estimated_currency, created_at")
    .eq("website_id", website.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-zinc-500">{website.domain}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Monetization audit</h1>

      {!audit ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          No audit has been started for this website yet.
        </div>
      ) : audit.status === "completed" ? (
        <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Monetization score</p>
          <p className="mt-2 text-5xl font-semibold tracking-tight text-zinc-900">{audit.score ?? "—"}</p>
        </div>
      ) : audit.status === "failed" ? (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-8 text-sm text-red-700">
          The analysis failed. Please try again or check that your website is reachable.
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
