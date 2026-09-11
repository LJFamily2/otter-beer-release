"""
process_logo.py
---------------
Converts the new Otter Beer logo into every required public asset:

  public/images/header/logo.png          -- transparent, full logo (header)
  public/images/otter-beer-logo-yellow-bg.png  -- transparent, full logo (schema.org)
  public/images/otter-beer-og.png        -- 1200x630, full logo centred on navy
  public/icon.png                        -- 512x512, otter head on navy (PWA / browser icon)
  public/apple-icon.png                  -- 180x180, otter head on navy
  public/apple-touch-icon.png            -- 180x180, otter head on navy
  public/favicon-32x32.png              -- 32x32
  public/favicon-16x16.png              -- 16x16
  public/favicon.ico                     -- multi-size ICO (16, 32, 48)

Usage:
  python scripts/process_logo.py
"""

from pathlib import Path
from PIL import Image

# -- Paths --------------------------------------------------------------------
ROOT        = Path(__file__).parent.parent
SRC         = Path(r"C:\Users\QuangLeeL\Downloads\full logo fill white face (1).png")
PUB         = ROOT / "public"
IMAGES      = PUB / "images"
HEADER_DIR  = IMAGES / "header"

NAVY        = (0, 32, 96, 255)   # #002060
WHITE_THRESH = 240                # pixels this bright are considered background

# -- Helper: remove white background ------------------------------------------
def remove_white_bg(img: Image.Image, threshold: int = WHITE_THRESH) -> Image.Image:
    """Replace near-white pixels with transparency."""
    img = img.convert("RGBA")
    data = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = data[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                data[x, y] = (r, g, b, 0)
    return img


# -- Helper: crop to otter head (top ~60 % of the image, no wordmark) ---------
def crop_head(img: Image.Image) -> Image.Image:
    """Return the top portion of the logo -- otter head + crown only."""
    w, h = img.size
    # The wordmark occupies roughly the bottom 42 % of the square canvas.
    # Crop to the top 60 % to keep the full head with a little breathing room.
    return img.crop((0, 0, w, int(h * 0.60)))


# -- Helper: composite onto a solid-colour canvas -----------------------------
def on_canvas(
    fg: Image.Image,
    canvas_w: int,
    canvas_h: int,
    bg_rgba: tuple = NAVY,
    pad_fraction: float = 0.10,
) -> Image.Image:
    """Centre `fg` (RGBA) on a solid `bg_rgba` canvas with optional padding."""
    canvas = Image.new("RGBA", (canvas_w, canvas_h), bg_rgba)
    pad_x = int(canvas_w * pad_fraction)
    pad_y = int(canvas_h * pad_fraction)
    max_w  = canvas_w - pad_x * 2
    max_h  = canvas_h - pad_y * 2

    fg_copy = fg.copy()
    fg_copy.thumbnail((max_w, max_h), Image.LANCZOS)
    fw, fh = fg_copy.size
    ox = (canvas_w - fw) // 2
    oy = (canvas_h - fh) // 2
    canvas.paste(fg_copy, (ox, oy), fg_copy)
    return canvas


# -- Helper: save as PNG ------------------------------------------------------
def save_png(img: Image.Image, dest: Path, size: tuple | None = None) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    out = img.copy()
    if size:
        out = out.resize(size, Image.LANCZOS)
    out.save(dest, format="PNG", optimize=True)
    print("  [OK]  " + str(dest.relative_to(ROOT)) + "  " + str(out.size))


# -- Helper: build ICO from multiple sizes ------------------------------------
def save_ico(img: Image.Image, dest: Path, sizes: list = [16, 32, 48]) -> None:
    """Save a proper multi-size .ico from a square RGBA image."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    frames = []
    for s in sizes:
        frame = img.resize((s, s), Image.LANCZOS).convert("RGBA")
        frames.append(frame)
    frames[0].save(
        dest,
        format="ICO",
        sizes=[(s, s) for s in sizes],
        append_images=frames[1:],
    )
    print("  [OK]  " + str(dest.relative_to(ROOT)) + "  sizes=" + str(sizes))


# -- Main ---------------------------------------------------------------------
def main():
    print("\nSource: " + str(SRC))
    if not SRC.exists():
        raise FileNotFoundError("Source logo not found at: " + str(SRC))

    src = Image.open(SRC).convert("RGBA")
    print("Loaded source: " + str(src.size))

    print("\n-- Removing white background --")
    full_transparent = remove_white_bg(src)

    # 1. Header logo -- transparent full logo
    print("\n-- Header & schema.org logos --")
    save_png(full_transparent, HEADER_DIR / "logo.png")
    save_png(full_transparent, IMAGES / "otter-beer-logo-yellow-bg.png")

    # 2. OG image -- full logo centred on navy 1200x630
    print("\n-- Open Graph image (1200x630) --")
    og = on_canvas(full_transparent, 1200, 630, bg_rgba=NAVY, pad_fraction=0.10)
    save_png(og.convert("RGB"), IMAGES / "otter-beer-og.png")

    # 3. Head-only crop for icons
    print("\n-- Icon assets (otter head only) --")
    head_transparent = crop_head(full_transparent)

    # Square icon on navy
    icon_base = on_canvas(head_transparent, 512, 512, bg_rgba=NAVY, pad_fraction=0.08)

    save_png(icon_base, PUB / "icon.png")
    save_png(icon_base, PUB / "apple-icon.png", size=(180, 180))
    save_png(icon_base, PUB / "apple-touch-icon.png", size=(180, 180))
    save_png(icon_base, PUB / "favicon-32x32.png", size=(32, 32))
    save_png(icon_base, PUB / "favicon-16x16.png", size=(16, 16))

    print("\n-- favicon.ico (16, 32, 48) --")
    save_ico(icon_base, PUB / "favicon.ico", sizes=[16, 32, 48])

    print("\nDone. All logo assets generated successfully.\n")


if __name__ == "__main__":
    main()
