"""Serialize DB rows back into the exact legacy AppState shapes (camelCase)."""
import json

from .models import Article, VocabMark


def article_to_dict(a: Article) -> dict:
    d = {
        "id": a.id,
        "title": a.title,
        "titleCn": a.title_cn,
        "source": a.source,
        "sourceUrl": a.source_url,
        "category": a.category,
        "examLevel": a.exam_level,
        "lexile": a.lexile,
        "cetRatio": a.cet_ratio,
        "examFreqTag": a.exam_freq_tag,
        "inLibrary": a.in_library,
        "readStatus": a.read_status,
        "paragraphs": json.loads(a.paragraphs_json or "[]"),
    }
    if a.complex_sentence_json:
        d["complexSentence"] = json.loads(a.complex_sentence_json)
    d["quiz"] = json.loads(a.quiz_json) if a.quiz_json else []
    return d


def mark_to_dict(m: VocabMark) -> dict:
    return {
        "word": m.word,
        "lemma": m.lemma,
        "status": m.status,
        "customNote": m.custom_note,
        "cn": m.cn,
        "phonetic": m.phonetic,
        "level": m.level,
        "derivatives": m.derivatives,
        "synonyms": m.synonyms,
        "context": m.context,
        "articleTitle": m.article_title,
    }
