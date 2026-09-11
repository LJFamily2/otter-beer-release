import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database
  MONGODB_URI: z.string().url(),

  // Auth.js (Google OAuth only)
  AUTH_SECRET: z.string().min(32),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),

  // Bootstraps the first superAdmin the first time this email signs in,
  // since the user allowlist starts empty. Safe to unset after first login.
  FIRST_SUPER_ADMIN_EMAIL: z.string().email().optional(),

  // Cloudinary (image storage — see src/lib/storage/CloudinaryStorageProvider.ts)
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1),


  /**
   * Public origin of the site, e.g. https://otterbeer.vn — no trailing slash.
   *
   * Every canonical URL, hreflang alternate, sitemap entry, OpenGraph image
   * and schema.org `@id` is built from this (see src/lib/seo.ts), so a
   * production deploy that leaves it at the localhost default publishes a
   * whole site of canonicals pointing at localhost. `assertProductionSiteUrl`
   * below refuses to let that happen quietly.
   */
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),

  /**
   * Google Analytics 4 Measurement ID (e.g. G-XXXXXXXXXX).
   * Optional — if unset, Google Analytics tracking scripts will not be loaded.
   */
  NEXT_PUBLIC_GA_ID: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function loadEnv(): Env {
  const envData = { ...process.env };
  const isTestingOrCI =
    process.env.CI === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development";

  if (isTestingOrCI) {
    envData.MONGODB_URI = isValidUrl(envData.MONGODB_URI)
      ? envData.MONGODB_URI
      : "mongodb://localhost:27017/otter-beer";
    envData.AUTH_SECRET =
      envData.AUTH_SECRET && envData.AUTH_SECRET.length >= 32
        ? envData.AUTH_SECRET
        : "ci-dummy-auth-secret-32-characters-minimum!!";
    envData.AUTH_GOOGLE_ID = envData.AUTH_GOOGLE_ID || "ci-dummy-google-id";
    envData.AUTH_GOOGLE_SECRET = envData.AUTH_GOOGLE_SECRET || "ci-dummy-google-secret";
    envData.CLOUDINARY_CLOUD_NAME = envData.CLOUDINARY_CLOUD_NAME || "ci-dummy-cloudinary-cloud-name";
    envData.CLOUDINARY_API_KEY = envData.CLOUDINARY_API_KEY || "ci-dummy-cloudinary-api-key";
    envData.CLOUDINARY_API_SECRET = envData.CLOUDINARY_API_SECRET || "ci-dummy-cloudinary-api-secret";
    envData.CLOUDINARY_UPLOAD_PRESET = envData.CLOUDINARY_UPLOAD_PRESET || "ci-dummy-cloudinary-upload-preset";
  }

  const parsed = envSchema.safeParse(envData);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  assertProductionSiteUrl(parsed.data);
  return parsed.data;
}

/**
 * A localhost NEXT_PUBLIC_SITE_URL in production is silently catastrophic
 * rather than loudly broken: the site renders fine, and every canonical tag,
 * hreflang alternate, sitemap <loc> and JSON-LD @id it serves to Google points
 * at http://localhost:3000. Fail the boot instead.
 */
function assertProductionSiteUrl(parsedEnv: Env): void {
  if (parsedEnv.NODE_ENV !== "production") return;
  if (process.env.CI === "true") return;

  const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(
    parsedEnv.NEXT_PUBLIC_SITE_URL
  );
  if (!isLocalhost) return;

  throw new Error(
    "NEXT_PUBLIC_SITE_URL is still the localhost default in production. " +
      "Set it to the public origin (e.g. https://otterbeer.vn) — every " +
      "canonical URL, hreflang, sitemap entry and JSON-LD @id is built from it."
  );
}


let cached: Env | undefined;

/** Lazily validated so importing this module never throws at build time. */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: keyof Env) {
    if (!cached) cached = loadEnv();
    return cached[prop];
  },
});
