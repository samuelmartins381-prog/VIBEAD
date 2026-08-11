import "server-only";
import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

// Address "ranges" ipaddr.js considers safe for talking to the public internet.
// Everything else (private, loopback, link-local — which covers the
// 169.254.169.254 cloud metadata endpoint — unique local, reserved, etc.)
// is blocked.
const ALLOWED_RANGES = new Set(["unicast"]);

export class SsrfBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfBlockedError";
  }
}

function isAllowedAddress(address: string): boolean {
  let addr: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    addr = ipaddr.process(address); // normalizes IPv4-mapped IPv6 down to IPv4
  } catch {
    return false;
  }
  const range = addr.range();
  return ALLOWED_RANGES.has(range);
}

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validates a user-supplied URL is safe to crawl: http(s) only, no
 * credentials in the URL, no non-standard ports, and resolves exclusively
 * to public IP addresses (never private/loopback/link-local/reserved —
 * blocking access to internal services and cloud metadata endpoints).
 *
 * Returns the pinned IP addresses so the caller can connect directly to
 * them instead of re-resolving DNS at connection time, which would allow a
 * DNS-rebinding attack to slip a private address in between this check and
 * the actual request.
 */
export async function assertPublicUrl(rawUrl: string): Promise<{ url: URL; addresses: string[] }> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SsrfBlockedError("Invalid URL");
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new SsrfBlockedError("Only http and https URLs are allowed");
  }

  if (url.username || url.password) {
    throw new SsrfBlockedError("URLs with embedded credentials are not allowed");
  }

  if (url.port && !["80", "443", ""].includes(url.port)) {
    throw new SsrfBlockedError("Non-standard ports are not allowed");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");

  // If the hostname is itself an IP literal, validate it directly.
  if (ipaddr.isValid(hostname)) {
    if (!isAllowedAddress(hostname)) {
      throw new SsrfBlockedError("URL resolves to a private or reserved address");
    }
    return { url, addresses: [hostname] };
  }

  let records: { address: string; family: number }[];
  try {
    records = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new SsrfBlockedError("Could not resolve hostname");
  }

  if (records.length === 0) {
    throw new SsrfBlockedError("Could not resolve hostname");
  }

  const addresses = records.map((r) => r.address);
  if (!addresses.every(isAllowedAddress)) {
    throw new SsrfBlockedError("URL resolves to a private or reserved address");
  }

  return { url, addresses };
}
