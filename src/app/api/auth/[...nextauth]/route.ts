import { GET as authGet, POST as authPost } from "@/auth";
import { withRateLimit } from "@/lib/rate-limit/withRateLimit";
import { authRateLimiter } from "@/lib/rate-limit/limiters";

// Generous but bounded — a normal Google OAuth round trip hits this
// endpoint a few times (signin, callback, session refreshes).
export const GET = withRateLimit(authRateLimiter, authGet, "auth");
export const POST = withRateLimit(authRateLimiter, authPost, "auth");
