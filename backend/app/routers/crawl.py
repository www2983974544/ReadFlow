"""Crawler API: legacy pool injection + one freshly fetched article per click."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..news import _next_front_seq, fetch_rss_article, fetch_wikipedia_article, inject_extra_pool
from ..serializers import article_to_dict

router = APIRouter(prefix="/api/crawl", tags=["crawl"])


class CrawlBody(BaseModel):
    level: str | None = None  # optional target exam tag for freshly fetched articles


@router.post("")
def crawl(body: CrawlBody | None = None, db: Session = Depends(get_db)) -> dict:
    """Legacy runSmartArticleCrawler, server-side:
    1. inject EXTRA_CRAWL_POOL presets (skips already-present ids);
    2. fetch one fresh article from an enabled RSS source (trafilatura body
       extraction), falling back to the legacy Wikipedia summary pipeline.

    When a target level (e.g. 安徽专升本) is supplied, freshly fetched
    articles are tagged with it so they surface under that exam's filter."""
    added_pool = inject_extra_pool(db)

    live = fetch_rss_article(db)
    origin = "rss"
    if live is None:
        origin = "wikipedia"
        live = fetch_wikipedia_article()
    if live is not None:
        live.seq = _next_front_seq(db)
        target_level = body.level if body else None
        if target_level and target_level not in ("all", ""):
            live.exam_level = target_level
            live.exam_freq_tag = "⚡ 实时网络爬取 · " + target_level
        db.add(live)
        db.commit()

    return {
        "poolAdded": [article_to_dict(a) for a in added_pool],
        "live": article_to_dict(live) if live else None,
        "liveOrigin": origin if live else None,
    }
