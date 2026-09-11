import { formatDate } from "@/lib/utils/formatDate";

describe("formatDate", () => {
  const date = new Date("2026-03-05T00:00:00Z");

  it("formats in Vietnamese style for locale vi", () => {
    expect(formatDate(date, "vi")).toBe("05/03/2026");
  });

  it("formats in English style for locale en", () => {
    expect(formatDate(date, "en")).toBe("Mar 05, 2026");
  });

  it("falls back to the Vietnamese formatter for an unknown locale", () => {
    expect(formatDate(date, "fr")).toBe("05/03/2026");
  });
});
