/**
 * Validates a post-login `callbackUrl` query param before it's handed to
 * next-auth's `signIn({ redirectTo })`.
 *
 * next-auth's own default `redirect` callback already rejects cross-origin
 * absolute URLs (see node_modules/@auth/core/lib/init.js), so this isn't
 * the only line of defense — but that guarantee is implicit in a
 * dependency's default behavior. This makes the same-origin contract
 * explicit and independently testable in this codebase, and additionally
 * rejects "//host" and "/\host" — both start with "/" (so a naive
 * `startsWith("/")` check alone would accept them) but browsers normalize
 * them to protocol-relative absolute URLs pointing at a different origin.
 */
export function getSafeCallbackUrl(
  url: string | undefined | null,
  fallback = "/admin"
): string {
  if (!url) return fallback;
  if (!url.startsWith("/")) return fallback;
  if (url.startsWith("//") || url.startsWith("/\\")) return fallback;
  return url;
}
