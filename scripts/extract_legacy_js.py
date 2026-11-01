"""Extract named JS functions from the legacy single-file HTML into standalone
files under .legacy_extracted/, for faithful porting into the Vue project.

Usage: .venv/Scripts/python scripts/extract_legacy_js.py [name ...]
       (no names -> extract the default set)
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_LEGACY = Path(r"d:\Users\wzc\Desktop\ReadFlow_windows\cet_reading_master.html")
OUT_DIR = ROOT / ".legacy_extracted"

DEFAULT_FUNCTIONS = [
    "initCosmosStarfieldCanvas",
    "renderUniverseFrame",
    "updateSmoothOrbitalRing60FPS",
    "updateHomeCountdownDisplay",
    "renderStatsAndHeatmap",
    "updateTopBadgesAndStats",
    "showToast",
    "renderSidebarArticleList",
    "selectWordForInspection",
    "markCurrentWord",
    "renderCurrentArticle",
    "renderArticleMarkedWordsList",
    "renderQuizSection",
    "renderMyLibraryGrid",
    "renderVocabNotebook",
    "renderCrawlerDiscoveryGrid",
    "runSmartArticleCrawler",
    "translateSentenceOfflineOrOnline",
    "speakSingleWord",
    "stopSpeechPlayback",
    "playViaNativeTTS",
    "playExpressiveOfflineProsodyTTS",
    "splitIntoExpressiveSentences",
    "getBestNativeEnglishVoice",
    "initVoices",
    "preloadWordHumanAudio",
    "toggleExamTimer",
    "applyCustomTimerMinutes",
    "applyThemeMode",
    "speakFullArticle",
]


def find_matching(text: str, open_idx: int) -> int:
    """Index of the brace matching text[open_idx], skipping JS strings/comments."""
    depth = 0
    quote = None
    i = open_idx
    n = len(text)
    while i < n:
        c = text[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in "\"'`":
            quote = c
        elif c == "/" and i + 1 < n and text[i + 1] == "/":
            j = text.find("\n", i)
            i = j if j != -1 else n
            continue
        elif c == "/" and i + 1 < n and text[i + 1] == "*":
            j = text.find("*/", i + 2)
            i = (j + 2) if j != -1 else n
            continue
        elif c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError(f"no matching brace for index {open_idx}")


def main() -> None:
    names = sys.argv[1:] or DEFAULT_FUNCTIONS
    text = (DEFAULT_LEGACY).read_text(encoding="utf-8")

    OUT_DIR.mkdir(exist_ok=True)
    missing = []
    for name in names:
        marker = f"function {name}("
        idx = text.find(marker)
        if idx == -1:
            missing.append(name)
            continue
        brace_idx = text.index("{", idx + len(marker) - 1)
        end = find_matching(text, brace_idx)
        body = text[idx : end + 1]
        (OUT_DIR / f"{name}.js").write_text(body + "\n", encoding="utf-8")
        print(f"{name}: {body.count(chr(10)) + 1} lines")

    if missing:
        print("NOT FOUND:", ", ".join(missing))


if __name__ == "__main__":
    main()
