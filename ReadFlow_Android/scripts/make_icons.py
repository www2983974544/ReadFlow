"""Generate ReadFlow launcher icons (indigo background, white open-book glyph).

Writes legacy mipmaps + adaptive foreground PNGs into the Capacitor android
project, and sets the adaptive background color resource.
"""
import os
from PIL import Image, ImageDraw

RES = os.path.join(os.path.dirname(__file__), "..", "android", "app", "src", "main", "res")

INDIGO = (79, 70, 229, 255)          # #4f46e5
INDIGO_DARK = (67, 56, 202, 255)     # subtle bottom shade
WHITE = (255, 255, 255, 255)

SIZES = {  # legacy square icons
    "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192,
}
FOREGROUND_SIZES = {  # adaptive foreground (108dp box)
    "mipmap-mdpi": 108, "mipmap-hdpi": 162, "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324, "mipmap-xxxhdpi": 432,
}


def draw_book(draw, s, color):
    """Draw a simple open-book glyph centered in an s x s box."""
    cx, cy = s / 2, s * 0.52
    w = s * 0.60            # total width of the open book
    h = s * 0.38            # page height
    spine = s * 0.035       # gap at the spine
    tilt = s * 0.06         # outer edge lift

    # Left page
    draw.polygon([
        (cx - spine, cy - h * 0.30),
        (cx - w / 2, cy - h * 0.42),
        (cx - w / 2, cy + h * 0.58),
        (cx - spine, cy + h * 0.70),
    ], fill=color)
    # Right page
    draw.polygon([
        (cx + spine, cy - h * 0.30),
        (cx + w / 2, cy - h * 0.42),
        (cx + w / 2, cy + h * 0.58),
        (cx + spine, cy + h * 0.70),
    ], fill=color)
    # Spine
    draw.line([(cx, cy - h * 0.28), (cx, cy + h * 0.72)], fill=color, width=max(2, int(s * 0.02)))
    # Text lines on pages
    line_color = (79, 70, 229, 255) if color == WHITE else WHITE
    for i in range(3):
        ly = cy - h * 0.05 + i * h * 0.28
        x_off = s * 0.055
        draw.line([(cx - w / 2 + x_off, ly), (cx - spine - x_off, ly + tilt * 0.4)], fill=line_color, width=max(1, int(s * 0.012)))
        draw.line([(cx + spine + x_off, ly + tilt * 0.4), (cx + w / 2 - x_off, ly)], fill=line_color, width=max(1, int(s * 0.012)))


def make_legacy(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(size * 0.22)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=INDIGO)
    draw_book(d, size, WHITE)
    return img


def make_foreground(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_book(d, size, WHITE)
    return img


for folder, size in SIZES.items():
    out = os.path.join(RES, folder)
    os.makedirs(out, exist_ok=True)
    make_legacy(size).save(os.path.join(out, "ic_launcher.png"))
    make_legacy(size).save(os.path.join(out, "ic_launcher_round.png"))

for folder, size in FOREGROUND_SIZES.items():
    out = os.path.join(RES, folder)
    os.makedirs(out, exist_ok=True)
    make_foreground(size).save(os.path.join(out, "ic_launcher_foreground.png"))

# Adaptive icon background color
values = os.path.join(RES, "values")
os.makedirs(values, exist_ok=True)
with open(os.path.join(values, "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
    f.write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#4F46E5</color>\n</resources>\n')

print("icons generated")
