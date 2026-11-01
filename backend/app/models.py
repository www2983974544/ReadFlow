"""SQLite tables mirroring the legacy localStorage data model.

JSON blobs (paragraphs/quiz/complex_sentence) keep the original camelCase
shapes verbatim so the frontend consumes them 1:1 like the old AppState.
"""
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .db import Base


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    seq: Mapped[int] = mapped_column(Integer, default=0, index=True)  # legacy array order
    title: Mapped[str] = mapped_column(Text, default="")
    title_cn: Mapped[str] = mapped_column(Text, default="")
    source: Mapped[str] = mapped_column(String, default="")
    source_url: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String, default="")
    exam_level: Mapped[str] = mapped_column(String, default="")
    lexile: Mapped[str] = mapped_column(String, default="")
    cet_ratio: Mapped[str] = mapped_column(String, default="")
    exam_freq_tag: Mapped[str] = mapped_column(String, default="")
    in_library: Mapped[bool] = mapped_column(Boolean, default=False)
    read_status: Mapped[str] = mapped_column(String, default="unread")
    kind: Mapped[str] = mapped_column(String, default="custom")  # preset | extra | custom | live
    paragraphs_json: Mapped[str] = mapped_column(Text, default="[]")
    complex_sentence_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class VocabMark(Base):
    __tablename__ = "vocab_marks"

    lemma: Mapped[str] = mapped_column(String, primary_key=True)
    word: Mapped[str] = mapped_column(String, default="")
    status: Mapped[str] = mapped_column(String, default="unknown")  # unknown | core | mastered
    custom_note: Mapped[str] = mapped_column(Text, default="")
    cn: Mapped[str] = mapped_column(Text, default="")
    phonetic: Mapped[str] = mapped_column(String, default="")
    level: Mapped[str] = mapped_column(String, default="")
    derivatives: Mapped[str] = mapped_column(Text, default="")
    synonyms: Mapped[str] = mapped_column(Text, default="")
    context: Mapped[str] = mapped_column(Text, default="")
    article_title: Mapped[str] = mapped_column(String, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class DailyStat(Base):
    __tablename__ = "daily_stats"

    date: Mapped[str] = mapped_column(String, primary_key=True)  # YYYY-MM-DD
    mins: Mapped[float] = mapped_column(Float, default=0.0)
    words: Mapped[int] = mapped_column(Integer, default=0)
    vocab: Mapped[int] = mapped_column(Integer, default=0)


class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    article_id: Mapped[str] = mapped_column(String, index=True)
    question_index: Mapped[int] = mapped_column(Integer)
    chosen: Mapped[int] = mapped_column(Integer)
    correct: Mapped[bool] = mapped_column(Boolean)
    answered_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)


class Setting(Base):
    __tablename__ = "settings"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    value: Mapped[str] = mapped_column(Text, default="null")  # JSON-encoded


class CrawlSource(Base):
    __tablename__ = "crawl_sources"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String)
    rss_url: Mapped[str] = mapped_column(Text)
    enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    last_fetched_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    last_status: Mapped[str | None] = mapped_column(String, nullable=True)
