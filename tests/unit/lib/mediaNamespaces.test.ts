import { MODULE_KEYS, MODULE_KEYS_LIST } from "@/config/permissions";
import {
  allowsVideo,
  isMediaNamespace,
  MEDIA_NAMESPACES,
  MODULE_BY_MEDIA_NAMESPACE,
} from "@/lib/storage/namespaces";

describe("media namespaces", () => {
  it("maps every namespace to a real permission module", () => {
    for (const namespace of MEDIA_NAMESPACES) {
      const moduleKey = MODULE_BY_MEDIA_NAMESPACE[namespace];
      expect(MODULE_KEYS_LIST).toContain(moduleKey);
    }
  });

  it("scopes each content module to its own folder rather than news-blog", () => {
    expect(MODULE_BY_MEDIA_NAMESPACE["news-blog"]).toBe(MODULE_KEYS.NEWS_BLOG);
    expect(MODULE_BY_MEDIA_NAMESPACE.beers).toBe(MODULE_KEYS.BEERS);
    expect(MODULE_BY_MEDIA_NAMESPACE["brand-story"]).toBe(MODULE_KEYS.BRAND_STORY);
    expect(MODULE_BY_MEDIA_NAMESPACE.hero).toBe(MODULE_KEYS.HERO_SECTION);
  });

  it("gives every namespace a distinct module", () => {
    const modules = MEDIA_NAMESPACES.map((n) => MODULE_BY_MEDIA_NAMESPACE[n]);
    expect(new Set(modules).size).toBe(modules.length);
  });

  it("enables video for the hero only", () => {
    expect(allowsVideo("hero")).toBe(true);
    expect(allowsVideo("news-blog")).toBe(false);
    expect(allowsVideo("beers")).toBe(false);
    expect(allowsVideo("brand-story")).toBe(false);
  });

  it("recognises known namespaces and rejects made-up ones", () => {
    expect(isMediaNamespace("hero")).toBe(true);
    expect(isMediaNamespace("../../etc")).toBe(false);
    expect(isMediaNamespace("events")).toBe(false);
  });
});
