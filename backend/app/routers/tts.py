"""Neural TTS endpoint (edge-tts): emotional article narration as mp3.

Free Microsoft Edge neural voices, no API key. Responses are cached in memory
by (voice, rate, pitch, text). On any failure returns 503 so the frontend can
fall back to the Youdao dictionary audio and then to browser speechSynthesis.
"""
import hashlib
from collections import OrderedDict

from fastapi import APIRouter, HTTPException, Response

router = APIRouter(prefix="/api/tts", tags=["tts"])

_CACHE: "OrderedDict[str, bytes]" = OrderedDict()
_CACHE_MAX = 300


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


@router.get("")
async def tts(text: str, voice: str = "en-US-AriaNeural", rate: str = "+0%", pitch: str = "+0Hz"):
    text = text.strip()[:1000]
    if not text:
        raise HTTPException(400, "empty text")

    key = hashlib.sha1(f"{voice}|{rate}|{pitch}|{text}".encode()).hexdigest()
    cached = _cache_get(key)
    if cached is not None:
        return Response(cached, media_type="audio/mpeg")

    try:
        import edge_tts

        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        parts: list[bytes] = []
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                parts.append(chunk["data"])
        audio = b"".join(parts)
    except Exception:
        raise HTTPException(503, "tts unavailable")
    if not audio:
        raise HTTPException(503, "tts empty")

    _cache_put(key, audio)
    return Response(audio, media_type="audio/mpeg")
