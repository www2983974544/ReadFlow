"""Stats API: mirrors the legacy readflow_stats_v8 shape and mutations."""
import json
from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import DailyStat, QuizAnswer, Setting
from ..models import Article  # noqa: F401 (import keeps table metadata complete)

router = APIRouter(prefix="/api/stats", tags=["stats"])

DEFAULT_EXAM_NAME = "英语六级"
DEFAULT_EXAM_DATE = "2026-12-19T15:00"


def _setting(db: Session, key: str, default: str) -> str:
    row = db.get(Setting, key)
    return row.value if row is not None else default


def stats_payload(db: Session) -> dict:
    daily = {d.date: {"mins": d.mins, "words": d.words, "vocab": d.vocab}
             for d in db.query(DailyStat).all()}
    try:
        quiz_answered = int(_setting(db, "quiz_answered", "0"))
        quiz_correct = int(_setting(db, "quiz_correct", "0"))
    except ValueError:
        quiz_answered = quiz_correct = 0
    return {
        "examName": _setting(db, "exam_name", DEFAULT_EXAM_NAME),
        "examTargetDate": _setting(db, "exam_target_date", DEFAULT_EXAM_DATE),
        "dailyStatsMap": daily,
        "quizAnswered": quiz_answered,
        "quizCorrect": quiz_correct,
    }


def _set_setting(db: Session, key: str, value) -> None:
    row = db.get(Setting, key)
    if row is None:
        row = Setting(key=key, value=json.dumps(value, ensure_ascii=False))
        db.add(row)
    else:
        row.value = json.dumps(value, ensure_ascii=False)


class StudyDelta(BaseModel):
    mins: float = 0.0
    words: int = 0
    vocab: int = 0


class QuizAnswerIn(BaseModel):
    articleId: str = ""
    questionIndex: int = 0
    chosen: int = -1
    correct: bool = False


@router.get("")
def get_stats(db: Session = Depends(get_db)) -> dict:
    return stats_payload(db)


@router.post("/study-delta")
def study_delta(body: StudyDelta, db: Session = Depends(get_db)) -> dict:
    """Increment today's entry (legacy recordTodayStudyDelta; negatives allowed for undo)."""
    today = date.today().isoformat()
    row = db.get(DailyStat, today)
    if row is None:
        row = DailyStat(date=today, mins=0.0, words=0, vocab=0)
        db.add(row)
    row.mins += body.mins
    row.words += body.words
    row.vocab += body.vocab
    db.commit()
    return stats_payload(db)


@router.post("/quiz-answer")
def quiz_answer(body: QuizAnswerIn, db: Session = Depends(get_db)) -> dict:
    db.add(
        QuizAnswer(
            article_id=body.articleId,
            question_index=body.questionIndex,
            chosen=body.chosen,
            correct=body.correct,
        )
    )
    _set_setting(db, "quiz_answered", int(_setting(db, "quiz_answered", "0") or 0) + 1)
    if body.correct:
        _set_setting(db, "quiz_correct", int(_setting(db, "quiz_correct", "0") or 0) + 1)
    db.commit()
    return stats_payload(db)


@router.post("/reset")
def reset_stats(db: Session = Depends(get_db)) -> dict:
    """Legacy 清空重置全部统计数据: clears daily history, quiz counters, all vocab
    marks and reverts finished articles to unread (mirrors the legacy reset)."""
    from ..models import VocabMark

    db.query(DailyStat).delete()
    db.query(QuizAnswer).delete()
    db.query(VocabMark).delete()
    db.query(Article).filter(Article.read_status == "finished").update(
        {Article.read_status: "unread"}
    )
    _set_setting(db, "quiz_answered", 0)
    _set_setting(db, "quiz_correct", 0)
    db.commit()
    return stats_payload(db)
