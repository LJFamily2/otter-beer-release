import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * Serves /robots.txt.
 *
 * Two jobs beyond the obvious one:
 *
 * 1. Keep the admin panel, the API and the utility pages out of the index.
 *    They were previously crawlable — nothing was stopping Google from
 *    indexing /admin/dang-nhap or the design-system page and spending crawl
 *    budget on them.
 * 2. Explicitly admit the AI answer-engine crawlers (GEO). These are separate
 *    user-agents from Googlebot and several of them are opt-in by convention;
 *    naming them is what makes the brand quotable in ChatGPT, Claude,
 *    Perplexity and Google's AI surfaces rather than absent from them. Flip a
 *    block to `disallow: "/"` if the brand ever wants out.
 */

/** Paths no crawler should spend budget on. */
const DISALLOWED = [
  "/admin",
  "/admin/",
  "/api/",
  "/design-system",
  "/en/design-system",
  "/age-verification",
  "/en/age-verification",
];

/** Answer-engine and LLM-training crawlers we deliberately allow. */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: DISALLOWED,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
