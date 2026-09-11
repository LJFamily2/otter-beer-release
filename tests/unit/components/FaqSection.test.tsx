import { render, screen } from "@testing-library/react";
import { FaqSection } from "@/components/sections/FaqSection";
import { faqFor, FAQ } from "@/config/faq";
import { buildFaqJsonLd } from "@/lib/seo";

describe("FaqSection", () => {
  it("renders every question and answer for the default (vi) locale", () => {
    render(<FaqSection />);

    for (const entry of faqFor("vi")) {
      expect(screen.getByText(entry.question)).toBeInTheDocument();
      expect(screen.getByText(entry.answer)).toBeInTheDocument();
    }
  });

  it("renders the English set for the en locale", () => {
    render(<FaqSection locale="en" />);

    expect(screen.getByText("What is Otter Beer?")).toBeInTheDocument();
    expect(screen.queryByText("Otter Beer là bia gì?")).not.toBeInTheDocument();
  });

  it("falls back to English for an unknown locale", () => {
    render(<FaqSection locale="fr" />);
    expect(screen.getByText("What is Otter Beer?")).toBeInTheDocument();
  });

  it("ships every answer in the markup even while collapsed", () => {
    // The whole point of using <details> over a JS accordion: a crawler or an
    // LLM that fetches the HTML without running scripts still reads the
    // answers. If this ever regresses to a mount-on-open accordion, the FAQ
    // stops being an AEO asset.
    const { container } = render(<FaqSection locale="en" />);

    for (const details of container.querySelectorAll("details")) {
      expect(details).not.toHaveAttribute("open");
    }
    for (const entry of faqFor("en")) {
      expect(screen.getByText(entry.answer)).toBeInTheDocument();
    }
  });

  it("exposes each pair as a dt/dd inside a definition list", () => {
    const { container } = render(<FaqSection locale="en" />);

    expect(container.querySelector("dl")).toBeInTheDocument();
    expect(container.querySelectorAll("dt")).toHaveLength(faqFor("en").length);
    expect(container.querySelectorAll("dd")).toHaveLength(faqFor("en").length);
  });

  it("renders a labelled section with a heading and an #faq anchor", () => {
    const { container } = render(<FaqSection locale="en" />);
    const section = container.querySelector("section");

    expect(section).toHaveAttribute("id", "faq");
    expect(
      screen.getByRole("heading", { level: 2, name: /What People Ask/i })
    ).toBeInTheDocument();
  });

  it("renders the exact strings the FAQPage JSON-LD emits", () => {
    // Google discounts (and can penalise) FAQ markup whose answers are not
    // present in the visible page, so the two must be the same strings —
    // which they are, by both reading src/config/faq.ts. This guards the
    // wiring, not the copy.
    render(<FaqSection locale="en" />);

    const questions = buildFaqJsonLd("en", faqFor("en")).mainEntity as {
      name: string;
      acceptedAnswer: { text: string };
    }[];

    for (const question of questions) {
      expect(screen.getByText(question.name)).toBeInTheDocument();
      expect(screen.getByText(question.acceptedAnswer.text)).toBeInTheDocument();
    }
  });
});

describe("FAQ content", () => {
  it("covers both supported locales with the same number of entries", () => {
    expect(FAQ.vi.length).toBe(FAQ.en.length);
    expect(FAQ.vi.length).toBeGreaterThanOrEqual(5);
  });

  it("phrases every entry as a question", () => {
    for (const entries of [FAQ.vi, FAQ.en]) {
      for (const entry of entries) {
        expect(entry.question.trim()).toMatch(/\?$/);
      }
    }
  });

  it("gives every answer enough substance to stand alone as a snippet", () => {
    // An answer engine lifts the first sentence out of context, so an answer
    // too short to be self-contained is an answer that gets paraphrased wrong.
    for (const entries of [FAQ.vi, FAQ.en]) {
      for (const entry of entries) {
        expect(entry.answer.length).toBeGreaterThan(80);
      }
    }
  });

  it("names the brand somewhere in every answer set", () => {
    for (const entries of [FAQ.vi, FAQ.en]) {
      const mentions = entries.filter((e) => /Otter Beer/i.test(e.answer));
      expect(mentions.length).toBeGreaterThan(0);
    }
  });
});
