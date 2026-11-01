"""Neural TTS endpoint (edge-tts): emotional article narration as mp3.

Free Microsoft Edge neural voices, no API key. Audio is cached in memory (LRU)
and on disk (capped, pruned LRU-by-mtime) so repeated narration is instant.
On any failure returns 503 quickly (bounded by an 8s generation timeout) so the
frontend can fall back to Youdao audio and then to browser speechSynthesis.
"""
import asyncio
import hashlib
import time
from collections import OrderedDict
from pathlib import Path

from fastapi import APIRouter, HTTPException, Response

from ..config import DATA_DIR

router = APIRouter(prefix="/api/tts", tags=["tts"])

_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
_CACHE_MAX = 300

DISK_CACHE_DIR = DATA_DIR / "tts_cache"
DISK_CACHE_MAX_BYTES = 30 * 1024 * 1024  # 30 MB, pruned oldest-first
_GENERATION_TIMEOUT = 8.0


def _cache_get(key: str) -> bytes | None:
    data = _CACHE.get(key)
    if data is not None:
        _CACHE.move_to_end(key)
    return data


def _cache_put(key: str, data: bytes) -> None:
    _CACHE[key] = data
    _CACHE.move_to_end(key)
    while len(_CACHE) > _CACHE_MAX:
        _CACHE.popitem(last=False)


def _disk_path(key: str) -> Path:
    return DISK_CACHE_DIR / f"{key}.mp3"


def _disk_get(key: str) -> bytes | None:
    path = _disk_path(key)
    if not path.is_file():
        return None
    try:
        data = path.read_bytes()
    except OSError:
        return None
    path.touch()  # LRU: refresh mtime on hit
    _cache_put(key, data)
    return data


def _disk_put(key: str, data: bytes) -> None:
    try:
        DISK_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _disk_path(key).write_bytes(data)
        total = sum(f.stat().st_size for f in DISK_CACHE_DIR.glob("*.mp3"))
        while total > DISK_CACHE_MAX_BYTES:
            oldest = min(DISK_CACHE_DIR.glob("*.mp3"), key=lambda f: f.stat().st_mtime, default=None)
            if oldest is None:
                break
            total -= oldest.stat().st_size
            oldest.unlink(missing_ok=True)
    except OSError:
        pass  # cache is best-effort


@router.get("")
async def tts(text: str, voice: str = "en-US-AriaNeural", rate: str = "+0%", pitch: str = "+0Hz"):
    text = text.strip()[:1000]
    if not text:
        raise HTTPException(400, "empty text")

    key = hashlib.sha1(f"{voice}|{rate}|{pitch}|{text}".encode()).hexdigest()
    cached = _cache_get(key)
    if cached is not None:
        return Response(cached, media_type="audio/mpeg")
    disk = _disk_get(key)
    if disk is not None:
        return Response(disk, media_type="audio/mpeg")

    try:
        import edge_tts

        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)

        async def _generate() -> bytes:
            parts: list[bytes] = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    parts.append(chunk["data"])
            return b"".join(parts)

        audio = await asyncio.wait_for(_generate(), timeout=_GENERATION_TIMEOUT)
    except Exception:
        raise HTTPException(503, "tts unavailable")
    if not audio:
        raise HTTPException(503, "tts empty")

    _cache_put(key, audio)
    _disk_put(key, audio)
    return Response(audio, media_type="audio/mpeg")
