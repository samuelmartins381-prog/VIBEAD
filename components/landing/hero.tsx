import Link from "next/link";

export function Hero() {
  return (
    <section className="border-b border-zinc-200 bg-white px-6 pb-20 pt-20 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600">
          Built for vibe-coded products
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 sm:text-6xl">
          You built the site.
          <br />
          Now make it pay.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500">
          Monetize your AI-built website with data-driven recommendations, automated integrations
          and continuous optimization.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 sm:w-auto"
          >
            Analyze my website
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex w-full items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 sm:w-auto"
          >
            See how it works
          </a>
        </div>
        <p className="mt-5 text-xs text-zinc-400">
          Free audit. No credit card required. Estimates are scenarios, not guarantees.
        </p>
      </div>
    </section>
  );
}
