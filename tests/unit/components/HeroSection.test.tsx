import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HeroSection } from "@/components/sections/HeroSection";
import { setPrefersReducedMotion } from "../../support/matchMedia";

const SAMPLE_SLIDES = [
  { src: "/images/otter-beer-hero.png", alt: "Lon bia thủ công Otter Beer trên nền tối — dòng bia chủ lực nấu tại Tây Ninh", mediaType: "image" as const },
  { src: "/images/otter-beer-premium-lager.jpg", alt: "Bia Otter Beer Premium Lager rót ra ly, bọt mịn, màu vàng hổ phách", mediaType: "image" as const },
  { src: "/images/contact-hero.jpg", alt: "Không gian taproom của nhà máy bia Otter Beer tại Tây Ninh", mediaType: "image" as const },
  { src: "/images/brand-story-bg.jpg", alt: "Mạch nha vàng và hoa bia Saaz — nguyên liệu nấu bia thủ công Otter Beer", mediaType: "image" as const },
];
const SLIDE_COUNT = SAMPLE_SLIDES.length;
const DWELL_MS = 6000;

function setTabHidden(hidden: boolean) {
  Object.defineProperty(document, "hidden", {
    writable: true,
    configurable: true,
    value: hidden,
  });
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

/** The live region is the component's own statement of which slide is current. */
function currentSlideNumber() {
  const region = screen.getByText(/^Slide \d+ of \d+:/);
  return Number(/^Slide (\d+) of/.exec(region.textContent ?? "")?.[1]);
}

function indicators() {
  return within(screen.getByRole("group", { name: "Hero slides" })).getAllByRole(
    "button"
  );
}

describe("HeroSection Component", () => {
  beforeEach(() => {
    setPrefersReducedMotion(false);
    setTabHidden(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("structure", () => {
    it("renders one indicator button per slide", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);
      expect(indicators()).toHaveLength(SLIDE_COUNT);
    });

    it("does not render previous/next arrow controls", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(
        screen.queryByRole("button", { name: /previous slide/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /next slide/i })
      ).not.toBeInTheDocument();
    });

    it("mounts the neighbouring slides so the next image is preloaded", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      // Window is [last, first, second] on the opening frame. Matched on a
      // substring so the assertion is about which slides are mounted, not
      // about the exact wording of the (SEO-tuned) alt copy.
      expect(screen.getByAltText(/dòng bia chủ lực/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Premium Lager/i)).toBeInTheDocument();
      expect(screen.getByAltText(/hoa bia Saaz/i)).toBeInTheDocument();
    });

    /**
     * All three mounted slides are full-viewport (`sizes="100vw"`). Left at
     * equal priority they race each other for bandwidth and the one actually
     * on screen — the LCP element — finishes last. They stay `eager` rather
     * than `lazy` so a swipe never lands on a blank cell.
     */
    it("lets the on-screen slide outrank its neighbours for bandwidth", () => {
      const { container } = render(<HeroSection slides={SAMPLE_SLIDES} />);

      const priorities = [...container.querySelectorAll("img")].map((img) =>
        img.getAttribute("fetchpriority")
      );

      expect(priorities).toContain("high");
      expect(priorities.filter((p) => p === "high")).toHaveLength(1);
      expect(priorities.filter((p) => p === "low").length).toBeGreaterThan(0);
    });

    it("keeps every mounted slide eager so a swipe never shows a blank cell", () => {
      const { container } = render(<HeroSection slides={SAMPLE_SLIDES} />);

      for (const img of container.querySelectorAll("img")) {
        expect(img.getAttribute("loading")).toBe("eager");
      }
    });

    it("gives every slide alt text that names the brand", () => {
      const { container } = render(<HeroSection slides={SAMPLE_SLIDES} />);

      // Queried by tag, not by role: the whole slide stage is aria-hidden
      // (the live region announces the current slide instead), so these <img>
      // elements expose no `img` role. Alt text is still what image search and
      // answer engines read off this section, and a slide whose alt omits the
      // brand is invisible to both.
      const images = container.querySelectorAll("img");
      expect(images.length).toBeGreaterThan(0);
      for (const image of images) {
        expect(image.getAttribute("alt")).toMatch(/Otter Beer/i);
      }
    });

    it("renders the page's single h1 naming the brand and the place", () => {
      render(<HeroSection locale="vi" slides={SAMPLE_SLIDES} />);

      const headings = screen.getAllByRole("heading", { level: 1 });
      expect(headings).toHaveLength(1);
      expect(headings[0]).toHaveTextContent(/Otter Beer/i);
      expect(headings[0]).toHaveTextContent(/Tây Ninh/i);
    });

    it("renders the English heading for the en locale", () => {
      render(<HeroSection locale="en" slides={SAMPLE_SLIDES} />);

      expect(
        screen.getByRole("heading", { level: 1, name: /Otter Beer craft brewery/i })
      ).toBeInTheDocument();
    });

    it("keeps the hero image-only — the heading is not painted on the slides", () => {
      // The design is deliberately photography with no type over it. The h1
      // still has to exist for crawlers and screen readers, so it is sr-only;
      // if it ever renders visibly again, that is a design regression.
      render(<HeroSection locale="vi" slides={SAMPLE_SLIDES} />);

      expect(screen.getByRole("heading", { level: 1 })).toHaveClass("sr-only");
    });

    it("exposes the current slide through aria-current and a live region", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(currentSlideNumber()).toBe(1);
      expect(indicators()[0]).toHaveAttribute("aria-current", "true");
      expect(indicators()[1]).not.toHaveAttribute("aria-current");
    });

    it("does not present itself as a tablist", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
      expect(screen.queryAllByRole("tab")).toHaveLength(0);
    });
  });

  describe("indicator navigation", () => {
    it("jumps to the clicked slide", async () => {
      const user = userEvent.setup();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      await user.click(indicators()[2]);

      expect(currentSlideNumber()).toBe(3);
      expect(indicators()[2]).toHaveAttribute("aria-current", "true");
      expect(indicators()[0]).not.toHaveAttribute("aria-current");
    });

    it("moves between slides with the arrow keys", async () => {
      const user = userEvent.setup();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      await user.click(indicators()[0]);
      await user.keyboard("{ArrowRight}");
      expect(currentSlideNumber()).toBe(2);

      await user.keyboard("{ArrowLeft}");
      expect(currentSlideNumber()).toBe(1);
    });

    it("wraps backwards from the first slide to the last", async () => {
      const user = userEvent.setup();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      await user.click(indicators()[0]);
      await user.keyboard("{ArrowLeft}");

      expect(currentSlideNumber()).toBe(SLIDE_COUNT);
    });
  });

  describe("autoplay", () => {
    it("advances to the next slide after the dwell elapses", () => {
      jest.useFakeTimers();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(currentSlideNumber()).toBe(1);

      act(() => {
        jest.advanceTimersByTime(DWELL_MS);
      });
      expect(currentSlideNumber()).toBe(2);

      act(() => {
        jest.advanceTimersByTime(DWELL_MS);
      });
      expect(currentSlideNumber()).toBe(3);
    });

    it("wraps from the last slide back to the first", () => {
      jest.useFakeTimers();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      // One dwell at a time: collapsing them into a single jump lets Jest
      // flush the timer the effect re-registers mid-window, which double-counts.
      const seen: number[] = [];
      for (let i = 0; i < SLIDE_COUNT; i++) {
        act(() => {
          jest.advanceTimersByTime(DWELL_MS);
        });
        seen.push(currentSlideNumber());
      }

      expect(seen).toEqual([2, 3, 4, 1]);
    });

    it("stops advancing while the tab is hidden and resumes when it returns", () => {
      jest.useFakeTimers();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      setTabHidden(true);
      for (let i = 0; i < 3; i++) {
        act(() => {
          jest.advanceTimersByTime(DWELL_MS);
        });
      }
      expect(currentSlideNumber()).toBe(1);

      setTabHidden(false);
      act(() => {
        jest.advanceTimersByTime(DWELL_MS);
      });
      expect(currentSlideNumber()).toBe(2);
    });

    it("marks the indicator fill paused while the tab is hidden", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(screen.getByTestId("hero-indicator-fill")).toHaveAttribute(
        "data-paused",
        "false"
      );

      setTabHidden(true);
      expect(screen.getByTestId("hero-indicator-fill")).toHaveAttribute(
        "data-paused",
        "true"
      );
    });

    it("renders the fill only on the active indicator", async () => {
      const user = userEvent.setup();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(screen.getAllByTestId("hero-indicator-fill")).toHaveLength(1);
      expect(indicators()[0]).toContainElement(
        screen.getByTestId("hero-indicator-fill")
      );

      await user.click(indicators()[2]);

      expect(indicators()[2]).toContainElement(
        screen.getByTestId("hero-indicator-fill")
      );
    });
  });

  describe("slides prop", () => {
    it("renders the given slides instead of the fallback set when non-empty", () => {
      render(
        <HeroSection
          slides={[
            { src: "/api/media/public/hero/a.jpg", alt: "Otter Beer slide A", mediaType: "image" },
            { src: "/api/media/public/hero/b.jpg", alt: "Otter Beer slide B", mediaType: "image" },
          ]}
        />
      );

      expect(indicators()).toHaveLength(2);
      expect(screen.getByAltText("Otter Beer slide A")).toBeInTheDocument();
    });



    it("renders a video element for a video-type slide", () => {
      const { container } = render(
        <HeroSection
          slides={[
            { src: "/api/media/public/hero/clip.mp4", alt: "Otter Beer clip", mediaType: "video" },
          ]}
        />
      );

      expect(container.querySelector("video")).toBeInTheDocument();
    });
  });

  describe("reduced motion", () => {
    it("cross-fades instead of sliding and disables autoplay", () => {
      jest.useFakeTimers();
      setPrefersReducedMotion(true);
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(screen.getByTestId("hero-crossfade")).toBeInTheDocument();
      expect(screen.queryByTestId("hero-track")).not.toBeInTheDocument();

      for (let i = 0; i < 3; i++) {
        act(() => {
          jest.advanceTimersByTime(DWELL_MS);
        });
      }
      expect(currentSlideNumber()).toBe(1);
    });

    it("keeps the indicators usable", async () => {
      setPrefersReducedMotion(true);
      const user = userEvent.setup();
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      await user.click(indicators()[1]);

      expect(currentSlideNumber()).toBe(2);
    });
  });

  describe("above-the-fold call to action", () => {
    it("does not render CTA buttons", () => {
      render(<HeroSection slides={SAMPLE_SLIDES} />);

      expect(screen.queryByTestId("hero-cta-primary")).not.toBeInTheDocument();
      expect(screen.queryByTestId("hero-cta-secondary")).not.toBeInTheDocument();
    });

    it("still renders the sr-only h1", () => {
      render(<HeroSection locale="en" slides={SAMPLE_SLIDES} />);

      expect(
        screen.getByRole("heading", { level: 1, name: /otter beer craft brewery/i })
      ).toBeInTheDocument();
    });
  });
});
