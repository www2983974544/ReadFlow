"""Extract seed articles and the offline dictionary from the legacy single-file
HTML into JSON assets for the new project:
  - backend/app/seed_articles.json  (DB seed: 6 initial + 3 extra crawl-pool articles)
  - frontend/src/data/cet_dictionary.json (943-entry offline dictionary for the frontend bundle)

Usage: .venv/Scripts/python scripts/extract_legacy_assets.py [legacy_html_path]
"""
import json
import sys
from pathlib import Path

import json5

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LEGACY = Path(r"d:\Users\wzc\Desktop\ReadFlow_windows\cet_reading_master.html")

PAIRS = {"[": "]", "{": "}", "(": ")"}


def find_matching(text: str, open_idx: int) -> int:
    """Index of the bracket matching text[open_idx], skipping JS strings/comments."""
    close = PAIRS[text[open_idx]]
    depth = 0
    quote = None
    i = open_idx
    n = len(text)
    while i < n:
        c = text[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "/" and i + 1 < n and text[i + 1] == "/":
            i = text.find("\n", i)
            if i == -1:
                break
        elif c in "[{(":
            depth += 1
        elif c in "]})":
            depth -= 1
            if depth == 0 and c == close:
                return i
        i += 1
    raise ValueError(f"no matching {close} for index {open_idx}")


def extract_literal(text: str, decl: str, open_char: str):
    """Extract the JS object/array literal declared by `decl` (e.g. 'const FOO = ')."""
    start = text.index(decl) + len(decl)
    while text[start] in " \n":
        start += 1
    assert text[start] == open_char, f"{decl!r}: expected {open_char!r}, got {text[start]!r}"
    end = find_matching(text, start)
    literal = text[start : end + 1]
    try:
        return json.loads(literal)
    except json.JSONDecodeError:
        return json5.loads(literal)


def main() -> None:
    html_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_LEGACY
    text = html_path.read_text(encoding="utf-8")

    initial = extract_literal(text, "const INITIAL_ARTICLES = ", "[")
    extra = extract_literal(text, "const EXTRA_CRAWL_POOL = ", "[")
    dictionary = extract_literal(text, "const OXFORD_CET_RAW = ", "{")

    seed_path = ROOT / "backend" / "app" / "seed_articles.json"
    seed_path.write_text(
        json.dumps({"initial": initial, "extra": extra}, ensure_ascii=False, indent=1),
        encoding="utf-8",
    )

    dict_path = ROOT / "frontend" / "src" / "data" / "cet_dictionary.json"
    dict_path.parent.mkdir(parents=True, exist_ok=True)
    dict_path.write_text(
        json.dumps(dictionary, ensure_ascii=False), encoding="utf-8"
    )

    sample_id = initial[0]["id"]
    sample_word = next(iter(dictionary))
    print(f"articles: initial={len(initial)} extra={len(extra)} -> {seed_path}")
    print(f"dictionary: {len(dictionary)} entries -> {dict_path}")
    print(f"sample article: {sample_id} | sample word: {sample_word!r} -> {dictionary[sample_word][:2]}")


if __name__ == "__main__":
    main()
