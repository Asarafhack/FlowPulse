import { getConfig } from "../config";
import { tooManyRequests } from "../errors";
import { logger } from "../logger";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function prune(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function enforceRateLimit(scope: string, identifier: string): void {
  const { authRateLimitWindowMs, authRateLimitMax } = getConfig();
  const now = Date.now();
  const key = `${scope}:${identifier}`;
  prune(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + authRateLimitWindowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > authRateLimitMax) {
    logger.warn("rate_limit_exceeded", { scope, identifier });
    throw tooManyRequests();
  }
}
