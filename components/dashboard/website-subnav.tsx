import Link from "next/link";

export function WebsiteSubnav({ websiteId, active }: { websiteId: string; active: "overview" | "audit" | "analytics" }) {
  const tabs = [
    { key: "overview", label: "Overview", href: `/dashboard/websites/${websiteId}` },
    { key: "audit", label: "Audit", href: `/dashboard/websites/${websiteId}/audit` },
    { key: "analytics", label: "Analytics", href: `/dashboard/websites/${websiteId}/analytics` },
  ] as const;

  return (
    <nav className="mb-6 flex gap-1 border-b border-zinc-200">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            active === tab.key
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-900"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
