import type { NextRequest } from "next/server";

/**
 * Best-effort client IP for rate-limit keying. Behind a reverse proxy
 * (Vercel, etc.) the real client address only survives in these headers —
 * `request.ip` isn't populated in the Node runtime.
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
