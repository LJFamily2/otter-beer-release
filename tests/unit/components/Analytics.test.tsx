import { render } from "@testing-library/react";
import { Analytics } from "@/components/analytics/Analytics";

jest.mock("@next/third-parties/google", () => ({
  GoogleAnalytics: ({ gaId }: { gaId: string }) => (
    <div data-testid="ga-tag" data-ga-id={gaId} />
  ),
}));

describe("Analytics", () => {
  describe("when no measurement ID is configured", () => {
    it("renders nothing at all", () => {
      const { container } = render(<Analytics />);
      expect(container).toBeEmptyDOMElement();
    });

    it("does not emit the consent bootstrap either", () => {
      const { container } = render(<Analytics gaId="" />);
      expect(container.querySelector("#google-consent-mode-default")).toBeNull();
    });
  });

  describe("when a measurement ID is configured", () => {
    it("loads the GA tag with that ID", () => {
      const { getByTestId } = render(<Analytics gaId="G-TEST123" />);

      expect(getByTestId("ga-tag")).toHaveAttribute("data-ga-id", "G-TEST123");
    });

    it("emits the deny-by-default consent bootstrap", () => {
      const { container } = render(<Analytics gaId="G-TEST123" />);
      const script = container.querySelector("#google-consent-mode-default");

      expect(script).not.toBeNull();
      expect(script?.innerHTML).toContain("'consent','default'");
      expect(script?.innerHTML).toContain('"analytics_storage":"denied"');
    });

    /**
     * The ordering guarantee this component exists to provide: the denied
     * default must be parsed before gtag.js is injected, or the tag has a
     * window in which it believes it may store an identifier.
     */
    it("places the consent bootstrap before the GA tag in document order", () => {
      const { container, getByTestId } = render(<Analytics gaId="G-TEST123" />);
      const script = container.querySelector("#google-consent-mode-default");

      if (!script) throw new Error("consent bootstrap script was not rendered");

      const position = script.compareDocumentPosition(getByTestId("ga-tag"));
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("uses a plain inline script, not next/script's beforeInteractive", () => {
      // beforeInteractive is only valid directly inside app/layout.tsx, and a
      // raw inline script gives a stronger ordering guarantee here anyway.
      const { container } = render(<Analytics gaId="G-TEST123" />);
      const script = container.querySelector("#google-consent-mode-default");

      expect(script?.tagName).toBe("SCRIPT");
      expect(script?.getAttribute("src")).toBeNull();
    });
  });
});
