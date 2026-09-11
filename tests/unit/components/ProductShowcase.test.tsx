import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductShowcase } from "@/components/sections/ProductShowcase";
import type { BeerShowcaseItem } from "@/lib/utils/BeerPresenter";

function beer(overrides: Partial<BeerShowcaseItem> = {}): BeerShowcaseItem {
  return {
    id: "beer-1",
    abv: "4.3%",
    ibu: 20,
    imageSrc: "/images/otter-beer-single-can.png",
    style: "PREMIUM LAGER",
    headline: "BREWING\nCONNECTIONS.",
    description: "A crisp pour.",
    shopUrl: "https://shop.example.com",
    findLocallyUrl: "https://find.example.com",
    themeColor: "#123456",
    themeColorContainer: "#654321",
    variants: [],
    ...overrides,
  };
}

/**
 * As the presenter builds it: the main image leads, then each variant.
 */
const PACK_VARIANTS = [
  { shortName: "CAN", imageSrc: "/api/media/public/beers/can.png" },
  { shortName: "6-PACK", imageSrc: "/api/media/public/beers/six-pack.png" },
  { shortName: "24-CASE", imageSrc: "/api/media/public/beers/case.png" },
];

/** next/image rewrites src through the optimizer, so decode before matching. */
function imageSrcOf(container: HTMLElement) {
  return decodeURIComponent(container.querySelector("img")?.getAttribute("src") ?? "");
}

describe("ProductShowcase Component", () => {
  it("renders the current beer's style, ABV, and IBU", () => {
    render(<ProductShowcase locale="en" beers={[beer()]} />);

    expect(screen.getAllByText("PREMIUM LAGER")[0]).toBeInTheDocument();
    expect(screen.getAllByText("4.3%")[0]).toBeInTheDocument();
    expect(screen.getAllByText("20")[0]).toBeInTheDocument();
  });

  it("applies the beer's theme colors as CSS variables on the section", () => {
    const { container } = render(<ProductShowcase locale="en" beers={[beer()]} />);
    const section = container.querySelector("section") as HTMLElement;

    expect(section.style.getPropertyValue("--color-primary")).toBe("#123456");
    expect(section.style.getPropertyValue("--color-primary-container")).toBe("#654321");
  });

  it("renders primary CTA linking to contact section", () => {
    render(<ProductShowcase locale="en" beers={[beer()]} />);

    expect(screen.getByRole("link", { name: /shop now/i })).toHaveAttribute("href", "#contact");
  });

  it("hides the prev/next navigation when only one beer is published", () => {
    render(<ProductShowcase locale="en" beers={[beer()]} />);

    expect(screen.queryByRole("button", { name: /previous product/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next product/i })).not.toBeInTheDocument();
  });

  it("shows navigation and cycles between beers when multiple are published", async () => {
    const user = userEvent.setup();
    render(
      <ProductShowcase
        locale="en"
        beers={[beer({ id: "1", style: "STYLE A" }), beer({ id: "2", style: "STYLE B" })]}
      />
    );

    expect(screen.getAllByText("STYLE A")[0]).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next product/i }));
    expect(screen.getAllByText("STYLE B")[0]).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous product/i }));
    expect(screen.getAllByText("STYLE A")[0]).toBeInTheDocument();
  });

  it("renders nothing when there are no published beers", () => {
    const { container } = render(<ProductShowcase locale="en" beers={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe("ProductShowcase product variants", () => {
  it("renders no variant picker when the beer has none", () => {
    render(<ProductShowcase locale="en" beers={[beer()]} />);
    expect(screen.queryByRole("group", { name: /choose variant/i })).not.toBeInTheDocument();
  });

  it("selects the main image (the first pill) by default", () => {
    const { container } = render(
      <ProductShowcase
        locale="en"
        beers={[beer({ imageSrc: "/images/main.png", variants: PACK_VARIANTS })]}
      />
    );

    const pills = within(
      screen.getByRole("group", { name: /choose variant/i })
    ).getAllByRole("button");

    expect(pills[0]).toHaveAttribute("aria-pressed", "true");
    expect(imageSrcOf(container)).toContain("/api/media/public/beers/can.png");
  });

  it("renders one pill per variant and marks the first active", () => {
    render(<ProductShowcase locale="en" beers={[beer({ variants: PACK_VARIANTS })]} />);

    const group = screen.getByRole("group", { name: /choose variant/i });
    const pills = within(group).getAllByRole("button");

    expect(pills).toHaveLength(3);
    expect(pills.map((pill) => pill.textContent)).toEqual(["CAN", "6-PACK", "24-CASE"]);
    expect(pills[0]).toHaveAttribute("aria-pressed", "true");
    expect(pills[1]).toHaveAttribute("aria-pressed", "false");
  });

  it("swaps the hero image when a pill is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductShowcase locale="en" beers={[beer({ variants: PACK_VARIANTS })]} />
    );

    expect(imageSrcOf(container)).toContain("/api/media/public/beers/can.png");

    await user.click(screen.getByRole("button", { name: "24-CASE" }));

    expect(screen.getByRole("button", { name: "24-CASE" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    // AnimatePresence mode="wait" holds the outgoing image until its exit
    // animation finishes, so the swap lands a tick after the click.
    await waitFor(() =>
      expect(imageSrcOf(container)).toContain("/api/media/public/beers/case.png")
    );
  });

  it("switches back to the main image when its pill is re-selected", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductShowcase locale="en" beers={[beer({ variants: PACK_VARIANTS })]} />
    );

    await user.click(screen.getByRole("button", { name: "24-CASE" }));
    await waitFor(() =>
      expect(imageSrcOf(container)).toContain("/api/media/public/beers/case.png")
    );

    await user.click(screen.getByRole("button", { name: "CAN" }));
    await waitFor(() =>
      expect(imageSrcOf(container)).toContain("/api/media/public/beers/can.png")
    );
  });

  it("falls back to the main image when there are no variants", () => {
    const { container } = render(
      <ProductShowcase locale="en" beers={[beer({ imageSrc: "/images/main.png" })]} />
    );
    expect(imageSrcOf(container)).toContain("/images/main.png");
  });

  it("resets to the first variant after switching to another beer", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ProductShowcase
        locale="en"
        beers={[
          beer({ id: "1", variants: PACK_VARIANTS }),
          beer({
            id: "2",
            variants: [{ shortName: "KEG", imageSrc: "/api/media/public/beers/keg.png" }],
          }),
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "24-CASE" }));
    await waitFor(() =>
      expect(imageSrcOf(container)).toContain("/api/media/public/beers/case.png")
    );

    // Beer 2 has a single variant — a stale index of 2 would read past its list.
    await user.click(screen.getByRole("button", { name: /next product/i }));
    await waitFor(() =>
      expect(imageSrcOf(container)).toContain("/api/media/public/beers/keg.png")
    );
  });

  it("labels the picker in Vietnamese for the vi locale", () => {
    render(<ProductShowcase locale="vi" beers={[beer({ variants: PACK_VARIANTS })]} />);
    expect(
      screen.getByRole("group", { name: /chọn phiên bản/i })
    ).toBeInTheDocument();
  });
});
