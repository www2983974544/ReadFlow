"""Vocab marks API: the wordMarks map (keyed by lemma), upsert and unmark."""
from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import VocabMark
from ..serializers import mark_to_dict

router = APIRouter(prefix="/api/vocab", tags=["vocab"])


class VocabMarkIn(BaseModel):
    word: str = ""
    status: str = "unknown"  # unknown | core | mastered
    customNote: str = ""
    cn: str = ""
    phonetic: str = ""
    level: str = ""
    derivatives: str = ""
    synonyms: str = ""
    context: str = ""
    articleTitle: str = ""


@router.get("")
def list_marks(db: Session = Depends(get_db)) -> dict:
    rows = db.query(VocabMark).all()
    return {m.lemma: mark_to_dict(m) for m in rows}


@router.put("/{lemma}")
def put_mark(lemma: str, body: VocabMarkIn, db: Session = Depends(get_db)) -> dict:
    m = db.get(VocabMark, lemma)
    if m is None:
        m = VocabMark(lemma=lemma)
        db.add(m)
    m.word = body.word or lemma
    m.status = body.status
    m.custom_note = body.customNote
    m.cn = body.cn
    m.phonetic = body.phonetic
    m.level = body.level
    m.derivatives = body.derivatives
    m.synonyms = body.synonyms
    m.context = body.context
    m.article_title = body.articleTitle
    m.updated_at = datetime.now()
    db.commit()
    return mark_to_dict(m)


@router.delete("/{lemma}")
def delete_mark(lemma: str, db: Session = Depends(get_db)) -> dict:
    m = db.get(VocabMark, lemma)
    if m is not None:
        db.delete(m)
        db.commit()
    return {"ok": True}
