import { Playfair_Display } from "next/font/google";
import { DEFAULT_LOCALE } from "@/config/locales";

const playfair = Playfair_Display({
  subsets: ["latin", "vietnamese"],
  style: ["italic", "normal"],
  weight: ["600", "700"],
  display: "swap",
});

interface TaglineSectionProps {
  locale?: string;
}

const COPY = {
  vi: {
    kicker: "TRIẾT LÝ NẤU BIA THỦ CÔNG",
    heading: "Mỗi Ngụm Bia, Một Câu Chuyện",
    subtext:
      "Otter Beer không chỉ là thức uống. Mỗi hương vị đều mang theo câu chuyện về vùng đất, con người và những kết nối đằng sau nó.",
    pillars: [
      "THỦ CÔNG TINH TUYỂN",
      "HƯƠNG VỊ TÂY NINH",
      "BẢN SẮC ĐỊA PHƯƠNG",
      "TRẢI NGHIỆM KHÁC BIỆT",
    ],
  },
  en: {
    kicker: "CRAFT BREWING PHILOSOPHY",
    heading: "Every Sip Tells a Story",
    subtext:
      "Otter Beer isn't just something to drink. Every flavor carries a story of the land, the people, and the connections behind it.",
    pillars: [
      "CURATED CRAFT",
      "TAY NINH FLAVOR",
      "LOCAL IDENTITY",
      "DISTINCT EXPERIENCE",
    ],
  },
} as const;

export function TaglineSection({ locale = DEFAULT_LOCALE }: TaglineSectionProps) {
  const content = COPY[locale as keyof typeof COPY] ?? COPY.en;

  return (
    <section
      aria-label="Brand Tagline"
      className="relative w-full overflow-hidden bg-background text-primary py-12 sm:py-16 lg:py-20"
    >
      <div className="relative z-10 mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-16">

          {/* Left Column: Heading & Philosophy */}
          <div className="max-w-3xl">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-secondary">
              {content.kicker}
            </span>

            <h2
              className={`${playfair.className} mt-3 text-3xl font-bold italic tracking-tight text-primary sm:text-4xl md:text-5xl lg:text-[56px] lg:leading-[1.12]`}
            >
              {content.heading}
            </h2>

            <p className="mt-4 max-w-2xl text-base font-medium leading-relaxed text-primary-container/90 sm:text-lg md:text-xl">
              {content.subtext}
            </p>
          </div>

          {/* Right Column: Airy Minimalist List */}
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 lg:mt-0 lg:max-w-[420px] lg:justify-end lg:pb-1">
            {content.pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 text-[11px] font-mono font-bold tracking-widest text-primary/70"
              >
                <span className="text-secondary/50 font-light text-[10px]">+</span>
                <span>{pillar}</span>
              </div>
            ))}
          </div>

        </div>

        {/* Decorative Bottom Leader Line */}
        <div className="mt-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-primary/40">
            EST. 2024 • TAY NINH, VIETNAM
          </span>
        </div>
      </div>
    </section>
  );
}

