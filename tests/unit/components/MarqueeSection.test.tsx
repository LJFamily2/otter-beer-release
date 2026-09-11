import { render, screen, within } from "@testing-library/react";
import { MarqueeSection } from "@/components/sections/MarqueeSection";

const BRAND_REPEAT = 10;
const TAGLINE_REPEAT = 6;
const BRAND_DURATION_MS = 26000;
const TAGLINE_DURATION_MS = 32000;

function trackItemCount(track: HTMLElement) {
  return track.children.length;
}

describe("MarqueeSection Component", () => {
  describe("content", () => {
    it("renders the English brand and tagline copy", () => {
      render(<MarqueeSection locale="en" />);

      expect(screen.getAllByText("OTTER BEER").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("LOCAL FLAVOR, A DIFFERENT EXPERIENCE").length
      ).toBeGreaterThan(0);
    });

    it("renders the Vietnamese tagline copy when locale is 'vi'", () => {
      render(<MarqueeSection locale="vi" />);

      expect(screen.getAllByText("OTTER BEER").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("HƯƠNG VỊ ĐỊA PHƯƠNG, TRẢI NGHIỆM KHÁC BIỆT").length
      ).toBeGreaterThan(0);
    });

    it("defaults to the Vietnamese copy when no locale is given", () => {
      render(<MarqueeSection />);

      expect(
        screen.getAllByText("HƯƠNG VỊ ĐỊA PHƯƠNG, TRẢI NGHIỆM KHÁC BIỆT").length
      ).toBeGreaterThan(0);
    });

    it("falls back to English copy for an unsupported locale", () => {
      render(<MarqueeSection locale="fr" />);

      expect(
        screen.getAllByText("LOCAL FLAVOR, A DIFFERENT EXPERIENCE").length
      ).toBeGreaterThan(0);
    });
  });

  describe("structure", () => {
    it("labels the section for assistive tech", () => {
      render(<MarqueeSection locale="en" />);

      expect(screen.getByRole("region", { name: "Brand Marquee" })).toBeInTheDocument();
    });

    it("hides the decorative repeating tracks from assistive tech", () => {
      render(<MarqueeSection locale="en" />);

      expect(screen.getByTestId("marquee-track-left")).toHaveAttribute(
        "aria-hidden",
        "true"
      );
      expect(screen.getByTestId("marquee-track-right")).toHaveAttribute(
        "aria-hidden",
        "true"
      );
    });

    it("exposes each row's text once via a visually-hidden node", () => {
      render(<MarqueeSection locale="en" />);

      const region = screen.getByRole("region", { name: "Brand Marquee" });
      const srOnly = within(region)
        .getAllByText(/OTTER BEER|LOCAL FLAVOR/)
        .filter((el) => el.className.includes("sr-only"));

      expect(srOnly).toHaveLength(2);
    });

    it("repeats the brand row's item twice the configured repeat count", () => {
      render(<MarqueeSection locale="en" />);

      expect(trackItemCount(screen.getByTestId("marquee-track-left"))).toBe(
        BRAND_REPEAT * 2
      );
    });

    it("repeats the tagline row's item twice the configured repeat count", () => {
      render(<MarqueeSection locale="en" />);

      expect(trackItemCount(screen.getByTestId("marquee-track-right"))).toBe(
        TAGLINE_REPEAT * 2
      );
    });
  });

  describe("animation configuration", () => {
    it("scrolls the brand row left and the tagline row right", () => {
      render(<MarqueeSection locale="en" />);

      expect(screen.getByTestId("marquee-track-left")).toHaveAttribute(
        "data-direction",
        "left"
      );
      expect(screen.getByTestId("marquee-track-right")).toHaveAttribute(
        "data-direction",
        "right"
      );
    });

    it("gives each row its own loop duration via --marquee-duration", () => {
      render(<MarqueeSection locale="en" />);

      expect(screen.getByTestId("marquee-track-left").style.getPropertyValue(
        "--marquee-duration"
      )).toBe(`${BRAND_DURATION_MS}ms`);
      expect(screen.getByTestId("marquee-track-right").style.getPropertyValue(
        "--marquee-duration"
      )).toBe(`${TAGLINE_DURATION_MS}ms`);
    });
  });
});
