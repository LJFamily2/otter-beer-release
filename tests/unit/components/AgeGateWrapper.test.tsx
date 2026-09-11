import { render, screen, fireEvent } from "@testing-library/react";
import { AgeGateWrapper } from "@/components/layout/AgeGateWrapper";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

function renderGate() {
  return render(
    <AgeGateWrapper locale="vi">
      <header data-testid="header">Header Content</header>
      <main data-testid="main">Main Content</main>
      <footer data-testid="footer">Footer Content</footer>
    </AgeGateWrapper>
  );
}

const gateHeading = () =>
  screen.queryByRole("heading", { name: /bạn đã đủ 18 tuổi chưa|are you 18\+\?/i });

describe("AgeGateWrapper Component", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "otter_age_verified=; max-age=0";
  });

  describe("when unverified", () => {
    it("shows the gate", () => {
      renderGate();
      expect(gateHeading()).toBeInTheDocument();
    });

    it("still renders the page content underneath, for crawlers", () => {
      // This wrapper used to return the gate INSTEAD of children. Because the
      // server snapshot is always "unverified", that made the server-rendered
      // HTML of every marketing page the gate and nothing else — no content
      // and no JSON-LD reached any crawler or answer engine. The content must
      // stay in the DOM; the gate covers it rather than replacing it.
      renderGate();

      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("main")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
    });

    it("makes the content inert so it takes no focus or clicks", () => {
      // The keyboard/screen-reader equivalent of the opaque overlay: without
      // this, "still in the DOM" would mean "tabbable behind the gate".
      const { container } = renderGate();
      const wrapper = container.querySelector("div[inert]");

      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toContainElement(screen.getByTestId("main"));
    });

    it("renders the gate as a fixed full-screen overlay", () => {
      renderGate();
      const dialog = screen.getByRole("dialog");

      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog.className).toContain("fixed");
      expect(dialog.className).toContain("inset-0");
    });

    it("locks body scrolling", () => {
      renderGate();
      expect(document.body.style.overflow).toBe("hidden");
    });
  });

  describe("after clicking YES", () => {
    it("removes the gate and releases the content", () => {
      const { container } = renderGate();

      fireEvent.click(screen.getByRole("button", { name: /xác nhận đủ 18 tuổi|yes/i }));

      expect(gateHeading()).not.toBeInTheDocument();
      expect(container.querySelector("div[inert]")).not.toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe("hidden");
      expect(screen.getByTestId("main")).toBeInTheDocument();
    });
  });

  describe("when already verified", () => {
    it("renders children with no gate and no inert wrapper", () => {
      localStorage.setItem("otter_age_verified", "true");

      const { container } = renderGate();

      expect(screen.getByTestId("header")).toBeInTheDocument();
      expect(screen.getByTestId("main")).toBeInTheDocument();
      expect(screen.getByTestId("footer")).toBeInTheDocument();
      expect(gateHeading()).not.toBeInTheDocument();
      expect(container.querySelector("div[inert]")).not.toBeInTheDocument();
      expect(document.body.style.overflow).not.toBe("hidden");
    });
  });
});
