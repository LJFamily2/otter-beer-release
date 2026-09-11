import { getClientLocale } from "@/lib/utils/getClientLocale";

describe("getClientLocale", () => {
  afterEach(() => {
    document.documentElement.lang = "";
  });

  it("returns the locale set on <html lang>", () => {
    document.documentElement.lang = "en";
    expect(getClientLocale()).toBe("en");
  });

  it("falls back to the default locale for an unsupported lang value", () => {
    document.documentElement.lang = "fr";
    expect(getClientLocale()).toBe("vi");
  });

  it("falls back to the default locale when lang is empty", () => {
    document.documentElement.lang = "";
    expect(getClientLocale()).toBe("vi");
  });
});
