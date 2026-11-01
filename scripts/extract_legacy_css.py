"""Extract the legacy <style> block verbatim into frontend/src/style.css,
prepend the Tailwind directives (the build-time replacement of the Play CDN).

Usage: .venv/Scripts/python scripts/extract_legacy_css.py [legacy_html_path]
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LEGACY = Path(r"d:\Users\wzc\Desktop\ReadFlow_windows\cet_reading_master.html")

TAILWIND_DIRECTIVES = """@tailwind base;
@tailwind components;
@tailwind utilities;

"""


def main() -> None:
    html_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_LEGACY
    text = html_path.read_text(encoding="utf-8")

    start = text.index("<style>") + len("<style>")
    end = text.index("</style>", start)
    css = text[start:end].strip("\n")

    out = ROOT / "frontend" / "src" / "style.css"
    out.write_text(TAILWIND_DIRECTIVES + css + "\n", encoding="utf-8")
    print(f"css: {css.count(chr(10)) + 1} lines -> {out}")


if __name__ == "__main__":
    main()
