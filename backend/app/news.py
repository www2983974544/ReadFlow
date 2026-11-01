"""Real article fetching: RSS feeds (feedparser) + body extraction (trafilatura),
with the legacy Wikipedia-summary pipeline kept as the offline-safe fallback.

The "实时爬取" button behavior stays identical to the legacy UI: inject the
EXTRA_CRAWL_POOL articles, then add one freshly fetched article when online.
"""
import json
import random
import re
import time
from datetime import datetime
from pathlib import Path

import feedparser
import httpx
import trafilatura
from sqlalchemy.orm import Session

from .models import Article, CrawlSource

SEED_PATH = Path(__file__).with_name("seed_articles.json")

DEFAULT_SOURCES = [
    {"name": "The Guardian", "rss_url": "https://www.theguardian.com/world/rss", "category": "社会文化与健康"},
    {"name": "NPR", "rss_url": "https://feeds.npr.org/1001/rss.xml", "category": "社会文化与健康"},
    {"name": "Scientific American", "rss_url": "http://rss.sciam.com/sciam/basic-science", "category": "生态与气候环境"},
    {"name": "The Atlantic", "rss_url": "https://www.theatlantic.com/feed/all/", "category": "心理与教育认知"},
    {"name": "Nature", "rss_url": "https://www.nature.com/nature.rss", "category": "科技与人工智能"},
    {"name": "BBC Future", "rss_url": "http://feeds.bbci.co.uk/news/rss.xml", "category": "科技与人工智能"},
]

LIVE_TOPICS = [
    {"topic": "Renewable_energy", "category": "生态与气候环境", "level": "CET-4", "source": "Live Science Encyclopedia"},
    {"topic": "Artificial_neural_network", "category": "科技与人工智能", "level": "CET-6", "source": "Live Tech Feed"},
    {"topic": "Educational_psychology", "category": "心理与教育认知", "level": "CET-6", "source": "Live Academic Digest"},
]

CATEGORY_KEYWORDS = [
    ("科技与人工智能", ["ai", "artificial intelligence", "tech", "robot", "algorithm", "software", "computer", "digital", "cyber"]),
    ("生态与气候环境", ["climate", "energy", "carbon", "environment", "wildlife", "ocean", "emission", "solar"]),
    ("心理与教育认知", ["education", "school", "student", "psycholog", "brain", "learning", "memory", "health"]),
    ("经济与商业职场", ["econom", "market", "business", "job", "work", "trade", "inflation", "company"]),
    ("社会文化与健康", ["society", "culture", "city", "community", "public", "family", "food"]),
]


def classify_category(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    for category, keywords in CATEGORY_KEYWORDS:
        if any(k in text for k in keywords):
            return category
    return "科技与人工智能"


def _article_exists(db: Session, article_id: str) -> bool:
    return db.get(Article, article_id) is not None


def _next_front_seq(db: Session) -> int:
    min_seq = db.query(Article.seq).order_by(Article.seq.asc()).first()
    return (min_seq[0] if min_seq else 1) - 1


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


def inject_extra_pool(db: Session) -> list[Article]:
    """Legacy behavior: inject the EXTRA_CRAWL_POOL preset articles (front of list)."""
    added: list[Article] = []
    data = json.loads(SEED_PATH.read_text(encoding="utf-8"))
    for raw in data.get("extra", []):
        if _article_exists(db, raw["id"]):
            continue
        a = _make_article(raw, kind="extra", seq=_next_front_seq(db))
        db.add(a)
        added.append(a)
    db.commit()
    return added


def _split_into_paragraphs(text: str, target_words: int = 380) -> list[str]:
    blocks = [b.strip() for b in re.split(r"\n\s*\n", text) if b.strip()]
    paragraphs: list[str] = []
    total = 0
    for block in blocks:
        words = block.split()
        if len(words) > 120:
            # long extracted block: split into sentence groups of ~90 words
            sentences = re.split(r"(?<=[.!?])\s+", block)
            current: list[str] = []
            count = 0
            for sent in sentences:
                current.append(sent)
                count += len(sent.split())
                if count >= 90:
                    paragraphs.append(" ".join(current))
                    total += count
                    current, count = [], 0
            if current:
                paragraphs.append(" ".join(current))
                total += count
        else:
            paragraphs.append(block)
            total += len(words)
        if total >= target_words or len(paragraphs) >= 6:
            break
    return paragraphs


def _quiz_template(title: str) -> list[dict]:
    return [
        {
            "q": "1. What is the primary focus of this newly crawled passage?",
            "options": [
                "A) Introducing core concepts and research significance of " + title + ".",
                "B) Criticizing traditional agricultural irrigation methods.",
                "C) Promoting luxury consumer goods during inflation.",
                "D) Describing ancient architectural monuments.",
            ],
            "answer": 0,
            "explanation": "本文围绕 " + title + " 的核心概念与研究价值展开。",
        }
    ]


def _complex_sentence_template(first_sentence: str) -> dict:
    return {
        "sentence": first_sentence,
        "structure": "【实时爬取首句主干分析】点击句中任意单词即可在右侧查看牛津词典释义、派生词与同义词。",
        "tip": "首段首句往往是四六级说明文的中心议题所在。",
    }


def fetch_rss_article(db: Session) -> Article | None:
    """Fetch one fresh article from an enabled RSS source + body extraction.

    A wall-clock deadline (~20s) bounds the whole loop so a "half-broken"
    network (navigator.onLine true but hosts unreachable) cannot stall the
    crawl for minutes; the legacy Wikipedia fallback remains the safety net.
    """
    deadline = time.monotonic() + 12.0
    sources = db.query(CrawlSource).filter(CrawlSource.enabled.is_(True)).all()
    if not sources:
        return None
    random.shuffle(sources)

    for src in sources:
        if time.monotonic() > deadline:
            src.last_status = "deadline exceeded"
            db.commit()
            break
        try:
            with httpx.Client(timeout=10.0, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0 ReadFlow/2.0"}) as client:
                resp = client.get(src.rss_url)
            if resp.status_code != 200:
                src.last_status = f"HTTP {resp.status_code}"
                db.commit()
                continue
            feed = feedparser.parse(resp.text)
            entries = [e for e in feed.entries if getattr(e, "link", None) and getattr(e, "title", None)]
            if not entries:
                src.last_status = "empty feed"
                db.commit()
                continue

            entry = entries[0]
            title = entry.title
            link = entry.link
            summary = getattr(entry, "summary", "") or ""

            if time.monotonic() > deadline:
                src.last_status = "deadline exceeded"
                db.commit()
                break

            fetched_at = datetime.fromtimestamp(time.mktime(entry.published_parsed)) if getattr(entry, "published_parsed", None) else None
            if fetched_at:
                age_days = (datetime.now() - fetched_at).days
                if age_days > 60:
                    src.last_status = "stale entry"
                    db.commit()
                    continue

            with httpx.Client(timeout=8.0, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0 ReadFlow/2.0"}) as client:
                page = client.get(link)
            extracted = trafilatura.extract(page.text, include_comments=False, include_tables=False) if page.status_code == 200 else None
            paragraphs = _split_into_paragraphs(extracted or "")

            if len(paragraphs) < 2 or sum(len(p.split()) for p in paragraphs) < 120:
                src.last_status = "body too short"
                db.commit()
                continue

            category = classify_category(title, summary)
            body_text = " ".join(paragraphs)
            exam_level = "CET-6" if len(body_text.split()) > 330 else "CET-4"
            first_sentence = re.split(r"(?<=[.!?])\s+", paragraphs[0])[0]

            art = Article(
                id="art-live-" + str(int(time.time() * 1000)),
                seq=_next_front_seq(db),
                title=title,
                title_cn=title + "（实时在线爬取）",
                source=src.name,
                source_url=link,
                category=category,
                exam_level=exam_level,
                lexile="1090L",
                cet_ratio="18.0%",
                exam_freq_tag="⚡ 实时网络爬取 · 四六级同源科普",
                in_library=False,
                read_status="unread",
                kind="live",
                paragraphs_json=json.dumps(
                    [{"en": p, "cn": "（实时在线抓取段落）点击正文中任意单词即可0延迟查看内置牛津词典释义、派生词与同义词。"} for p in paragraphs],
                    ensure_ascii=False,
                ),
                complex_sentence_json=json.dumps(_complex_sentence_template(first_sentence), ensure_ascii=False),
                quiz_json=json.dumps(_quiz_template(title), ensure_ascii=False),
            )
            db.add(art)
            src.last_fetched_at = datetime.now()
            src.last_status = "ok"
            db.commit()
            return art
        except Exception as exc:
            src.last_status = ("error: " + str(exc))[:120]
            db.commit()
            continue
    return None


def fetch_wikipedia_article() -> Article | None:
    """Legacy fallback pipeline: one random Wikipedia REST summary as an article."""
    random_topic = random.choice(LIVE_TOPICS)
    try:
        with httpx.Client(timeout=2.2, follow_redirects=True) as client:
            resp = client.get("https://en.wikipedia.org/api/rest_v1/page/summary/" + random_topic["topic"])
        if resp.status_code != 200:
            return None
        data = resp.json()
        extract = data.get("extract", "")
        if len(extract) <= 150:
            return None

        first_sentence = extract.split(". ")[0] + "."
        return Article(
            id="art-live-" + str(int(time.time() * 1000)),
            seq=-1,
            title=data["title"] + ": Contemporary Research Perspectives",
            title_cn=data["title"] + "：当代前沿研究综述 (实时在线爬取)",
            source=random_topic["source"],
            source_url="https://en.wikipedia.org/wiki/" + random_topic["topic"],
            category=random_topic["category"],
            exam_level=random_topic["level"],
            lexile="1090L",
            cet_ratio="18.0%",
            exam_freq_tag="⚡ 实时网络爬取 · 四六级同源科普",
            in_library=False,
            read_status="unread",
            kind="live",
            paragraphs_json=json.dumps(
                [
                    {"en": extract, "cn": "（实时在线抓取段落）点击正文中任意单词即可0延迟查看内置牛津词典释义、派生词与同义词。"},
                    {
                        "en": "Researchers continue to investigate how these significant developments influence long-term productivity, environmental resilience, and modern educational strategy across global institutions.",
                        "cn": "研究人员继续探讨这些重大进展如何影响全球机构的长期生产率、环境韧性以及现代教育战略。",
                    },
                ],
                ensure_ascii=False,
            ),
            complex_sentence_json=json.dumps(_complex_sentence_template(first_sentence), ensure_ascii=False),
            quiz_json=json.dumps(_quiz_template(data["title"]), ensure_ascii=False),
        )
    except Exception:
        return None


def seed_crawl_sources(db: Session) -> None:
    if db.query(CrawlSource).count() > 0:
        return
    for src in DEFAULT_SOURCES:
        db.add(CrawlSource(name=src["name"], rss_url=src["rss_url"], enabled=True))
    db.commit()
