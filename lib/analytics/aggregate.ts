import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  pageviews: number;
  clicks: number;
  other: number;
}

export interface WebsiteAnalytics {
  totalPageviews: number;
  totalClicks: number;
  totalOtherEvents: number;
  series: DailyPoint[];
}

const MAX_EVENTS = 5000;

function dateKey(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Aggregates real event data for a website over the last `days` days.
 * There is no ad network or payment integration wired up yet in this
 * MVP, so revenue/RPM/CTR are deliberately not computed here — showing
 * a fabricated number would be worse than showing none.
 */
export async function getWebsiteAnalytics(
  supabase: SupabaseClient<Database>,
  websiteId: string,
  days = 30
): Promise<WebsiteAnalytics> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data: events } = await supabase
    .from("events")
    .select("type, created_at")
    .eq("website_id", websiteId)
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })
    .limit(MAX_EVENTS);

  const byDate = new Map<string, DailyPoint>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { date: key, pageviews: 0, clicks: 0, other: 0 });
  }

  let totalPageviews = 0;
  let totalClicks = 0;
  let totalOtherEvents = 0;

  for (const event of events ?? []) {
    const key = dateKey(event.created_at);
    const point = byDate.get(key);
    if (!point) continue; // outside the requested window (clock skew, etc.)

    if (event.type === "pageview") {
      point.pageviews += 1;
      totalPageviews += 1;
    } else if (event.type === "click") {
      point.clicks += 1;
      totalClicks += 1;
    } else {
      point.other += 1;
      totalOtherEvents += 1;
    }
  }

  return {
    totalPageviews,
    totalClicks,
    totalOtherEvents,
    series: Array.from(byDate.values()),
  };
}
