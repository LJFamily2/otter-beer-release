import type { FaqEntry } from "@/lib/seo";

/**
 * Homepage FAQ — the site's Answer Engine Optimization (AEO) core.
 *
 * One source of truth feeding two consumers: the visible `FaqSection` and the
 * `FAQPage` JSON-LD (see buildFaqJsonLd). They MUST stay identical — Google
 * penalises FAQ markup whose answers are not present in the visible page, and
 * an LLM that finds a mismatch between markup and prose trusts neither.
 *
 * Each entry is written to three rules:
 *
 * 1. The question is phrased the way a person actually types or speaks it
 *    ("Bia Otter Beer nấu ở đâu?"), not as a marketing header.
 * 2. The answer's FIRST sentence answers it completely and can be lifted out
 *    of context — that lifted sentence is what becomes a featured snippet or
 *    an LLM's cited line.
 * 3. The answer names concrete, checkable entities: the brewery, the province,
 *    the ingredients, the ABV/IBU numbers, the year. Specifics are what a
 *    generative engine can ground a citation on; adjectives are not.
 */
export const FAQ: Record<"vi" | "en", readonly FaqEntry[]> = {
  vi: [
    {
      question: "Otter Beer là bia gì?",
      answer:
        "Otter Beer là thương hiệu bia thủ công đến từ Tây Ninh, được phát triển với định hướng kết hợp kỹ thuật nấu bia truyền thống với công nghệ hiện đại. Otter Beer tập trung vào việc tạo ra những dòng bia có cá tính riêng, gắn với câu chuyện, văn hóa và hương vị của vùng đất Tây Ninh.",
    },
    {
      question: "Mua bia Otter Beer ở đâu?",
      answer:
        "Khách hàng có thể liên hệ trực tiếp Otter Beer để đặt hàng và giao tận nơi. Website hiện công bố hotline 0981 6864 91 để mua hàng trực tiếp.",
    },
    {
      question: "Nồng độ cồn (ABV) của Otter Beer là bao nhiêu?",
      answer:
        "Otter Premium Lager : 4,3 ± 0,5% ABV , còn dòng Thanh Xuân IPA Hazy ở mức 6 ± 2%.",
    },
    {
      question: "Otter Beer khác gì so với bia công nghiệp?",
      answer:
        "Otter beer được phát triển theo định hướng bia thủ công, chú trọng vào công thức, nguyên liệu và đặc trưng hương vị của từng dòng bia. So với các dòng bia công nghiệp đại trà, bia thủ công thường có sự đa dạng hơn về phong cách, hương thơm và trải nghiệm vị giác. Với Otter Beer, mỗi dòng bia được xây dựng với câu chuyện và cá tính riêng, lấy cảm hứng từ Tây Ninh và văn hóa địa phương.",
    },
    {
      question: "Otter Beer có nhận đặt bia cho sự kiện và phân phối sỉ không?",
      answer:
        "Có. Otter Beer nhận đơn hàng cho tiệc, sự kiện, gala, hội nghị, hoạt động doanh nghiệp và các chương trình thương hiệu. Đồng thời, chúng tôi có chính sách dành cho khách hàng sỉ, đại lý, nhà hàng, quán bar và đối tác phân phối. Vui lòng liên hệ Otter Beer để được tư vấn sản phẩm, số lượng và chính sách dành cho từng nhu cầu.",
    },
  ],
  en: [
    {
      question: "What is Otter Beer?",
      answer:
        "Otter Beer is a craft beer brand from Tay Ninh, developed with a focus on combining traditional brewing techniques with modern technology. Otter Beer focuses on creating beers with their own distinct character, tied to the story, culture, and flavors of the Tay Ninh region.",
    },
    {
      question: "Where can I buy Otter Beer?",
      answer:
        "Customers can contact Otter Beer directly to order for delivery. The website currently lists the hotline 0981 6864 91 for direct purchases.",
    },
    {
      question: "What is the ABV of Otter Beer?",
      answer:
        "Otter Premium Lager: 4.3 ± 0.5% ABV, while the Thanh Xuan IPA Hazy is at 6 ± 2% ABV.",
    },
    {
      question: "How is Otter Beer different from mass-produced beer?",
      answer:
        "Otter beer is developed as a craft beer, focusing on the recipe, ingredients, and flavor characteristics of each beer line. Compared to mass-produced commercial beers, craft beer typically offers more variety in style, aroma, and taste experience. With Otter Beer, each line is built with its own story and personality, inspired by Tay Ninh and local culture.",
    },
    {
      question: "Does Otter Beer supply events and wholesale orders?",
      answer:
        "Yes. Otter Beer accepts orders for parties, events, galas, conferences, corporate activities, and brand programs. We also have policies for wholesale customers, agents, restaurants, bars, and distribution partners. Please contact Otter Beer for advice on products, quantities, and policies for your specific needs.",
    },
  ],
} as const;

/** Falls back to English for any locale we do not have FAQ copy for. */
export function faqFor(locale: string): readonly FaqEntry[] {
  return FAQ[locale as keyof typeof FAQ] ?? FAQ.en;
}
