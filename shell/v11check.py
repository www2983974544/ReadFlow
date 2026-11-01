"""v1.1 reader UI refactor verification: tabs, collapsed drawers, contract nodes
and full regression of reader interactions."""
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
    print(f"[step] visible({view_id})", flush=True)
    try:
        out = WINDOW.evaluate_js(
            f"(()=>{{const e=document.getElementById('{view_id}');"
            "if(!e)return 'no-element';const r=e.getBoundingClientRect();"
            "return (r.height>10&&r.width>10)+';';})()"
        )
        RESULTS.append((f"visible({view_id})", out))
        return out == "true;"
    except Exception as exc:
        RESULTS.append((f"visible({view_id})", f"<JS-ERROR {exc}>"))
        return False


def run_checks() -> None:
    window = WINDOW
    try:
        window.events.loaded.wait(timeout=20)
        time.sleep(5)
        _checks()
    finally:
        print("=== V11 CHECKS ===", flush=True)
        for label, out in RESULTS:
            print(f"[{label}] = {out!r}", flush=True)
        window.destroy()


def _checks() -> None:
    js("nav reader", "document.getElementById('navTabReader').click()")
    time.sleep(0.5)
    visible("viewReader")

    # --- tab defaults ---
    js("tab.wordActive", "document.getElementById('tabBtnInspectorWord').className.includes('inspector-tab-active')")
    js("tab.wordVisible", "!document.getElementById('inspectorTabPanelWord').classList.contains('hidden')")
    js("tab.transHidden", "document.getElementById('inspectorTabPanelTrans').classList.contains('hidden')")
    js("tab.markedHidden", "document.getElementById('inspectorTabPanelMarked').classList.contains('hidden')")

    # --- drawers/details default collapsed ---
    js("details.collapsed", "[...document.querySelectorAll('#mainArticleSurface details')].map(d=>!d.open).join(',')")
    js("filterDrawer.collapsed", "!document.querySelector('.reader-filter-drawer').open")

    # --- masthead strings ---
    js("eyebrow.source", "document.getElementById('readerBadgeSource').textContent")
    js("meta.cet", "document.getElementById('metaCetRatio').textContent")
    js("meta.lexile", "document.getElementById('metaLexile').textContent")
    js("meta.lib", "document.getElementById('metaLibStatusBadge').textContent")

    # --- manual tab switch ---
    js("tab.switchTrans", "document.getElementById('tabBtnInspectorTrans').click()")
    time.sleep(0.2)
    js("tab.transNowVisible", "!document.getElementById('inspectorTabPanelTrans').classList.contains('hidden')")
    js("tab.wordNowHidden", "document.getElementById('inspectorTabPanelWord').classList.contains('hidden')")

    # --- word click auto-switches back to word tab ---
    js("word.click", "document.querySelector('.word-token[data-lemma=\"artificial\"]').click()")
    time.sleep(0.3)
    js("tab.backToWord", "!document.getElementById('inspectorTabPanelWord').classList.contains('hidden')")
    js("inspect.phonetic", "document.getElementById('inspectWordPhonetic').textContent")
    js("inspect.derivatives", "document.getElementById('inspectWordDerivatives').textContent.slice(0, 30)")

    # --- marking regression ---
    js("mark.core", "document.getElementById('btnMarkCore').click()")
    time.sleep(0.8)
    js("mark.coreCount", "document.querySelectorAll('.word-mark-core').length")
    js("mark.countBadge", "document.getElementById('countArticleMarked').textContent")

    # --- quiz regression (open details first) ---
    js("quiz.open", "[...document.querySelectorAll('#mainArticleSurface details')].forEach(d=>d.open=true)")
    time.sleep(0.2)
    js("quiz.click", "document.querySelector('.quiz-opt-btn').click()")
    time.sleep(0.5)
    js("quiz.expShown", "!(document.getElementById('quizExp-0')||{classList:{contains:()=>true}}).classList.contains('hidden')")

    # --- bilingual toggle regression ---
    js("bilingual.toggle", "document.getElementById('btnToggleBilingual').click()")
    time.sleep(0.2)
    js("bilingual.visibleCount", "document.querySelectorAll('#readerParagraphsContainer [id^=paraCnBox-]:not(.hidden)').length")

    # --- timer regression ---
    js("timer.start", "document.getElementById('btnExamTimer').click()")
    time.sleep(0.2)
    js("timer.display", "document.getElementById('txtTimerDisplay').textContent")

    # --- contract nodes ---
    js("contract.paraRow0", "!!document.getElementById('paraRow-0')")
    js("contract.groupClass", "document.getElementById('paraRow-0').className.includes('group')")
    js("contract.sidebarCards", "document.querySelectorAll('#sidebarArticleList .sidebar-art-card[data-artid]').length")
    js("contract.ghostBtns", "document.querySelectorAll('#viewReader .ghost-btn').length")
    js("contract.parabtnsHidden", "getComputedStyle(document.querySelector('.btn-speak-para')).opacity")

    # --- scroll regression ---
    js("scroll.center", "(()=>{const e=document.getElementById('centerReaderPane');e.scrollTop=150;return e.scrollTop+';';})()")
    js("scroll.panesBounded", "(()=>{const l=document.getElementById('leftSidebarPane').getBoundingClientRect();const c=document.getElementById('centerReaderPane').getBoundingClientRect();return (l.height<=window.innerHeight&&c.height<=window.innerHeight)+';';})()")

    # --- hover buttons appear on paragraph hover (opacity transitions to 1) ---
    js("hover.simulate", "(()=>{const row=document.getElementById('paraRow-0');row.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));return 'ok;';})()")

    # --- theme regression ---
    js("theme.sepia", "document.getElementById('btnThemeSepia').click(), document.body.className")
    time.sleep(0.2)
    js("theme.light", "document.getElementById('btnThemeLight').click(), document.body.className")


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
        title="ReadFlow v1.1 Check",
        url=f"http://127.0.0.1:{port}/",
        width=1440,
        height=900,
    )
    webview.start(run_checks)


if __name__ == "__main__":
    main()
