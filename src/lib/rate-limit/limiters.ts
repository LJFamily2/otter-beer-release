import { RateLimiter } from "./RateLimiter";

/**
 * Shared limiter instances — module-level singletons so state (hit counts)
 * persists across requests within this process. See RateLimiter's docstring
 * for the single-instance-only caveat.
 */

/** Presigned upload issuance — each call lets the client write a file to R2. */
export const uploadRateLimiter = new RateLimiter(10, 60_000); // 10/min

/** General authenticated mutations (news-blog/users/roles/permissions). */
export const mutationRateLimiter = new RateLimiter(30, 60_000); // 30/min

/** Auth callback — generous since a normal OAuth round trip hits this a few times. */
export const authRateLimiter = new RateLimiter(20, 60_000); // 20/min
