"""P2 reader verification: drives the real UI in a WebView2 window and reads back
DOM state (nav switch, word lookup, marking, theme, toolbar)."""
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


def js(expr: str):
    out = WINDOW.evaluate_js(expr)
    RESULTS.append((expr[:60], out))
    return out


def run_checks() -> None:
    window = WINDOW
    window.events.loaded.wait(timeout=20)
    time.sleep(4)  # store bootstrap + initial renders

    js("(document.getElementById('readerArticleTitle')||{}).textContent || '(reader not rendered yet)'")

    # switch to reader view via nav tab
    js("document.getElementById('navTabReader').click()")
    time.sleep(0.5)

    js("document.getElementById('readerArticleTitle').textContent")
    js("document.querySelectorAll('#readerParagraphsContainer .word-token').length")
    js("document.getElementById('inspectWordText').textContent")
    js("document.getElementById('inspectWordMeaning').textContent.slice(0, 60)")

    # click the word "artificial" in the article
    js("document.querySelector('.word-token[data-lemma=\"artificial\"]').click()")
    time.sleep(0.3)
    js("document.getElementById('inspectWordPhonetic').textContent")
    js("document.getElementById('inspectWordDerivatives').textContent.slice(0, 50)")

    # mark it as core (keyboard shortcut path uses the same function)
    js("document.getElementById('btnMarkCore').click()")
    time.sleep(0.8)
    js("document.querySelectorAll('.word-mark-core').length")
    js("document.getElementById('countArticleMarked').textContent")

    # quiz option click
    js("const q=document.querySelector('.quiz-opt-btn'); if(q) q.click()")
    time.sleep(0.5)
    js("(document.getElementById('quizExp-0')||{}).className")

    # timer + bilingual toggle
    js("document.getElementById('btnExamTimer').click()")
    time.sleep(0.2)
    js("document.getElementById('txtTimerDisplay').textContent")
    js("document.getElementById('btnToggleBilingual').click()")
    time.sleep(0.2)
    js("document.querySelectorAll('#readerParagraphsContainer [id^=paraCnBox-]:not(.hidden)').length")

    # theme switch to sepia
    js("document.getElementById('btnThemeSepia').click()")
    time.sleep(0.2)
    js("document.body.className")

    # collapse both panes then restore
    js("document.getElementById('btnImmersiveBothPanes').click()")
    time.sleep(0.2)
    js("document.getElementById('leftSidebarPane').className.includes('hidden')")
    js("document.getElementById('btnImmersiveBothPanes').click()")
    time.sleep(0.2)
    js("document.getElementById('leftSidebarPane').className.includes('hidden')")

    print("=== READER CHECKS ===", flush=True)
    for expr, out in RESULTS:
        print(f"[{out!r}] <= {expr}", flush=True)
    window.destroy()


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
        title="ReadFlow P2 Check",
        url=f"http://127.0.0.1:{port}/",
        width=1440,
        height=900,
    )
    webview.start(run_checks)


if __name__ == "__main__":
    main()
