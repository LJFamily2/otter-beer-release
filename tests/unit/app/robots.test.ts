import robots from "@/app/robots";

describe("robots.txt", () => {
  const result = robots();

  it("announces the sitemap", () => {
    // A sitemap nothing points at is a sitemap crawlers discover late or
    // never — this line is how Googlebot finds it without Search Console.
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
  });

  it("keeps the admin panel and the API out of the index", () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

    for (const rule of rules) {
      const disallow = Array.isArray(rule.disallow)
        ? rule.disallow
        : [rule.disallow];

      expect(disallow).toEqual(expect.arrayContaining(["/admin", "/api/"]));
    }
  });

  it("keeps the utility pages out of the index in both locales", () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const disallow = (
      Array.isArray(rules[0].disallow) ? rules[0].disallow : [rules[0].disallow]
    ) as string[];

    expect(disallow).toEqual(
      expect.arrayContaining([
        "/age-verification",
        "/en/age-verification",
        "/design-system",
        "/en/design-system",
      ])
    );
  });

  it("lets the general crawler reach the marketing site", () => {
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((rule) => rule.userAgent === "*");

    expect(wildcard).toBeDefined();
    expect(wildcard?.allow).toBe("/");
  });

  it("explicitly admits the answer-engine crawlers", () => {
    // GEO: these are separate user-agents from Googlebot and several are
    // opt-in by convention. Naming them is what makes the brand quotable in
    // ChatGPT/Claude/Perplexity rather than absent from them.
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const aiRule = rules.find((rule) => Array.isArray(rule.userAgent));
    const agents = aiRule?.userAgent as string[];

    expect(agents).toEqual(
      expect.arrayContaining([
        "GPTBot",
        "ClaudeBot",
        "PerplexityBot",
        "Google-Extended",
      ])
    );
    expect(aiRule?.allow).toBe("/");
  });
});
