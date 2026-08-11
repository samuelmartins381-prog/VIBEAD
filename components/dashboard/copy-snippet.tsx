"use client";

import { useState } from "react";

export function CopySnippet({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-xs leading-relaxed text-zinc-100">
        <code>{snippet}</code>
      </pre>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(snippet);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute right-2 top-2 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
