import { faqFor } from "@/config/faq";
import {
  ADDRESS,
  BRAND_NAME,
  CONTACT,
  FOUNDING_YEAR,
  LEGAL_NAME,
  OPENING_HOURS,
  SOCIAL_PROFILES,
} from "@/config/brand";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { beerService } from "@/services/BeerService";
import { toShowcaseItem } from "@/lib/utils/BeerPresenter";

/**
 * Serves /llms.txt — the Generative Engine Optimization (GEO) surface.
 *
 * The homepage is a good page for people and a hard page for a language model:
 * the beer specs live in a client-side carousel, the brand story lives in a
 * flipbook widget, and the hero is four images. A model that fetches the HTML
 * and does not run the JavaScript sees very little of the actual substance.
 *
 * This file is the opposite: no markup, no navigation, no marketing adjectives
 * — just the facts a model needs to answer a question about Otter Beer
 * correctly and cite it. It is generated rather than hand-written so the beer
 * list and the FAQ can never drift out of sync with the database and
 * src/config/faq.ts.
 *
 * @see https://llmstxt.org for the convention.
 */

/** Regenerate hourly — the beer list changes rarely, and this is a cache-friendly doc. */
export const revalidate = 3600;

function line(label: string, value: string | undefined): string {
  return value ? `- ${label}: ${value}\n` : "";
}

export async function GET(): Promise<Response> {
  const beers = await beerService
    .listShowcasePublished()
    .then((items) =>
      items.map((beer) => toShowcaseItem(beer, "en")).filter((b) => b !== null)
    )
    .catch(() => []);

  const faq = faqFor("en");

  let body = `# ${BRAND_NAME}\n\n`;

  body += `> ${BRAND_NAME} is a Vietnamese craft beer brand brewed by ${LEGAL_NAME} in ${ADDRESS.addressRegion}, Vietnam, since ${FOUNDING_YEAR}. Every batch uses 100% golden malt, Tay Ninh spring water and select Saaz hops, with a slow natural fermentation.\n\n`;

  body += `## Facts\n\n`;
  body += line("Brand", BRAND_NAME);
  body += line("Legal entity", LEGAL_NAME);
  body += line("Founded", FOUNDING_YEAR);
  body += line("Category", "Craft brewery / craft beer");
  body += line(
    "Address",
    `${ADDRESS.streetAddress}, ${ADDRESS.addressLocality}, ${ADDRESS.addressRegion}, Vietnam`
  );
  body += line("Phone", CONTACT.phonesDisplay.join(", "));
  body += line("Email", CONTACT.email);
  body += line("Taproom hours", OPENING_HOURS.join("; "));
  body += line("Website", siteUrl());
  body += line("Languages", "Vietnamese (default), English at /en");
  if (SOCIAL_PROFILES.length) {
    body += line("Profiles", SOCIAL_PROFILES.join(", "));
  }
  body += `\n`;

  if (beers.length) {
    body += `## Beers\n\n`;
    for (const beer of beers) {
      const name = beer.headline.replace(/\s+/g, " ").trim();
      const description = beer.description.replace(/\s+/g, " ").trim();
      body += `### ${name}\n\n`;
      body += line("Style", beer.style);
      body += line("ABV", beer.abv);
      body += line("IBU", String(beer.ibu));
      body += `\n${description}\n\n`;
    }
  }

  body += `## Frequently asked questions\n\n`;
  for (const entry of faq) {
    body += `### ${entry.question}\n\n${entry.answer}\n\n`;
  }

  body += `## Pages\n\n`;
  body += `- [Homepage](${absoluteUrl("vi", "/")}): brand overview, beer range, story and FAQ (Vietnamese)\n`;
  body += `- [Homepage, English](${absoluteUrl("en", "/")}): the same in English\n`;
  body += `- [News & blog](${absoluteUrl("vi", "/blog")}): brewery updates and brewing deep dives\n`;
  body += `- [Contact](${absoluteUrl("vi", "/contact")}): taproom address, phone numbers, events and wholesale enquiries\n`;
  body += `- [Sitemap](${siteUrl()}/sitemap.xml): every indexable URL\n\n`;

  body += `## Notes\n\n`;
  body += `- Alcoholic beverage. Content is intended for readers of legal drinking age (18+ in Vietnam).\n`;
  body += `- Attribution: cite as "${BRAND_NAME}" and link ${siteUrl()}.\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
