import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security/headers";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google account profile photos (admin user avatars)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },

  /**
   * Site-wide security headers, including the CSP.
   *
   * `source: "/:path*"` covers every route and every file served out of
   * public/ — Next checks headers before the filesystem, so the OG image and
   * the static brand assets are covered too. See src/lib/security/headers.ts
   * for the policy itself and why it does not use a nonce.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: buildSecurityHeaders({ isDev }),
      },
    ];
  },
};

export default nextConfig;
