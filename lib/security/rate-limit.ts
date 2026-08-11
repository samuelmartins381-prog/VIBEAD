import "server-only";

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop stale buckets so this doesn't grow unbounded.
const MAX_BUCKETS = 50_000;

/**
 * A simple in-memory fixed-window rate limiter. Good enough for a single
 * Node process; a multi-instance deployment would need a shared store
 * (e.g. Redis) instead — noted here rather than built prematurely.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    if (buckets.size > MAX_BUCKETS) buckets.clear();
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  bucket.count += 1;
  return bucket.count > limit;
}
