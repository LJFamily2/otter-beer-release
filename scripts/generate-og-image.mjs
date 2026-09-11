/**
 * Generates the 1200x630 social share card at public/images/otter-beer-og.png.
 *
 * Why this exists rather than a committed binary someone hand-exported:
 * the site metadata declares `width: 1200, height: 630` on every OpenGraph
 * and Twitter card. The source art (otter-beer-hero.png) is 1024x1024, so
 * that declaration was a lie — Facebook, X and Zalo all crop or reject a
 * square image served with 1.91:1 dimensions. Regenerating from source keeps
 * the asset and the declared dimensions provably in sync.
 *
 * Pure Node (zlib only) on purpose: adding `sharp` to devDependencies for one
 * build-time asset would pull a native binary into CI for no other reason.
 *
 * Run:  node scripts/generate-og-image.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";
import { join } from "node:path";

const SOURCE = join(process.cwd(), "public/images/otter-beer-hero.png");
const TARGET = join(process.cwd(), "public/images/otter-beer-og.png");

/** Card size mandated by the OpenGraph metadata in src/lib/seo.ts. */
const OUT_W = 1200;
const OUT_H = 630;

/** Brand navy — matches `themeColor` in src/app/layout.tsx. */
const BG = [0x00, 0x28, 0x67];

// ─── PNG decode (8-bit RGBA, non-interlaced) ────────────────────────────

function decodePng(buf) {
  if (buf.slice(1, 4).toString() !== "PNG") throw new Error("not a PNG");
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`expected 8-bit RGBA, got depth ${bitDepth} type ${colorType}`);
  }

  const idat = [];
  let off = 8;
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.slice(off + 4, off + 8).toString();
    if (type === "IDAT") idat.push(buf.slice(off + 8, off + 8 + len));
    if (type === "IEND") break;
    off += 12 + len;
  }

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = width * bpp;
  const out = Buffer.alloc(height * stride);

  // Undo the per-scanline filters (PNG spec 9.2). Each row is prefixed with
  // one filter-type byte; reconstruction is in-place against the row above.
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = prev && i >= bpp ? prev[i - bpp] : 0;
      let v = src[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[i] = v & 0xff;
    }
  }
  return { width, height, data: out };
}

// ─── Bilinear resample ──────────────────────────────────────────────────

function resize(img, dstW, dstH) {
  const out = Buffer.alloc(dstW * dstH * 4);
  const xRatio = img.width / dstW;
  const yRatio = img.height / dstH;

  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(img.height - 1, (y + 0.5) * yRatio - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(img.height - 1, y0 + 1);
    const wy = sy - y0;

    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(img.width - 1, (x + 0.5) * xRatio - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(img.width - 1, x0 + 1);
      const wx = sx - x0;

      for (let c = 0; c < 4; c++) {
        const p00 = img.data[(y0 * img.width + x0) * 4 + c];
        const p01 = img.data[(y0 * img.width + x1) * 4 + c];
        const p10 = img.data[(y1 * img.width + x0) * 4 + c];
        const p11 = img.data[(y1 * img.width + x1) * 4 + c];
        const top = p00 + (p01 - p00) * wx;
        const bot = p10 + (p11 - p10) * wx;
        out[(y * dstW + x) * 4 + c] = Math.round(top + (bot - top) * wy);
      }
    }
  }
  return { width: dstW, height: dstH, data: out };
}

// ─── PNG encode (8-bit RGB, filter 0) ───────────────────────────────────

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * Per-scanline adaptive filtering using the PNG spec's minimum-sum-of-
 * absolute-differences heuristic. Filter 0 everywhere is correct but
 * compresses photographic gradients badly — this is what takes the card from
 * ~930KB to something a scraper fetches without complaint.
 */
function filterScanlines(width, height, rgb) {
  const bpp = 3;
  const stride = width * bpp;
  const out = Buffer.alloc(height * (stride + 1));
  const candidate = Buffer.alloc(stride);
  const best = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const cur = rgb.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? rgb.subarray((y - 1) * stride, y * stride) : null;
    let bestType = 0;
    let bestScore = Infinity;

    for (let type = 0; type <= 4; type++) {
      let score = 0;
      for (let i = 0; i < stride; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const b = prev ? prev[i] : 0;
        const c = prev && i >= bpp ? prev[i - bpp] : 0;
        let v;
        if (type === 0) v = cur[i];
        else if (type === 1) v = cur[i] - a;
        else if (type === 2) v = cur[i] - b;
        else if (type === 3) v = cur[i] - ((a + b) >> 1);
        else {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          v = cur[i] - (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
        }
        v &= 0xff;
        candidate[i] = v;
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        bestType = type;
        candidate.copy(best);
      }
    }

    out[y * (stride + 1)] = bestType;
    best.copy(out, y * (stride + 1) + 1);
  }
  return out;
}

function encodePng(width, height, rgb) {
  const raw = filterScanlines(width, height, rgb);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Compose ────────────────────────────────────────────────────────────

const source = decodePng(readFileSync(SOURCE));

// "contain", not "cover": the source is a centred product shot, and cropping
// a 1:1 can down to 1.91:1 decapitates it. Fitting it whole onto a brand-navy
// field is what a share card is supposed to look like anyway.
const scale = Math.min(OUT_W / source.width, OUT_H / source.height);
const fitW = Math.round(source.width * scale);
const fitH = Math.round(source.height * scale);
const fitted = resize(source, fitW, fitH);

const offsetX = Math.floor((OUT_W - fitW) / 2);
const offsetY = Math.floor((OUT_H - fitH) / 2);

const canvas = Buffer.alloc(OUT_W * OUT_H * 3);
for (let i = 0; i < OUT_W * OUT_H; i++) {
  canvas[i * 3] = BG[0];
  canvas[i * 3 + 1] = BG[1];
  canvas[i * 3 + 2] = BG[2];
}

// Alpha-composite the fitted art over the navy field.
for (let y = 0; y < fitH; y++) {
  for (let x = 0; x < fitW; x++) {
    const s = (y * fitW + x) * 4;
    const alpha = fitted.data[s + 3] / 255;
    if (alpha === 0) continue;
    const d = ((y + offsetY) * OUT_W + (x + offsetX)) * 3;
    for (let c = 0; c < 3; c++) {
      canvas[d + c] = Math.round(fitted.data[s + c] * alpha + canvas[d + c] * (1 - alpha));
    }
  }
}

const png = encodePng(OUT_W, OUT_H, canvas);
writeFileSync(TARGET, png);
console.log(
  `Wrote ${TARGET} — ${OUT_W}x${OUT_H}, ${(png.length / 1024).toFixed(0)}KB`
);
