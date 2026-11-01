"""Settings API: UI preferences persisted per key (theme, voice, timer, exam...)."""
import json
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Setting

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("")
def get_settings(db: Session = Depends(get_db)) -> dict:
    out: dict[str, Any] = {}
    for row in db.query(Setting).all():
        if row.key.startswith("quiz_"):
            continue  # owned by the stats API
        try:
            out[row.key] = json.loads(row.value)
        except json.JSONDecodeError:
            out[row.key] = row.value
    return out


@router.put("")
def put_settings(body: dict[str, Any], db: Session = Depends(get_db)) -> dict:
    for key, value in body.items():
        row = db.get(Setting, key)
        encoded = json.dumps(value, ensure_ascii=False)
        if row is None:
            db.add(Setting(key=key, value=encoded))
        else:
            row.value = encoded
    db.commit()
    return get_settings(db=db)
