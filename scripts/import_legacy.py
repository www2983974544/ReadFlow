"""Import legacy ReadFlow exports into the new SQLite database.

Supported sources (produced by the legacy UI):
  - ReadFlow_Library_Backup.json   (array of article objects, inLibrary ones)
  - ReadFlow_Vocabulary_Export.csv (BOM UTF-8 CSV, 9 columns)

Usage:
  .venv/Scripts/python scripts/import_legacy.py --library "ReadFlow_Library_Backup.json" \
      [--vocab "ReadFlow_Vocabulary_Export.csv"]
"""
import argparse
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from sqlalchemy import func  # noqa: E402

from backend.app.db import SessionLocal, init_db  # noqa: E402
from backend.app.models import Article, VocabMark  # noqa: E402
from backend.app.seed import _make_article  # noqa: E402

VALID_STATUSES = {"unknown", "core", "mastered"}


def import_library(path: Path, db) -> tuple[int, int]:
    articles = json.loads(path.read_text(encoding="utf-8"))
    added = skipped = 0
    for raw in articles:
        if db.get(Article, raw["id"]) is not None:
            skipped += 1
            continue
        seq = (db.query(func.max(Article.seq)).scalar() or -1) + 1
        db.add(_make_article(raw, kind="custom", seq=seq))
        added += 1
    db.commit()
    return added, skipped


def import_vocab(path: Path, db) -> tuple[int, int]:
    added = skipped = 0
    with path.open(encoding="utf-8-sig", newline="") as f:
        reader = csv.reader(f)
        next(reader, None)  # header row
        for row in reader:
            if not row or len(row) < 9:
                continue
            word, lemma, phonetic, status, cn, derivatives, synonyms, custom_note, article_title = row
            if not lemma:
                continue
            if db.get(VocabMark, lemma) is not None:
                skipped += 1
                continue
            db.add(
                VocabMark(
                    lemma=lemma,
                    word=word or lemma,
                    status=status if status in VALID_STATUSES else "core",
                    custom_note=custom_note,
                    cn=cn,
                    phonetic=phonetic,
                    derivatives=derivatives,
                    synonyms=synonyms,
                    article_title=article_title,
                )
            )
            added += 1
    db.commit()
    return added, skipped


def main() -> None:
    parser = argparse.ArgumentParser(description="Import legacy ReadFlow exports.")
    parser.add_argument("--library", type=Path, help="ReadFlow_Library_Backup.json")
    parser.add_argument("--vocab", type=Path, help="ReadFlow_Vocabulary_Export.csv")
    args = parser.parse_args()
    if not args.library and not args.vocab:
        parser.error("provide --library and/or --vocab")

    init_db()
    db = SessionLocal()
    try:
        if args.library:
            added, skipped = import_library(args.library, db)
            print(f"library: +{added} articles ({skipped} already present)")
        if args.vocab:
            added, skipped = import_vocab(args.vocab, db)
            print(f"vocab: +{added} marks ({skipped} already present)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
