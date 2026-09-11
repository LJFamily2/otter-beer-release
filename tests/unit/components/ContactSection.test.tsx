import { render, screen } from "@testing-library/react";
import ContactSection from "@/app/[locale]/(marketing)/contact/Contact";
import {
  ADDRESS,
  CONTACT,
  GEO,
  MAP_URL,
  formatGeo,
} from "@/config/brand";

describe("ContactSection", () => {
  it("renders the hero headline, CTA buttons, and contact details", () => {
    render(<ContactSection locale="en" />);

    expect(
      screen.getByRole("heading", { name: /crafted in tay ninh/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /call us/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send email/i })).toBeInTheDocument();
    expect(screen.getByText(/phone numbers/i)).toBeInTheDocument();
    expect(screen.getByText(/the taproom & brewery/i)).toBeInTheDocument();
  });

  it("renders Vietnamese copy for the vi locale", () => {
    render(<ContactSection locale="vi" />);

    expect(
      screen.getByRole("heading", { name: /đậm chất tây ninh/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gọi ngay/i })).toBeInTheDocument();
    expect(screen.getByText(/taproom & nhà máy/i)).toBeInTheDocument();
  });

  describe("heading level", () => {
    it("defaults to h1 for the standalone /contact page", () => {
      render(<ContactSection locale="en" />);

      expect(
        screen.getByRole("heading", { level: 1, name: /crafted in tay ninh/i }),
      ).toBeInTheDocument();
    });

    it("renders as h2 when embedded on a page that owns its own h1", () => {
      render(<ContactSection locale="en" headingLevel="h2" />);

      expect(
        screen.getByRole("heading", { level: 2, name: /crafted in tay ninh/i }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { level: 1 }),
      ).not.toBeInTheDocument();
    });
  });

  describe("machine-readable contact details", () => {
    it("marks the postal address up as an <address>", () => {
      const { container } = render(<ContactSection locale="en" />);
      const address = container.querySelector("address");

      expect(address).toBeInTheDocument();
      expect(address).toHaveTextContent(/Lac Long Quan/i);
    });

    it("keeps the visible address in step with the structured-data source", () => {
      // The Brewery JSON-LD emits ADDRESS verbatim. If the visible copy and
      // the markup disagree on the brewery's location, both lose trust.
      render(<ContactSection locale="en" />);

      expect(
        screen.getByText(new RegExp(ADDRESS.addressRegion, "i")),
      ).toBeInTheDocument();
    });

    it("makes both phone numbers dialable", () => {
      render(<ContactSection locale="en" />);

      for (const phone of CONTACT.phones) {
        expect(
          document.querySelector(`a[href="tel:${phone}"]`),
        ).toBeInTheDocument();
      }
    });

    it("renders the embedded Google Map iframe with accessibility title", () => {
      render(<ContactSection locale="en" />);

      const iframe = screen.getByTitle("Tay Ninh Otter Beer Brewery Map");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        "src",
        expect.stringContaining("google.com/maps/embed"),
      );
    });
  });

  describe("directions", () => {
    /**
     * Regression: `copy.directions` and `MAP_URL` both existed, and nothing
     * rendered either. The address was a dead end — a visitor who wanted to
     * drive to the brewery had to copy the text out by hand.
     */
    it("renders a Get Directions link, which nothing used to render at all", () => {
      render(<ContactSection locale="en" />);

      const link = screen.getByTestId("contact-directions");
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent(/get directions/i);
    });

    it("points at the brewery's exact coordinates", () => {
      render(<ContactSection locale="en" />);

      expect(screen.getByTestId("contact-directions")).toHaveAttribute(
        "href",
        MAP_URL,
      );
      expect(MAP_URL).toContain(`${GEO.latitude},${GEO.longitude}`);
    });

    it("opens in a new tab without leaking the opener", () => {
      render(<ContactSection locale="en" />);

      const link = screen.getByTestId("contact-directions");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link.getAttribute("rel")).toContain("noopener");
    });

    it("localises the label", () => {
      render(<ContactSection locale="vi" />);

      expect(screen.getByTestId("contact-directions")).toHaveTextContent(
        /chỉ đường/i,
      );
    });
  });

  describe("GPS badge", () => {
    /**
     * The badge used to be a hardcoded string in COPY that disagreed with
     * brand.ts GEO — the visible text and the Brewery JSON-LD named two
     * different places. It is now derived from the single source.
     */
    it("renders the same coordinates the structured data publishes", () => {
      render(<ContactSection locale="en" />);

      expect(screen.getByText(formatGeo("en"))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(String(GEO.latitude)))).toBeInTheDocument();
    });

    it("uses Vietnamese cardinal letters for the vi locale", () => {
      render(<ContactSection locale="vi" />);

      expect(screen.getByText(formatGeo("vi"))).toBeInTheDocument();
    });
  });
});
