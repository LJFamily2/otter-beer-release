import { headers } from "next/headers";
import { getServerAppSection } from "@/lib/utils/getServerAppSection";

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

const mockedHeaders = headers as jest.MockedFunction<typeof headers>;

function headersWith(value: string | null) {
  return {
    get: (key: string) => (key === "x-app-section" ? value : null),
  } as unknown as Awaited<ReturnType<typeof headers>>;
}

describe("getServerAppSection", () => {
  it("returns admin when the header is set to admin", async () => {
    mockedHeaders.mockResolvedValue(headersWith("admin"));
    await expect(getServerAppSection()).resolves.toBe("admin");
  });

  it("returns marketing when the header is missing", async () => {
    mockedHeaders.mockResolvedValue(headersWith(null));
    await expect(getServerAppSection()).resolves.toBe("marketing");
  });

  it("returns marketing for any unexpected header value", async () => {
    mockedHeaders.mockResolvedValue(headersWith("something-else"));
    await expect(getServerAppSection()).resolves.toBe("marketing");
  });
});
