import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWebsiteAnalytics } from "@/lib/analytics/aggregate";
import { EventsChart } from "@/components/analytics/events-chart";
import { WebsiteSubnav } from "@/components/dashboard/website-subnav";

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-400">{hint}</p> : null}
    </div>
  );
}

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: website } = await supabase.from("websites").select("id, domain, name").eq("id", id).single();
  if (!website) {
    notFound();
  }

  const analytics = await getWebsiteAnalytics(supabase, website.id, 30);
  const hasData = analytics.totalPageviews + analytics.totalClicks + analytics.totalOtherEvents > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-zinc-500">{website.domain}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">Last 30 days &middot; real data from your tracking snippet</p>
        <div className="mt-4">
          <WebsiteSubnav websiteId={website.id} active="analytics" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Pageviews" value={String(analytics.totalPageviews)} />
        <StatCard label="Clicks" value={String(analytics.totalClicks)} />
        <StatCard label="Revenue" value="€0" hint="No monetization connected yet" />
        <StatCard label="Conversions" value="—" hint="Requires a connected integration" />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <p className="mb-4 text-sm font-medium text-zinc-900">Events over time</p>
        {hasData ? (
          <EventsChart series={analytics.series} />
        ) : (
          <div className="flex h-64 items-center justify-center text-center text-sm text-zinc-500">
            No events yet.{" "}
            <Link href={`/dashboard/websites/${website.id}`} className="ml-1 font-medium text-zinc-900 hover:underline">
              Install the tracking snippet
            </Link>
            &nbsp;to start seeing data.
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-400">
        RPM, CTR, and revenue require an ad or affiliate integration to be connected — this MVP tracks real
        pageviews and clicks but doesn&apos;t fabricate monetization numbers that aren&apos;t happening yet.
      </p>
    </div>
  );
}
