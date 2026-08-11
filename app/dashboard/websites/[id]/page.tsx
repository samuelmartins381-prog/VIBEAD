import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import { CopySnippet } from "@/components/dashboard/copy-snippet";
import { WebsiteSubnav } from "@/components/dashboard/website-subnav";
import { ConfirmSubmitButton } from "@/components/dashboard/confirm-submit-button";
import { deleteWebsite } from "@/lib/websites/actions";

export default async function WebsiteOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: website } = await supabase
    .from("websites")
    .select("id, url, domain, name, site_key")
    .eq("id", id)
    .single();

  if (!website) {
    notFound();
  }

  const [{ data: integration }, { data: events }, { count: eventCount }] = await Promise.all([
    supabase.from("integrations").select("status").eq("website_id", website.id).eq("type", "tracking_sdk").maybeSingle(),
    supabase
      .from("events")
      .select("id, type, created_at")
      .eq("website_id", website.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("website_id", website.id),
  ]);

  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL ?? "https://your-domain.example.com";
  const snippet = `<script src="${siteUrl}/sdk.js" data-site-id="${website.site_key}"></script>`;
  const isActive = integration?.status === "active";

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-zinc-500">{website.domain}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">{website.name || website.domain}</h1>
      <div className="mt-4">
        <WebsiteSubnav websiteId={website.id} active="overview" />
      </div>

      <div className="space-y-8">

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-900">Tracking snippet</p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              isActive ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
            {isActive ? "Active" : "Not installed yet"}
          </span>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Paste this snippet before the closing <code className="text-xs">&lt;/body&gt;</code> tag on every page of
          your site. It tracks pageviews and clicks — no cookies, no persistent visitor ID.
        </p>
        <div className="mt-4">
          <CopySnippet snippet={snippet} />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-900">Recent events</p>
          <span className="text-xs text-zinc-400">{eventCount ?? 0} total</span>
        </div>
        {!events || events.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-500">
            No events yet. Once the snippet is installed, pageviews and clicks will show up here.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-zinc-100">
            {events.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-medium text-zinc-700">{e.type}</span>
                <span className="text-zinc-400">{new Date(e.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6">
        <p className="text-sm font-medium text-zinc-900">Danger zone</p>
        <p className="mt-1 text-sm text-zinc-500">
          Permanently deletes this website along with its audits, recommendations, and tracked events. This
          cannot be undone.
        </p>
        <form action={deleteWebsite.bind(null, website.id)} className="mt-4">
          <ConfirmSubmitButton
            confirmMessage={`Delete ${website.domain} and all of its data? This can't be undone.`}
            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Delete website
          </ConfirmSubmitButton>
        </form>
      </div>
      </div>
    </div>
  );
}
