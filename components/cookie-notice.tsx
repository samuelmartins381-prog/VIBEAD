"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "monetizeos-cookie-notice-dismissed";

export function CookieNotice() {
  const [visible, setVisible] = useState(false);

  // One-time read of a browser-only API (localStorage) — can't be a lazy
  // useState initializer since the server render has no access to it.
  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-zinc-500">
          We use only strictly necessary cookies to keep you signed in — no advertising or tracking cookies. See
          our <Link href="/privacy" className="underline hover:text-zinc-900">Privacy Policy</Link>.
        </p>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setVisible(false);
          }}
          className="shrink-0 rounded-lg bg-zinc-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-700"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
