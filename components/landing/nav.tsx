import Link from "next/link";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-base font-semibold tracking-tight text-zinc-900">
          MonetizeOS
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-zinc-600 sm:flex">
          <a href="#how-it-works" className="hover:text-zinc-900">
            How it works
          </a>
          <a href="#methods" className="hover:text-zinc-900">
            Monetization
          </a>
          <a href="#pricing" className="hover:text-zinc-900">
            Pricing
          </a>
          <a href="#faq" className="hover:text-zinc-900">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
