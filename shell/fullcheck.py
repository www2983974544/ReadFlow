"""P3/P4 full-app verification: drives all six views in a WebView2 window."""
import os
import socket
import sys
import threading
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

import uvicorn  # noqa: E402
import webview  # noqa: E402

from backend.app.config import BACKEND_PORT  # noqa: E402

WINDOW = None
RESULTS = []


def _find_port() -> int:
    for port in range(BACKEND_PORT, BACKEND_PORT + 20):
        with socket.socket() as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return BACKEND_PORT


def js(label: str, expr: str):
    print(f"[step] {label}", flush=True)
    try:
        out = WINDOW.evaluate_js(expr)
    except Exception as exc:
        out = f"<JS-ERROR {exc}>"
    RESULTS.append((label, out))
    return out


def visible(view_id: str) -> bool:
    """A view counts as shown only if it actually occupies layout space."""
    print(f"[step] visible({view_id})", flush=True)
    try:
        out = WINDOW.evaluate_js(
            f"(()=>{{const e=document.getElementById('{view_id}');"
            "if(!e)return 'no-element';const r=e.getBoundingClientRect();"
            "return (r.height>10&&r.width>10)+';';})()"
        )
        ok = out == "true;"
        RESULTS.append((f"visible({view_id})", out))
        return ok
    except Exception as exc:
        RESULTS.append((f"visible({view_id})", f"<JS-ERROR {exc}>"))
        return False


def run_checks() -> None:
    window = WINDOW
    try:
        window.events.loaded.wait(timeout=20)
        time.sleep(5)  # boot: stores + cosmos + countdown + reader init
        _checks()
    finally:
        print("=== FULL CHECKS ===", flush=True)
        for label, out in RESULTS:
            print(f"[{label}] = {out!r}", flush=True)
        window.destroy()


def _checks() -> None:

    # --- home ---
    js("home.canvas", "!!document.getElementById('cosmosStarfieldCanvas')")
    js("home.cdDays", "document.getElementById('cdDays').textContent")
    visible("viewHome")

    # --- reader ---
    js("nav reader", "document.getElementById('navTabReader').click()")
    time.sleep(0.5)
    visible("viewReader")
    js("reader.tokens", "document.querySelectorAll('#readerParagraphsContainer .word-token').length")
    js(
        "reader.centerScrollable",
        "(()=>{const e=document.getElementById('centerReaderPane');return (e.scrollHeight>e.clientHeight)+';';})()",
    )
    js(
        "reader.centerScrollWorks",
        "(()=>{const e=document.getElementById('centerReaderPane');e.scrollTop=150;return e.scrollTop+';';})()",
    )
    js(
        "reader.panesBounded",
        "(()=>{const l=document.getElementById('leftSidebarPane').getBoundingClientRect();const c=document.getElementById('centerReaderPane').getBoundingClientRect();return (l.height<=window.innerHeight&&c.height<=window.innerHeight)+';';})()",
    )

    # --- crawler: grid then real crawl ---
    js("nav crawler", "document.getElementById('navTabCrawler').click()")
    time.sleep(0.5)
    visible("viewCrawler")
    js("crawler.cards", "document.querySelectorAll('#crawlerDiscoveryGrid .surface-card').length")
    js(
        "crawler.scrollWorks",
        "(()=>{const e=document.getElementById('viewCrawler');e.scrollTop=200;return e.scrollTop+';';})()",
    )
    js("crawl click", "document.getElementById('btnStartCrawlBatch').click()")
    time.sleep(8)  # RSS fetch + body extraction
    js("crawler.cards.after", "document.querySelectorAll('#crawlerDiscoveryGrid .surface-card').length")
    js("crawler.logLast", "[...document.getElementById('crawlerTerminalOutput').children].pop().textContent")
    # clicking anywhere on a discovery card opens it for reading
    js(
        "crawler.cardClick",
        "(()=>{const c=document.querySelector('#crawlerDiscoveryGrid .crawl-card');if(!c)return 'no-card';c.click();return 'ok;';})()",
    )
    time.sleep(0.4)
    visible("viewReader")

    # --- library ---
    js("nav library", "document.getElementById('navTabLibrary').click()")
    time.sleep(0.4)
    visible("viewLibrary")
    js("library.cards", "document.querySelectorAll('#myLibraryGrid .surface-card').length")
    js(
        "library.scrollWorks",
        "(()=>{const e=document.getElementById('viewLibrary');e.scrollTop=150;return e.scrollTop+';';})()",
    )
    # clicking anywhere on a library card opens it for reading
    js(
        "library.cardClick",
        "(()=>{const c=document.querySelector('#myLibraryGrid .lib-card');if(!c)return 'no-card';c.click();return 'ok;';})()",
    )
    time.sleep(0.4)
    visible("viewReader")

    # --- vocab ---
    js("nav vocab", "document.getElementById('navTabVocab').click()")
    time.sleep(0.4)
    visible("viewVocab")
    js("vocab.cards", "document.querySelectorAll('#vocabNotebookGrid .surface-card').length")

    # --- stats ---
    js("nav stats", "document.getElementById('navTabStats').click()")
    time.sleep(0.4)
    visible("viewStats")
    js("stats.heatmapCells", "document.querySelectorAll('#githubHeatmapGrid .hm-cell').length")
    js("stats.bars", "document.querySelectorAll('#chart14DaysBars > div').length")
    js("stats.cats", "document.querySelectorAll('#categoryMasteryContainer > div').length")
    js("stats.inspect", "document.getElementById('heatmapInspectorText').textContent.slice(0, 40)")

    # checkin then verify today cell lights up
    js("checkin click", "document.getElementById('btnLogStudySession').click()")
    time.sleep(1.0)
    js("stats.todayMins", "document.getElementById('statPageTodayMins').textContent")
    js("stats.streak", "document.getElementById('statPageStreak').textContent")

    # reset all
    js("reset click", "document.getElementById('btnResetAllStats').click()")
    time.sleep(1.5)
    js("stats.afterReset", "document.getElementById('statPageTotalHours').textContent")
    js("vocabEmpty.afterReset", "document.getElementById('navTabVocab').click(), document.querySelectorAll('#vocabNotebookGrid .surface-card').length")


def main() -> None:
    global WINDOW
    port = _find_port()

    from backend.app.main import app

    server = uvicorn.Server(
        uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    )
    threading.Thread(target=server.run, daemon=True).start()
    for _ in range(100):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/api/ping", timeout=0.3)
            break
        except Exception:
            time.sleep(0.1)

    WINDOW = webview.create_window(
        title="ReadFlow Full Check",
        url=f"http://127.0.0.1:{port}/",
        width=1440,
        height=900,
    )
    webview.start(run_checks)


if __name__ == "__main__":
    main()
