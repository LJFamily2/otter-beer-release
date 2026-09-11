import {
  buildBrandStoryBook,
  chapterIndexForSpread,
} from "@/config/brandStoryChapters";

describe("buildBrandStoryBook", () => {
  it("gives a chapter one spread per pair of images", () => {
    const book = buildBrandStoryBook([{ title: "A", images: ["1", "2", "3", "4"] }]);

    expect(book.totalSpreads).toBe(2);
    expect(book.chapters[0].spreadCount).toBe(2);
    expect(book.pages.map((p) => p.src)).toEqual(["1", "2", "3", "4"]);
  });

  it("pads an odd chapter with a blank leaf so the next one opens on a left page", () => {
    const book = buildBrandStoryBook([
      { title: "A", images: ["1", "2", "3"] },
      { title: "B", images: ["4", "5"] },
    ]);

    expect(book.pages.map((p) => p.src)).toEqual(["1", "2", "3", null, "4", "5"]);
    // "B" starts on an even page index, i.e. a left-hand page.
    expect(book.chapters[1].startSpread * 2).toBe(4);
    expect(book.pages[3].positionInChapter).toBe(0);
    expect(book.pages[2].positionInChapter).toBe(3);
  });

  it("lays chapters out back to back without gaps or overlap", () => {
    const book = buildBrandStoryBook([
      { title: "A", images: ["1", "2", "3"] },
      { title: "B", images: ["4", "5"] },
      { title: "C", images: ["6", "7", "8", "9"] },
    ]);

    expect(book.chapters.map((c) => [c.startSpread, c.endSpread])).toEqual([
      [0, 1],
      [2, 2],
      [3, 4],
    ]);
    expect(book.totalSpreads).toBe(5);
  });

  it("still gives an empty chapter one spread rather than collapsing it", () => {
    const book = buildBrandStoryBook([{ title: "A", images: [] }]);

    expect(book.chapters[0].spreadCount).toBe(1);
    expect(book.pages.map((p) => p.src)).toEqual([null, null]);
  });

  it("tags every page with the chapter it belongs to", () => {
    const book = buildBrandStoryBook([
      { title: "A", images: ["1", "2", "3"] },
      { title: "B", images: ["4", "5"] },
    ]);

    expect(book.pages.map((p) => p.chapterTitle)).toEqual(["A", "A", "A", "A", "B", "B"]);
    expect(book.pages.map((p) => p.chapterIndex)).toEqual([0, 0, 0, 0, 1, 1]);
  });
});

describe("chapterIndexForSpread", () => {
  const book = buildBrandStoryBook([
    { title: "A", images: ["1", "2", "3"] },
    { title: "B", images: ["4", "5"] },
    { title: "C", images: ["6", "7", "8", "9"] },
  ]);

  it("keeps a chapter current across every spread it owns", () => {
    expect(chapterIndexForSpread(book, 0)).toBe(0);
    expect(chapterIndexForSpread(book, 1)).toBe(0);
    expect(chapterIndexForSpread(book, 2)).toBe(1);
    expect(chapterIndexForSpread(book, 3)).toBe(2);
    expect(chapterIndexForSpread(book, 4)).toBe(2);
  });

  it("clamps out-of-range spreads instead of returning -1", () => {
    expect(chapterIndexForSpread(book, -1)).toBe(0);
    expect(chapterIndexForSpread(book, 99)).toBe(2);
  });
});


