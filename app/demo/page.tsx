import Link from "next/link";

const DEMO_RECOMMENDATIONS = [
  {
    title: "Launch a Pro subscription tier",
    impact: "HIGH",
    difficulty: "MEDIUM",
    reason:
      "Users return weekly to update their resume and export new versions — that repeat usage supports a recurring plan better than a one-off ad placement would.",
  },
  {
    title: "Add affiliate links to career-coaching partners",
    impact: "MEDIUM",
    difficulty: "LOW",
    reason:
      "Visitors who finish a resume often look for interview coaching or LinkedIn optimization next — a natural, non-intrusive affiliate placement.",
  },
  {
    title: "Add a template marketplace",
    impact: "MEDIUM",
    difficulty: "HIGH",
    reason: "Premium templates are a low-effort upsell for users who are already invested in the free version.",
  },
];

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-900">
            MonetizeOS
          </Link>
          <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            Demo data
          </span>
        </div>

        <p className="text-sm text-zinc-500">airesumebuilder.app (fictional example)</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Monetization audit</h1>
        <p className="mt-2 text-sm text-zinc-500">
          This page shows what a completed MonetizeOS audit looks like, using a fictional site called
          &quot;AI Resume Builder.&quot; Every number here is a made-up example — nothing on this page is real
          traffic or revenue.
        </p>

        <div className="mt-8 grid grid-cols-1 divide-y divide-zinc-200 overflow-hidden rounded-xl border border-zinc-200 bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Monetization score</p>
            <p className="mt-2 text-5xl font-semibold tracking-tight text-zinc-900">82</p>
            <p className="text-sm text-zinc-400">/ 100</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Best opportunity</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900">Subscription</p>
            <p className="mt-1 text-sm text-zinc-500">Secondary: Affiliate</p>
          </div>
          <div className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Estimated potential</p>
            <p className="mt-2 text-lg font-semibold text-zinc-900">€200–€800/month</p>
            <p className="mt-1 text-sm text-zinc-400">*Scenario estimate, not guaranteed revenue.</p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6">
          <p className="text-sm font-medium text-zinc-900">Why this recommendation</p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-600">
            AI Resume Builder has strong repeat usage (users come back to update their resume ahead of each job
            application) and clear premium-worthy features (export formats, AI rewrites). That combination favors
            a subscription over advertising, which would work against the clean, focused editing experience users
            already value.
          </p>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-6 py-4">
            <p className="text-sm font-medium text-zinc-900">Opportunities</p>
          </div>
          <div className="divide-y divide-zinc-200">
            {DEMO_RECOMMENDATIONS.map((r) => (
              <div key={r.title} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{r.title}</p>
                  <p className="mt-1 text-sm text-zinc-500">{r.reason}</p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs">
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                    Impact: {r.impact}
                  </span>
                  <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-600">
                    Difficulty: {r.difficulty}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-zinc-900 bg-zinc-900 p-8 text-center">
          <p className="text-lg font-semibold text-white">Want this for your own site?</p>
          <p className="mt-1 text-sm text-zinc-400">Free audit. Takes about two minutes.</p>
          <Link
            href="/signup"
            className="mt-5 inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-100"
          >
            Analyze my website
          </Link>
        </div>
      </div>
    </div>
  );
}
