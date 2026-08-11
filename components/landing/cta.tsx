import Link from "next/link";

export function CTA() {
  return (
    <section className="bg-zinc-900 px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-white">
          Find out what your website is worth
        </h2>
        <p className="mt-3 text-zinc-400">Free audit. Takes about two minutes.</p>
        <Link
          href="/signup"
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-100"
        >
          Analyze my website
        </Link>
      </div>
    </section>
  );
}
