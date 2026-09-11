// Unicode combining diacritical marks block (U+0300-U+036F). After NFD
// normalization, accented Latin letters split into base + one of these
// marks, so stripping this range converts e.g. "a" + acute into plain "a".
const COMBINING_MARKS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

// Vietnamese "đ"/"Đ" has no Unicode decomposition, so the NFD + combining-
// mark strip above (which handles á, ư, etc.) misses it —
// replace it explicitly before normalizing.
const DJ_MAP: Record<string, string> = { đ: "d", Đ: "D" };

export class SlugGenerator {
  static generate(input: string): string {
    const withoutDj = input.replace(/[đĐ]/g, (ch) => DJ_MAP[ch]);
    return withoutDj
      .normalize("NFD")
      .replace(COMBINING_MARKS_REGEX, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Appends -2, -3, ... until `isTaken` reports the candidate is free.
   * Used when a translation is saved without an explicit slug.
   */
  static async generateUnique(
    input: string,
    isTaken: (candidate: string) => Promise<boolean>
  ): Promise<string> {
    const base = SlugGenerator.generate(input) || "bai-viet";
    let candidate = base;
    let suffix = 2;
    while (await isTaken(candidate)) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }
}
