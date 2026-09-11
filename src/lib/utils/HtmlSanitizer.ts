const ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "strong",
  "em",
  "u",
  "s",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "code",
  "pre",
  "img",
  "br",
  "span",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

const ALLOWED_ATTR = ["href", "src", "alt", "title", "class", "target", "rel"];

/**
 * Every WYSIWYG `content` field is sanitized here before it ever reaches
 * MongoDB — required by docs/security.md since the marketing site renders
 * this HTML with `dangerouslySetInnerHTML`.
 */
export class HtmlSanitizer {
  static sanitize(html: string): string {
    // Lazy require isomorphic-dompurify so importing HtmlSanitizer at top-level
    // doesn't force jsdom evaluation during build time or sitemap generation.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("isomorphic-dompurify");
    const instance = DOMPurify.default ?? DOMPurify;
    return instance.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR });
  }
}
