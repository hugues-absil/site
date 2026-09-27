"""Process HA monogram into clean favicon assets."""
from __future__ import annotations

import math
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

SRC = Path(
    r"C:\Users\louis\.cursor\projects\c-Users-louis-Desktop-Projet-Site-Hugues-Vite-React"
    r"\assets\c__Users_louis_AppData_Roaming_Cursor_User_workspaceStorage_"
    r"c2420aed6408b9ba2179bb6be1b70cc9_images_Favicon-HA-0d2d4732-26f7-4fa2-b68b-1b7dfc34e8b0.png"
)
OUT = Path(__file__).resolve().parents[1] / "public"


def extract_ink(im: Image.Image) -> Image.Image:
    """Keep dark strokes; turn near-white into transparency."""
    w, h = im.size
    pixels = im.load()
    ink = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ink_px = ink.load()
    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            darkness = max(0, min(255, int(255 - lum)))
            if darkness < 18:
                continue
            alpha = min(255, int(darkness * 1.15))
            ink_px[x, y] = (20, 20, 20, alpha)
    return ink


def ink_bounds(ink: Image.Image) -> tuple[float, float, float]:
    ink_px = ink.load()
    w, h = ink.size
    xs: list[int] = []
    ys: list[int] = []
    for y in range(h):
        for x in range(w):
            if ink_px[x, y][3] > 40:
                xs.append(x)
                ys.append(y)
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    cx = (min_x + max_x) / 2
    cy = (min_y + max_y) / 2
    radius = max(max_x - cx, cx - min_x, max_y - cy, cy - min_y)
    return cx, cy, radius


def build_favicon(ink: Image.Image, cx: float, cy: float, radius: float) -> Image.Image:
    pad = 8
    size = int(math.ceil(radius * 2 + pad * 2))
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = int(round(size / 2 - cx))
    oy = int(round(size / 2 - cy))

    # Off-white disc: keeps black monogram readable on dark browser tabs
    disc = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(disc)
    inner_r = radius - 2
    draw.ellipse(
        [size / 2 - inner_r, size / 2 - inner_r, size / 2 + inner_r, size / 2 + inner_r],
        fill=(250, 250, 248, 255),
    )
    canvas = Image.alpha_composite(canvas, disc)
    canvas.paste(ink, (ox, oy), ink)
    return canvas.filter(ImageFilter.UnsharpMask(radius=1.2, percent=80, threshold=2))


def save_assets(master: Image.Image) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    master = master.resize((512, 512), Image.Resampling.LANCZOS)

    master.save(OUT / "favicon.png", "PNG", optimize=True)
    master.resize((32, 32), Image.Resampling.LANCZOS).save(
        OUT / "favicon-32x32.png", "PNG", optimize=True
    )
    master.resize((180, 180), Image.Resampling.LANCZOS).save(
        OUT / "apple-touch-icon.png", "PNG", optimize=True
    )

    ico16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    ico32 = master.resize((32, 32), Image.Resampling.LANCZOS)
    ico48 = master.resize((48, 48), Image.Resampling.LANCZOS)
    ico16.save(
        OUT / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[ico32, ico48],
    )

    # Temporary visual checks (deleted after review)
    for name, bg in (
        ("_favicon-preview-dark.jpg", (30, 30, 30, 255)),
        ("_favicon-preview-light.jpg", (240, 240, 240, 255)),
    ):
        base = Image.new("RGBA", (512, 512), bg)
        Image.alpha_composite(base, master).convert("RGB").save(
            OUT / name, quality=90
        )

    print("Wrote assets to", OUT)


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source missing: {SRC}")
    im = Image.open(SRC).convert("RGBA")
    ink = extract_ink(im)
    cx, cy, radius = ink_bounds(ink)
    canvas = build_favicon(ink, cx, cy, radius)
    save_assets(canvas)
    print(f"center=({cx:.1f},{cy:.1f}) radius={radius:.1f}")


if __name__ == "__main__":
    main()
