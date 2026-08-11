import Link from "next/link";

// Placeholder landing page for Phase 1 (auth + architecture).
// The full marketing page (hero, how it works, pricing, FAQ, etc.) is built in Phase 2.
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <p className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-400">MonetizeOS</p>
      <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
        You built the site. Now make it pay.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-zinc-500">
        Monetize your AI-built website with data-driven recommendations, automated integrations and
        continuous optimization.
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/signup"
          className="inline-flex items-center rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Analyze my website
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
