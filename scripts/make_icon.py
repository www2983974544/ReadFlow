"""Generate the ReadFlow application icon: indigo rounded square with a white
open-book glyph (matching the in-app brand logo). Produces ReadFlow.ico.

Usage: .venv/Scripts/python scripts/make_icon.py
"""
import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SIZE = 256
VERSION = re.search(
    r"APP_VERSION = 'v([\d.]+)'",
    (ROOT / "frontend/src/version.ts").read_text(encoding="utf-8"),
).group(1)


def build_icon() -> Image.Image:
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Indigo rounded square (brand #4f46e5)
    d.rounded_rectangle([10, 10, SIZE - 10, SIZE - 10], radius=58, fill=(79, 70, 229, 255))

    # White open-book glyph (mirrors the header SVG): spine + two page halves
    cx = SIZE // 2
    top, bottom = 66, 190
    spread = 74
    lift = 16
    white = (255, 255, 255, 255)

    d.line([(cx, top + lift - 8), (cx, bottom - 6)], fill=white, width=10)

    # left page
    d.polygon(
        [(cx - 6, top + lift), (cx - spread, top - 6), (cx - spread, bottom - 24), (cx - 6, bottom)],
        fill=white,
    )
    # right page
    d.polygon(
        [(cx + 6, top + lift), (cx + spread, top - 6), (cx + spread, bottom - 24), (cx + 6, bottom)],
        fill=white,
    )

    # indigo page separators to suggest text lines
    ink = (79, 70, 229, 255)
    for i, y in enumerate((96, 122, 148)):
        inset = 14
        d.line([(cx - spread + inset, y), (cx - 14, y + 4)], fill=ink, width=8)
        d.line([(cx + 14, y + 4), (cx + spread - inset, y)], fill=ink, width=8)

    # version badge in the lower-right corner; text follows frontend/src/version.ts
    badge = [164, 194, 246, 240]
    d.rounded_rectangle(badge, radius=12, fill=(251, 191, 36, 255))
    font = ImageFont.load_default(size=30)
    d.text(
        ((badge[0] + badge[2]) / 2, (badge[1] + badge[3]) / 2),
        VERSION,
        font=font,
        fill=(41, 37, 36, 255),
        anchor="mm",
    )

    return img


def main() -> None:
    img = build_icon()
    out = ROOT / "ReadFlow.ico"
    img.save(
        out,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    png = ROOT / "ReadFlow_icon_preview.png"
    img.save(png)
    print(f"icon -> {out} ({out.stat().st_size} bytes), preview -> {png}")


if __name__ == "__main__":
    main()
