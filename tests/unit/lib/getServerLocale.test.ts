import { headers } from "next/headers";
import { getServerLocale } from "@/lib/utils/getServerLocale";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

const mockedHeaders = headers as jest.MockedFunction<typeof headers>;

function headersWith(value: string | null) {
  return {
    get: (key: string) => (key === "x-locale" ? value : null),
  } as unknown as Awaited<ReturnType<typeof headers>>;
}

describe("getServerLocale", () => {
  it("returns the locale from the x-locale header", async () => {
    mockedHeaders.mockResolvedValue(headersWith("en"));
    await expect(getServerLocale()).resolves.toBe("en");
  });

  it("falls back to the default locale when the header is missing", async () => {
    mockedHeaders.mockResolvedValue(headersWith(null));
    await expect(getServerLocale()).resolves.toBe("vi");
  });

  it("falls back to the default locale for an unsupported header value", async () => {
    mockedHeaders.mockResolvedValue(headersWith("fr"));
    await expect(getServerLocale()).resolves.toBe("vi");
  });
});
