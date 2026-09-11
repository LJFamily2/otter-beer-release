import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrandStorySection } from "@/components/sections/BrandStorySection";
import { BrandStoryMobile } from "@/components/sections/BrandStoryMobile";
import { buildBrandStoryBook } from "@/config/brandStoryChapters";

// Minimal fixture used wherever the tests need a populated book.
const SAMPLE_CHAPTERS = [
  { title: "Our Story", images: ["/a.jpg", "/b.jpg", "/c.jpg"] },
  { title: "Ingredients", images: ["/d.jpg", "/e.jpg"] },
  { title: "Brewing", images: ["/f.jpg", "/g.jpg", "/h.jpg", "/i.jpg"] },
  { title: "Community", images: ["/j.jpg", "/k.jpg", "/l.jpg"] },
  { title: "Journal", images: ["/m.jpg", "/n.jpg"] },
];

const SAMPLE_BOOK = buildBrandStoryBook(SAMPLE_CHAPTERS);

jest.mock("react-pageflip", () => {
  const MockFlipBook = React.forwardRef<
    { pageFlip: () => { flipNext: () => void; flipPrev: () => void; turnToPage: (page: number) => void } },
    { children?: React.ReactNode; onFlip?: (e: { data: number }) => void }
  >(({ children, onFlip }, ref) => {
    let currentPage = 0;
    React.useImperativeHandle(ref, () => ({
      pageFlip: () => ({
        flipNext: () => {
          currentPage = Math.min(currentPage + 2, 4);
          onFlip?.({ data: currentPage });
        },
        flipPrev: () => {
          currentPage = Math.max(currentPage - 2, 0);
          onFlip?.({ data: currentPage });
        },
        turnToPage: (page: number) => {
          currentPage = page;
          onFlip?.({ data: currentPage });
        },
      }),
    }));
    return <div className="mock-flipbook">{children}</div>;
  });
  MockFlipBook.displayName = "MockFlipBook";
  return {
    __esModule: true,
    default: MockFlipBook,
  };
});

const TOTAL = SAMPLE_BOOK.totalSpreads;

describe("BrandStorySection", () => {
  it("renders the first spread and localized chrome copy", () => {
    render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

    expect(screen.getAllByText("CÂU CHUYỆN THƯƠNG HIỆU")[0]).toBeInTheDocument();
    expect(screen.getByText(`Trang 1 / ${TOTAL}`)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Trang trước" })[0]).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Trang sau" })[0]).toBeEnabled();
  });

  it("falls back to English chrome copy for an unsupported locale", () => {
    render(<BrandStorySection locale="fr" chapters={SAMPLE_CHAPTERS} />);

    expect(screen.getAllByText("BRAND STORY")[0]).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Previous page" })[0]).toBeInTheDocument();
  });

  it("advances to the next spread and back on arrow clicks", async () => {
    const user = userEvent.setup();
    render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

    await user.click(screen.getAllByRole("button", { name: "Trang sau" })[0]);
    expect(screen.getByText(`Trang 2 / ${TOTAL}`)).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Trang trước" })[0]);
    expect(screen.getByText(`Trang 1 / ${TOTAL}`)).toBeInTheDocument();
  });

  it("disables the next arrow on the last spread and re-enables prev", async () => {
    const user = userEvent.setup();
    render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);
    const next = screen.getAllByRole("button", { name: "Trang sau" })[0];

    for (let i = 0; i < TOTAL - 1; i++) {
      await user.click(next);
    }

    expect(screen.getByText(`Trang ${TOTAL} / ${TOTAL}`)).toBeInTheDocument();
    expect(next).toBeDisabled();
    expect(screen.getAllByRole("button", { name: "Trang trước" })[0]).toBeEnabled();
  });

  it("exposes only the current spread to the a11y tree while a page is turning", async () => {
    const user = userEvent.setup();
    render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

    await user.click(screen.getAllByRole("button", { name: "Trang sau" })[0]);

    expect(screen.getByText(`Trang 2 / ${TOTAL}`)).toBeInTheDocument();
  });

  it("does not advance past the last spread", async () => {
    const user = userEvent.setup();
    render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);
    const next = screen.getAllByRole("button", { name: "Trang sau" })[0];

    for (let i = 0; i < TOTAL + 3; i++) {
      await user.click(next);
    }

    expect(screen.getByText(`Trang ${TOTAL} / ${TOTAL}`)).toBeInTheDocument();
  });

  describe("chapter page-edge stack", () => {
    const chapterTabs = () => screen.queryAllByRole("button", { name: /^Mở chương / });
    const nextArrow = () => screen.getAllByRole("button", { name: "Trang sau" })[0];
    const prevArrow = () => screen.getAllByRole("button", { name: "Trang trước" })[0];

    it("renders one page-edge tab per chapter, the first marked current", () => {
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const tabs = chapterTabs();
      expect(tabs).toHaveLength(SAMPLE_BOOK.chapters.length);
      expect(tabs[0]).toHaveAttribute("aria-current", "true");
      expect(tabs[1]).not.toHaveAttribute("aria-current");
    });

    it("keeps a multi-image chapter current until all of its pages are turned", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      // "Our Story" holds 3 images — two spreads' worth of turning.
      const [ourStory, ingredients] = SAMPLE_BOOK.chapters;
      expect(ourStory.spreadCount).toBe(2);

      await user.click(nextArrow());

      // Still inside the same chapter, so the tab has not changed over.
      expect(screen.getByRole("button", { name: `Mở chương ${ourStory.title}` })).toHaveAttribute(
        "aria-current",
        "true"
      );
      expect(chapterTabs()).toHaveLength(SAMPLE_BOOK.chapters.length);

      await user.click(nextArrow());

      // Only now does the next chapter take over.
      expect(screen.getByRole("button", { name: `Mở chương ${ingredients.title}` })).toHaveAttribute(
        "aria-current",
        "true"
      );
      expect(screen.getByRole("button", { name: `Mở chương ${ourStory.title}` })).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("gives a 4-image chapter two spreads before handing over", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const brewing = SAMPLE_BOOK.chapters[2];
      expect(brewing.images).toHaveLength(4);
      expect(brewing.spreadCount).toBe(2);

      await user.click(screen.getByRole("button", { name: `Mở chương ${brewing.title}` }));
      expect(screen.getByText(`Trang ${brewing.startSpread + 1} / ${TOTAL}`)).toBeInTheDocument();

      await user.click(nextArrow());
      expect(screen.getByRole("button", { name: `Mở chương ${brewing.title}` })).toHaveAttribute(
        "aria-current",
        "true"
      );

      await user.click(nextArrow());
      expect(screen.getByRole("button", { name: `Mở chương ${brewing.title}` })).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("stacks read chapters on the left and unread chapters on the right as the reader advances", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const community = SAMPLE_BOOK.chapters[3];
      await user.click(screen.getByRole("button", { name: `Mở chương ${community.title}` }));

      const tabs = chapterTabs();
      expect(tabs).toHaveLength(SAMPLE_BOOK.chapters.length);
      expect(screen.getByRole("button", { name: `Mở chương ${community.title}` })).toHaveAttribute(
        "aria-current",
        "true"
      );
    });

    it("restores read chapters to the right stack when the reader goes back", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const ingredients = SAMPLE_BOOK.chapters[1];
      await user.click(screen.getByRole("button", { name: `Mở chương ${ingredients.title}` }));
      expect(chapterTabs()).toHaveLength(SAMPLE_BOOK.chapters.length);

      await user.click(prevArrow());
      expect(chapterTabs()).toHaveLength(SAMPLE_BOOK.chapters.length);
      expect(screen.getByRole("button", { name: `Mở chương ${SAMPLE_BOOK.chapters[0].title}` })).toHaveAttribute(
        "aria-current",
        "true"
      );
    });

    it("jumps to the chapter's first spread when its tab is clicked", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const journal = SAMPLE_BOOK.chapters[4];
      await user.click(screen.getByRole("button", { name: `Mở chương ${journal.title}` }));

      expect(screen.getByText(`Trang ${journal.startSpread + 1} / ${TOTAL}`)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: `Mở chương ${journal.title}` })).toHaveAttribute(
        "aria-current",
        "true"
      );
    });

    it("announces how far through a chapter's images the reader is", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      expect(screen.getByText("Trang 1 / 2 của chương, gồm 3 ảnh")).toBeInTheDocument();

      await user.click(nextArrow());
      expect(screen.getByText("Trang 2 / 2 của chương, gồm 3 ảnh")).toBeInTheDocument();
    });
  });

  describe("keyboard and chrome copy", () => {
    it("turns pages with the arrow keys", async () => {
      const user = userEvent.setup();
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const book = screen.getByRole("group", { name: "Cuốn sách câu chuyện thương hiệu" });
      book.focus();

      await user.keyboard("{ArrowRight}");
      expect(screen.getByText(`Trang 2 / ${TOTAL}`)).toBeInTheDocument();

      await user.keyboard("{ArrowLeft}");
      expect(screen.getByText(`Trang 1 / ${TOTAL}`)).toBeInTheDocument();
    });

    it("renders the localized title block", () => {
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const heading = screen.getAllByText("TỪ HẠT")[0].closest("h2");
      expect(heading).toHaveTextContent("TỪ HẠTLÚA MẠCHĐẾN LY BIA");
      expect(screen.getAllByText("CÂU CHUYỆN THƯƠNG HIỆU")[0]).toBeInTheDocument();
    });

    it("falls back to English title copy", () => {
      render(<BrandStorySection locale="fr" chapters={SAMPLE_CHAPTERS} />);

      expect(screen.getAllByText("GRAIN TO")[0].closest("h2")).toHaveTextContent("FROMGRAIN TOGLASS");
      expect(screen.getAllByText("BRAND STORY")[0]).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Open chapter Our Story" })).toBeInTheDocument();
    });

    it("drops the how-to-use feature list and instruction bar", () => {
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      expect(screen.queryByText("LẬT SÁCH MƯỢT MÀ")).not.toBeInTheDocument();
      expect(screen.queryByText("BỐ CỤC TỰ DO")).not.toBeInTheDocument();
      expect(screen.queryByText("TRẢI NGHIỆM TỰ NHIÊN")).not.toBeInTheDocument();
      expect(screen.queryByText("CLICK / ARROW KEY")).not.toBeInTheDocument();
      expect(screen.queryByText("Vuốt trái / phải trên mobile")).not.toBeInTheDocument();
    });

    it("keeps heading leading loose enough for Anton's Vietnamese diacritics", () => {
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const heading = screen.getAllByText("TỪ HẠT")[0].closest("h2")!;
      const leading = heading.className.match(/leading-\[([\d.]+)\]/);
      expect(leading).not.toBeNull();
      expect(Number(leading![1])).toBeGreaterThanOrEqual(1.31);
    });

    it("colours the heading against the dark stage, not with the global h2 rule", () => {
      render(<BrandStorySection locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const line = screen.getAllByText("TỪ HẠT")[0];
      expect(line.tagName).toBe("SPAN");
      expect(line).toHaveClass("text-[#f7f4ef]");
    });
  });

  describe("BrandStoryMobile", () => {
    it("renders mobile kicker, headline, and initial page count", () => {
      render(<BrandStoryMobile locale="vi" chapters={SAMPLE_CHAPTERS} />);

      expect(screen.getByText("CÂU CHUYỆN THƯƠNG HIỆU")).toBeInTheDocument();
      expect(screen.getByText("TỪ HẠT LÚA MẠCH")).toBeInTheDocument();
      expect(screen.getByText("ĐẾN LY BIA TRÒN VỊ")).toBeInTheDocument();
      // SAMPLE_CHAPTERS sliced to 4, total images = 3+2+4+3 = 12
      expect(screen.getByText("TRANG 1 / 12")).toBeInTheDocument();
      expect(screen.getByText("VUỐT ĐỂ CHUYỂN TRANG")).toBeInTheDocument();
    });

    it("switches mobile slides when chapter navigation buttons are clicked", async () => {
      const user = userEvent.setup();
      render(<BrandStoryMobile locale="vi" chapters={SAMPLE_CHAPTERS} />);

      const nav = screen.getByRole("navigation", { name: "Brand Story Chapters" });
      const brewingBtn = within(nav).getByRole("button", { name: "Brewing" });

      await user.click(brewingBtn);

      // Our Story (3) + Ingredients (2) = 5 slides before Brewing, so slide 6
      expect(screen.getByText("TRANG 6 / 12")).toBeInTheDocument();
    });

    it("renders the given chapters when passed", () => {
      render(
        <BrandStoryMobile
          locale="vi"
          chapters={[{ title: "Câu Chuyện", images: ["/api/media/public/brand-story/a.jpg"] }]}
        />
      );

      expect(screen.getByText("TRANG 1 / 1")).toBeInTheDocument();
      expect(
        within(screen.getByRole("navigation", { name: "Brand Story Chapters" })).getByRole(
          "button",
          { name: "Câu Chuyện" }
        )
      ).toBeInTheDocument();
    });
  });

  describe("custom chapters prop", () => {
    it("renders the given chapters on desktop", () => {
      render(
        <BrandStorySection
          locale="vi"
          chapters={[
            { title: "Chương Một", images: ["/api/media/public/brand-story/a.jpg"] },
            { title: "Chương Hai", images: ["/api/media/public/brand-story/b.jpg"] },
          ]}
        />
      );

      expect(screen.getAllByText("Trang 1 / 2")[0]).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mở chương Chương Một" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Mở chương Chương Hai" })).toBeInTheDocument();
    });
  });
});

