import "server-only";
import http from "node:http";
import https from "node:https";
import { assertPublicUrl, SsrfBlockedError } from "@/lib/security/ssrf";

const MAX_REDIRECTS = 5;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_BODY_BYTES = 3 * 1024 * 1024; // 3MB — plenty for HTML/robots.txt, keeps the crawler cheap
const USER_AGENT = "MonetizeOSBot/1.0 (+https://monetizeos.app/bot)";

export class CrawlFetchError extends Error {}

export interface SafeFetchResult {
  status: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
  finalUrl: string;
}

function pinnedRequest(url: URL, addresses: string[]): Promise<SafeFetchResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const client = url.protocol === "https:" ? https : http;

    const req = client.request(
      url,
      {
        method: "GET",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
        timeout: REQUEST_TIMEOUT_MS,
        // Pin the connection to the pre-validated address(es) instead of
        // letting Node re-resolve DNS at connect time — closes the
        // DNS-rebinding gap between assertPublicUrl() and the actual request.
        // Node's Happy Eyeballs connector calls this with `all: true` and
        // expects an array of {address, family} back; handle both shapes.
        lookup: ((_hostname: string, options: { all?: boolean }, callback: (...args: unknown[]) => void) => {
          const records = addresses.map((address) => ({ address, family: address.includes(":") ? 6 : 4 }));
          if (options?.all) {
            callback(null, records);
          } else {
            callback(null, records[0].address, records[0].family);
          }
        }) as unknown as http.RequestOptions["lookup"],
      },
      (res) => {
        const status = res.statusCode ?? 0;

        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.resume(); // discard body
          settle(() => resolve({ status, headers: res.headers, body: "", finalUrl: url.toString() }));
          return;
        }

        let received = 0;
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > MAX_BODY_BYTES) {
            settle(() => reject(new CrawlFetchError("Response too large")));
            req.destroy();
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          settle(() =>
            resolve({
              status,
              headers: res.headers,
              body: Buffer.concat(chunks).toString("utf-8"),
              finalUrl: url.toString(),
            })
          );
        });

        // Swallow the error the destroyed socket produces once we've
        // already resolved/rejected above — otherwise an unhandled
        // 'error' event here crashes the process.
        res.on("error", (err) => settle(() => reject(new CrawlFetchError(err.message))));
      }
    );

    req.on("timeout", () => {
      settle(() => reject(new CrawlFetchError("Request timed out")));
      req.destroy();
    });
    req.on("error", (err) => {
      settle(() => reject(err instanceof CrawlFetchError ? err : new CrawlFetchError(err.message)));
    });
    req.end();
  });
}

/**
 * SSRF-safe GET: validates the URL and its DNS resolution reject private/
 * reserved addresses, pins the connection to the validated IP, and follows
 * redirects manually (re-validating every hop) up to MAX_REDIRECTS.
 */
export async function safeFetch(inputUrl: string): Promise<SafeFetchResult> {
  let currentUrl = inputUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const { url, addresses } = await assertPublicUrl(currentUrl);
    const result = await pinnedRequest(url, addresses);

    const isRedirect = [301, 302, 303, 307, 308].includes(result.status);
    if (!isRedirect) {
      return { ...result, finalUrl: url.toString() };
    }

    const location = result.headers.location;
    if (!location || typeof location !== "string") {
      throw new CrawlFetchError("Redirect without a Location header");
    }
    if (hop === MAX_REDIRECTS) {
      throw new CrawlFetchError("Too many redirects");
    }
    currentUrl = new URL(location, url).toString();
  }

  throw new CrawlFetchError("Too many redirects");
}

export { SsrfBlockedError };
