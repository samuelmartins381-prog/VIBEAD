import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: websites } = await supabase
    .from("websites")
    .select("id, url, domain, name, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Your websites</h1>
        <Link
          href="/onboarding"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Analyze a website
        </Link>
      </div>

      {!websites || websites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-16 text-center">
          <p className="text-sm text-zinc-500">
            You haven&apos;t added a website yet. Analyze one to get your first monetization audit.
          </p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Analyze my website
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((site) => (
            <Link
              key={site.id}
              href={`/dashboard/websites/${site.id}`}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
            >
              <p className="font-medium text-zinc-900">{site.name || site.domain}</p>
              <p className="mt-1 truncate text-sm text-zinc-500">{site.url}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
