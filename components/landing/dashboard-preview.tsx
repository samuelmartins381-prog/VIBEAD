const sites = [
  { domain: "example.com", score: 78, opportunity: "Ads + Affiliate", revenue: "€243/mo", status: "Optimizing" },
  { domain: "quiz-app.io", score: 64, opportunity: "Lead generation", revenue: "€90/mo", status: "Active" },
  { domain: "toolkit.dev", score: 41, opportunity: "SEO first", revenue: "—", status: "Growing traffic" },
];

export function DashboardPreview() {
  return (
    <section className="border-b border-zinc-200 bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">One dashboard, every site</h2>
          <p className="mt-3 text-zinc-500">Track score, opportunity, and revenue across everything you own.</p>
        </div>

        <div className="mt-14 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 shadow-sm sm:p-6">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="grid grid-cols-4 gap-4 border-b border-zinc-200 px-6 py-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
              <span>Website</span>
              <span>Score</span>
              <span>Best opportunity</span>
              <span className="text-right">Monthly revenue</span>
            </div>
            {sites.map((s) => (
              <div
                key={s.domain}
                className="grid grid-cols-4 items-center gap-4 border-b border-zinc-100 px-6 py-4 text-sm last:border-b-0"
              >
                <span className="font-medium text-zinc-900">{s.domain}</span>
                <span className="text-zinc-600">{s.score}/100</span>
                <span className="text-zinc-600">{s.opportunity}</span>
                <span className="text-right font-medium text-zinc-900">{s.revenue}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-zinc-400">Illustrative preview — not live data.</p>
      </div>
    </section>
  );
}
