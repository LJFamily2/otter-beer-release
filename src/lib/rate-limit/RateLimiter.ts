export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Unix ms timestamp when the caller can retry (only meaningful when `success` is false). */
  resetAt: number;
}

/**
 * In-memory sliding-window rate limiter. Deliberately dependency-free (no
 * Redis/Upstash) so it works without extra infrastructure — the tradeoff is
 * that limits are per-process, not shared across serverless instances. Fine
 * for a single-instance deployment or as a first line of defense; swap the
 * `check()` implementation for an Upstash-backed one later if traffic
 * outgrows a single instance without changing any call site.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private checksSinceSweep = 0;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  check(key: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const timestamps = (this.hits.get(key) ?? []).filter(
      (t) => t > windowStart
    );

    if (timestamps.length >= this.limit) {
      this.hits.set(key, timestamps);
      return {
        success: false,
        remaining: 0,
        resetAt: timestamps[0] + this.windowMs,
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    // Opportunistic cleanup so keys that stop being used (e.g. a rotating
    // IP) don't accumulate in memory forever — no background timer needed.
    this.checksSinceSweep += 1;
    if (this.checksSinceSweep >= 500) {
      this.checksSinceSweep = 0;
      this.sweep(windowStart);
    }

    return {
      success: true,
      remaining: this.limit - timestamps.length,
      resetAt: now + this.windowMs,
    };
  }

  private sweep(windowStart: number): void {
    for (const [key, timestamps] of this.hits) {
      const fresh = timestamps.filter((t) => t > windowStart);
      if (fresh.length === 0) {
        this.hits.delete(key);
      } else if (fresh.length !== timestamps.length) {
        this.hits.set(key, fresh);
      }
    }
  }
}
