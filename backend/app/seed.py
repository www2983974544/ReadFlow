"""First-run seeding: the 6 preset articles, in legacy array order.

The 3 EXTRA_CRAWL_POOL articles live in seed_articles.json too but are NOT
seeded — the legacy "实时爬取" button injects them at runtime (P3 ports that).
"""
import json
from pathlib import Path

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import Article

SEED_PATH = Path(__file__).with_name("seed_articles.json")


def _make_article(raw: dict, kind: str, seq: int) -> Article:
    cs = raw.get("complexSentence")
    return Article(
        id=raw["id"],
        seq=seq,
        title=raw.get("title", ""),
        title_cn=raw.get("titleCn", ""),
        source=raw.get("source", ""),
        source_url=raw.get("sourceUrl", ""),
        category=raw.get("category", ""),
        exam_level=raw.get("examLevel", ""),
        lexile=raw.get("lexile", ""),
        cet_ratio=raw.get("cetRatio", ""),
        exam_freq_tag=raw.get("examFreqTag", ""),
        in_library=bool(raw.get("inLibrary", False)),
        read_status=raw.get("readStatus", "unread"),
        kind=kind,
        paragraphs_json=json.dumps(raw.get("paragraphs", []), ensure_ascii=False),
        complex_sentence_json=json.dumps(cs, ensure_ascii=False) if cs else None,
        quiz_json=json.dumps(raw.get("quiz", []), ensure_ascii=False),
    )


def seed_if_empty(db: Session) -> None:
    if db.query(func.count(Article.id)).scalar() > 0:
        return
    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    for seq, raw in enumerate(data.get("initial", [])):
        db.add(_make_article(raw, kind="preset", seq=seq))
    db.commit()
