"""Articles API: list / get / upsert (custom import & crawler injections) / patch."""
import json

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Article
from ..serializers import article_to_dict

router = APIRouter(prefix="/api/articles", tags=["articles"])


class ParagraphIn(BaseModel):
    en: str = ""
    cn: str = ""


class ComplexSentenceIn(BaseModel):
    sentence: str = ""
    structure: str = ""
    tip: str = ""


class QuizItemIn(BaseModel):
    q: str = ""
    options: list[str] = []
    answer: int = 0
    explanation: str = ""


class ArticleIn(BaseModel):
    id: str
    title: str = ""
    titleCn: str = ""
    source: str = ""
    sourceUrl: str = ""
    category: str = ""
    examLevel: str = ""
    lexile: str = ""
    cetRatio: str = ""
    examFreqTag: str = ""
    inLibrary: bool = False
    readStatus: str = "unread"
    kind: str = "custom"  # preset | extra | custom | live
    paragraphs: list[ParagraphIn] = []
    complexSentence: ComplexSentenceIn | None = None
    quiz: list[QuizItemIn] = []


class ArticlePatch(BaseModel):
    inLibrary: bool | None = None
    readStatus: str | None = None


@router.get("")
def list_articles(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.query(Article).order_by(Article.seq).all()
    return [article_to_dict(a) for a in rows]


@router.get("/{article_id}")
def get_article(article_id: str, db: Session = Depends(get_db)) -> dict:
    a = db.get(Article, article_id)
    if a is None:
        raise HTTPException(404, "article not found")
    return article_to_dict(a)


@router.post("")
def upsert_article(body: ArticleIn, db: Session = Depends(get_db)) -> dict:
    """Create an article; if the id already exists, return it unchanged
    (the legacy crawler re-injects its pool on every click). New articles are
    inserted at the FRONT of the display order — the legacy code unshift()s
    custom imports and crawled articles."""
    existing = db.get(Article, body.id)
    if existing is not None:
        return article_to_dict(existing)

    min_seq = db.query(func.min(Article.seq)).scalar()
    a = Article(
        id=body.id,
        seq=(min_seq if min_seq is not None else 0) - 1,
        title=body.title,
        title_cn=body.titleCn,
        source=body.source,
        source_url=body.sourceUrl,
        category=body.category,
        exam_level=body.examLevel,
        lexile=body.lexile,
        cet_ratio=body.cetRatio,
        exam_freq_tag=body.examFreqTag,
        in_library=body.inLibrary,
        read_status=body.readStatus,
        kind=body.kind,
        paragraphs_json=json.dumps(
            [p.model_dump() for p in body.paragraphs], ensure_ascii=False
        ),
        complex_sentence_json=(
            json.dumps(body.complexSentence.model_dump(), ensure_ascii=False)
            if body.complexSentence
            else None
        ),
        quiz_json=json.dumps(
            [q.model_dump() for q in body.quiz], ensure_ascii=False
        ),
    )
    db.add(a)
    db.commit()
    return article_to_dict(a)


@router.patch("/{article_id}")
def patch_article(article_id: str, body: ArticlePatch, db: Session = Depends(get_db)) -> dict:
    a = db.get(Article, article_id)
    if a is None:
        raise HTTPException(404, "article not found")
    if body.inLibrary is not None:
        a.in_library = body.inLibrary
    if body.readStatus is not None:
        a.read_status = body.readStatus
    db.commit()
    return article_to_dict(a)
