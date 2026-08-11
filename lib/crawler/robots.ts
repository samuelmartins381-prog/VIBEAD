import "server-only";
import robotsParser from "robots-parser";
import { safeFetch } from "@/lib/crawler/safe-fetch";

const CRAWLER_USER_AGENT = "MonetizeOSBot";

export interface RobotsCheck {
  isAllowed(pathUrl: string): boolean;
  crawlDelayMs: number;
}

/**
 * Fetches and parses robots.txt for the given origin. Fails open (allows
 * crawling) if robots.txt is missing or unreachable, per convention — but
 * fails closed (blocks crawling) if it exists and explicitly disallows us.
 */
export async function loadRobotsCheck(origin: string): Promise<RobotsCheck> {
  const robotsUrl = new URL("/robots.txt", origin).toString();

  let contents = "";
  try {
    const res = await safeFetch(robotsUrl);
    if (res.status >= 200 && res.status < 300) {
      contents = res.body;
    }
  } catch {
    // No robots.txt, or it's unreachable — treat as "allow all".
  }

  const robots = robotsParser(robotsUrl, contents);

  return {
    isAllowed: (pathUrl: string) => robots.isAllowed(pathUrl, CRAWLER_USER_AGENT) !== false,
    crawlDelayMs: (robots.getCrawlDelay(CRAWLER_USER_AGENT) ?? 0) * 1000,
  };
}
