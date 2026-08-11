import Link from "next/link";

const opportunities = [
  {
    title: "Add contextual ads",
    impact: "HIGH",
    difficulty: "LOW",
    reason:
      "Your website provides utility-oriented content with repeated user sessions. Ads can monetize traffic without introducing a paywall.",
  },
  {
    title: "Introduce an affiliate comparison block",
    impact: "MEDIUM",
    difficulty: "LOW",
    reason: "Visitors compare options before acting — a natural fit for affiliate placements.",
  },
];

export function ExampleAudit() {
  return (
    <section className="border-b border-zinc-200 bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">
            A real audit, not a guess
          </h2>
          <p className="mt-3 text-zinc-500">Every recommendation comes with a reason and an estimated impact.</p>
          <Link href="/demo" className="mt-3 inline-block text-sm font-medium text-zinc-900 hover:underline">
            See a full demo audit &rarr;
          </Link>
        </div>

        <div className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid grid-cols-1 divide-y divide-zinc-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <div className="p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Monetization score</p>
              <p className="mt-2 text-5xl font-semibold tracking-tight text-zinc-900">78</p>
              <p className="text-sm text-zinc-400">/ 100</p>
            </div>
            <div className="p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Best opportunity</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">Advertising</p>
              <p className="mt-1 text-sm text-zinc-500">Secondary: Affiliate</p>
            </div>
            <div className="p-8">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Estimated potential</p>
              <p className="mt-2 text-lg font-semibold text-zinc-900">€100–€500/month</p>
              <p className="mt-1 text-sm text-zinc-400">*Scenario estimate, not guaranteed revenue.</p>
            </div>
          </div>

          <div className="divide-y divide-zinc-200 border-t border-zinc-200">
            {opportunities.map((o) => (
              <div key={o.title} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{o.title}</p>
                  <p className="mt-1 max-w-xl text-sm text-zinc-500">{o.reason}</p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                    Impact: {o.impact}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                    Difficulty: {o.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
