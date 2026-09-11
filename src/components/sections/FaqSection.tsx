import { DEFAULT_LOCALE } from "@/config/locales";
import { faqFor } from "@/config/faq";

interface FaqSectionProps {
  locale?: string;
}

const COPY = {
  vi: {
    kicker: "CÂU HỎI THƯỜNG GẶP",
    heading: "Những Điều Bạn Hay Hỏi Về Otter Beer",
    subtext:
      "Giải đáp mọi thắc mắc của bạn về nguồn gốc, nguyên liệu, nơi mua và cách đặt bia cho sự kiện.",
  },
  en: {
    kicker: "FREQUENTLY ASKED QUESTIONS",
    heading: "What People Ask About Otter Beer",
    subtext:
      "Find all the answers regarding our ingredients, brewing process, where to buy, and event orders.",
  },
} as const;

/**
 * The site's Answer Engine Optimization (AEO) surface.
 *
 * Deliberately a Server Component built on native `<details>`/`<summary>`
 * rather than a JS accordion. Both matter for the same reason: every answer
 * ships inside the server-rendered HTML whether or not the item is open, so a
 * crawler or an LLM fetching the page without executing JavaScript still reads
 * the full text. A client-side accordion that mounts its answers on click is
 * invisible to most of them.
 *
 * The questions and answers come from `src/config/faq.ts`, which also feeds the
 * `FAQPage` JSON-LD on the homepage — visible copy and markup are the same
 * strings by construction, never two drifting copies.
 */
export function FaqSection({ locale = DEFAULT_LOCALE }: FaqSectionProps) {
  const copy = COPY[locale as keyof typeof COPY] ?? COPY.en;
  const entries = faqFor(locale);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative w-full bg-background py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1280px] px-6 sm:px-10 lg:px-16">
        <div className="max-w-3xl">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-secondary">
            {copy.kicker}
          </span>

          <h2
            id="faq-heading"
            className="mt-3 font-display text-3xl uppercase leading-[1.1] tracking-wide text-primary sm:text-4xl md:text-5xl"
          >
            {copy.heading}
          </h2>

          <p className="mt-4 text-base leading-relaxed text-primary-container/90 sm:text-lg">
            {copy.subtext}
          </p>
        </div>

        <dl className="mt-10 divide-y divide-primary/15 border-t border-primary/15">
          {entries.map((entry) => (
            <div key={entry.question} className="py-2">
              {/* <details> carries the disclosure behaviour; the dt/dd pair
                  inside it carries the question/answer semantics that the dl
                  wrapper promises. */}
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary [&::-webkit-details-marker]:hidden">
                  <dt className="text-base font-semibold leading-snug text-primary sm:text-lg">
                    {entry.question}
                  </dt>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-secondary transition-transform duration-200 group-open:rotate-45"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>

                <dd className="pb-5 pr-10 text-[15px] leading-relaxed text-primary-container/90 sm:text-base">
                  {entry.answer}
                </dd>
              </details>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
