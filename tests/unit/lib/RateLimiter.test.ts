import { RateLimiter } from "@/lib/rate-limit/RateLimiter";

describe("RateLimiter", () => {
  it("allows requests up to the limit", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("a").success).toBe(true);
    expect(limiter.check("a").success).toBe(true);
    expect(limiter.check("a").success).toBe(true);
  });

  it("rejects requests once the limit is exceeded", () => {
    const limiter = new RateLimiter(2, 60_000);
    limiter.check("a");
    limiter.check("a");
    const result = limiter.check("a");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks each key independently", () => {
    const limiter = new RateLimiter(1, 60_000);
    expect(limiter.check("a").success).toBe(true);
    expect(limiter.check("b").success).toBe(true);
    expect(limiter.check("a").success).toBe(false);
  });

  it("allows requests again once the window has passed", () => {
    jest.useFakeTimers();
    try {
      const limiter = new RateLimiter(1, 1_000);
      expect(limiter.check("a").success).toBe(true);
      expect(limiter.check("a").success).toBe(false);

      jest.advanceTimersByTime(1_001);

      expect(limiter.check("a").success).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it("reports remaining requests correctly", () => {
    const limiter = new RateLimiter(3, 60_000);
    expect(limiter.check("a").remaining).toBe(2);
    expect(limiter.check("a").remaining).toBe(1);
    expect(limiter.check("a").remaining).toBe(0);
  });
});
