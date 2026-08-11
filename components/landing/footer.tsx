import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-zinc-900 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-zinc-400 sm:flex-row">
        <span>© {new Date().getFullYear()} MonetizeOS</span>
        <div className="flex gap-6">
          <Link href="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white">
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
