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

    # --- focus mode on entry: both panes collapsed + one-time toast ---
    js(
        "entry.collapsedBoth",
        "document.getElementById('leftSidebarPane').classList.contains('hidden') && "
        "document.getElementById('rightInspectorPane').classList.contains('hidden')",
    )
    js("entry.immersiveClass", "document.body.className.includes('reader-immersive')")
    js("entry.toastText", "document.getElementById('toastText').textContent.slice(0, 10)")

    # --- article switch re-collapses (expand left first, then pick another card) ---
    js("switch.expandLeft", "document.getElementById('btnToggleLeftPane').click()")
    time.sleep(0.2)
    js("switch.leftOpen", "!document.getElementById('leftSidebarPane').classList.contains('hidden')")
    js(
        "switch.clickOtherCard",
        "document.querySelectorAll('#sidebarArticleList .sidebar-art-card')[1].click()",
    )
    time.sleep(0.6)
    js(
        "switch.collapsedAgain",
        "document.getElementById('leftSidebarPane').classList.contains('hidden') && "
        "document.getElementById('rightInspectorPane').classList.contains('hidden')",
    )
    js("switch.titleChanged", "document.getElementById('readerArticleTitle').textContent.slice(0, 16)")

    # --- tab defaults ---
    js("tab.wordActive", "document.getElementById('tabBtnInspectorWord').className.includes('inspector-tab-active')")
    js("tab.wordVisible", "!document.getElementById('inspectorTabPanelWord').classList.contains('hidden')")
    js("tab.transHidden", "document.getElementById('inspectorTabPanelTrans').classList.contains('hidden')")
    js("tab.markedHidden", "document.getElementById('inspectorTabPanelMarked').classList.contains('hidden')")

    # --- drawers/details default collapsed ---
    js("details.collapsed", "[...document.querySelectorAll('#mainArticleSurface details')].map(d=>!d.open).join(',')")
    js("filterDrawer.collapsed", "!document.querySelector('.reader-filter-drawer').open")
    js("levelChip.ahzsb", "!!document.querySelector('.level-chip[data-level=\"安徽专升本\"]')")

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
    js("word.click", "document.querySelector('#readerParagraphsContainer .word-token').click()")
    time.sleep(0.3)
    js("tab.backToWord", "!document.getElementById('inspectorTabPanelWord').classList.contains('hidden')")
    js("inspect.phonetic", "document.getElementById('inspectWordPhonetic').textContent")
    js("inspect.derivatives", "document.getElementById('inspectWordDerivatives').textContent.slice(0, 30)")

    # --- marking regression ---
    js("mark.core", "document.getElementById('btnMarkCore').click()")
    time.sleep(0.8)
    js("mark.coreCount", "document.querySelectorAll('.word-mark-core').length")
    js("mark.countBadge", "document.getElementById('countArticleMarked').textContent")
    js("mark.clearKey0", "document.dispatchEvent(new KeyboardEvent('keydown', {key: '0', bubbles: true}))")
    time.sleep(0.6)
    js("mark.clearedCount", "document.querySelectorAll('.word-mark-core').length")
    js("mark.badgeAfterClear", "document.getElementById('countArticleMarked').textContent")

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

    # --- v1.1 batch 2: axis alignment ---
    js(
        "axis.aligned",
        "(()=>{const m=document.querySelector('.reader-masthead').getBoundingClientRect();"
        "const b=document.getElementById('readerParagraphsContainer').getBoundingClientRect();"
        "return (Math.abs(m.width-b.width)<2)+';';})()",
    )

    # --- stat strip units ---
    js("stat.units", "document.querySelector('.reader-stat-strip').textContent.includes('篇')")

    # --- quiz summary meta + dot ---
    js("quiz.metaText", "document.getElementById('quizSummaryMeta').textContent")
    js("quiz.dotVisible", "!document.getElementById('quizUnansweredDot').classList.contains('hidden')")

    # --- /api/tts reachability (network down → 503, not crash) ---
    js(
        "tts.status",
        "(()=>{const x=new XMLHttpRequest();x.open('GET','/api/tts?text=hello',false);x.send();return x.status+';';})()",
    )

    # --- finish flow: next button + auto-expanded quiz + go-next ---
    js("finish.click", "document.getElementById('btnMarkArticleFinished').click()")
    time.sleep(1.2)
    js("finish.nextBtnVisible", "!document.getElementById('btnNextArticle').classList.contains('hidden')")
    js("finish.quizAutoOpen", "document.getElementById('quizDetails').open")
    js("finish.pill", "document.getElementById('articleReadStatusPill').textContent")
    js("finish.nextTitleBefore", "document.getElementById('readerArticleTitle').textContent.slice(0, 20)")
    js("finish.goNext", "document.getElementById('btnNextArticle').click()")
    time.sleep(0.8)
    js("finish.nextTitleAfter", "document.getElementById('readerArticleTitle').textContent.slice(0, 24)")
    js("finish.inspectorReset", "document.getElementById('inspectWordMeaning').textContent.slice(0, 12)")
    js("finish.nextBtnHiddenAgain", "document.getElementById('btnNextArticle').classList.contains('hidden')")
    js(
        "finish.collapsedAfterNext",
        "document.getElementById('leftSidebarPane').classList.contains('hidden') && "
        "document.getElementById('rightInspectorPane').classList.contains('hidden')",
    )

    # --- selection → translate tab ---
    js(
        "select.simulate",
        "(()=>{const p=document.querySelectorAll('#readerParagraphsContainer p')[1];"
        "const r=document.createRange();r.selectNodeContents(p);"
        "const s=window.getSelection();s.removeAllRanges();s.addRange(r);"
        "document.getElementById('centerReaderPane').dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));"
        "return 'ok;';})()",
    )
    time.sleep(0.6)
    js("select.tabShown", "!document.getElementById('inspectorTabPanelTrans').classList.contains('hidden')")
    js("select.filled", "document.getElementById('inputFreeTranslate').value.length > 30")
    js("select.output", "document.getElementById('outputFreeTranslate').textContent.length > 10")

    # --- immersive measure widening (76ch ↔ 88ch) ---
    js("immersive.normalWidth", "Math.round(document.querySelector('.reader-body-inner').getBoundingClientRect().width)+';'")
    js("immersive.toggle", "document.getElementById('btnImmersiveBothPanes').click()")
    time.sleep(0.2)
    js("immersive.bodyClass", "document.body.className.includes('reader-immersive')")
    js("immersive.wideWidth", "Math.round(document.querySelector('.reader-body-inner').getBoundingClientRect().width)+';'")
    js("immersive.noOverlap", "(()=>{const c=document.getElementById('centerReaderPane').getBoundingClientRect();const b=document.querySelector('.reader-body-inner').getBoundingClientRect();return (b.right<=c.right+1&&b.left>=c.left-1)+';';})()")
    js("immersive.restore", "document.getElementById('btnImmersiveBothPanes').click()")
    time.sleep(0.2)
    js("immersive.normalAgain", "Math.round(document.querySelector('.reader-body-inner').getBoundingClientRect().width)+';'")

    # --- cosmos pause switch ---
    js("cosmos.pausedOnReader", "window.__cosmosPaused === true")
    js("cosmos.navHome", "document.getElementById('navTabHome').click()")
    time.sleep(0.3)
    js("cosmos.resumedOnHome", "window.__cosmosPaused === false")

    # --- crawler page: compact bar, filters, real crawl flow ---
    js("nav crawler", "document.getElementById('navTabCrawler').click()")
    time.sleep(0.5)
    visible("viewCrawler")
    js("crawler.noImage", "document.querySelectorAll('#viewCrawler img').length")
    js(
        "crawler.barHeight",
        "Math.round(document.querySelector('#viewCrawler .surface-card').getBoundingClientRect().height)+';'",
    )
    js("crawler.logDrawerCollapsed", "!document.querySelector('.crawl-log-drawer').open")
    js(
        "crawler.logOpenShows",
        "document.querySelector('.crawl-log-drawer').open = true, document.getElementById('crawlerTerminalOutput').offsetHeight > 10",
    )
    js("crawler.logDrawerReclose", "document.querySelector('.crawl-log-drawer').open = false, true")
    js("crawler.cards", "document.querySelectorAll('#crawlerDiscoveryGrid .crawl-card').length")
    js(
        "crawler.filterCET6",
        "(()=>{const s=document.getElementById('crawlTargetLevel');s.value='CET-6';s.dispatchEvent(new Event('change'));"
        "const cards=[...document.querySelectorAll('#crawlerDiscoveryGrid .crawl-card')];"
        "return (cards.length>0 && cards.every(c=>c.textContent.includes('CET-6')))+';';})()",
    )
    js(
        "crawler.filterEmpty",
        "(()=>{const lvl=document.getElementById('crawlTargetLevel');lvl.value='CET-4';lvl.dispatchEvent(new Event('change'));"
        "const cat=document.getElementById('crawlTargetCategory');cat.value='科技与人工智能';cat.dispatchEvent(new Event('change'));"
        "return document.getElementById('crawlerDiscoveryGrid').textContent.includes('没有符合当前筛选条件')+';';})()",
    )
    js(
        "crawler.filterReset",
        "(()=>{const lvl=document.getElementById('crawlTargetLevel');lvl.value='all';lvl.dispatchEvent(new Event('change'));"
        "const cat=document.getElementById('crawlTargetCategory');cat.value='all';cat.dispatchEvent(new Event('change'));"
        "return document.querySelectorAll('#crawlerDiscoveryGrid .crawl-card').length+';';})()",
    )
    js(
        "crawler.scrollWorks",
        "(()=>{const e=document.getElementById('viewCrawler');e.scrollTop=200;return e.scrollTop+';';})()",
    )
    js("crawler.setLevelTag", "document.getElementById('crawlTargetLevel').value='安徽专升本', 'ok;'")
    js("crawl click", "document.getElementById('btnStartCrawlBatch').click()")
    time.sleep(1)
    js("crawler.btnDisabledDuringCrawl", "document.getElementById('btnStartCrawlBatch').disabled")
    time.sleep(26)  # real RSS fetch (12s server deadline) + fallbacks + store sync
    js("crawler.btnRestored", "!document.getElementById('btnStartCrawlBatch').disabled")
    js("crawler.cardsAfter", "document.querySelectorAll('#crawlerDiscoveryGrid .crawl-card').length")
    js("crawler.logLast", "[...document.getElementById('crawlerTerminalOutput').children].pop().textContent")
    js(
        "crawler.levelTagged",
        "(()=>{return (document.getElementById('crawlerDiscoveryGrid').textContent.includes('安徽专升本') || "
        "[...document.getElementById('crawlerTerminalOutput').children].pop().textContent.includes('OFFLINE'))+';';})()",
    )
    js("crawler.levelReset", "document.getElementById('crawlTargetLevel').value='all', document.getElementById('crawlTargetLevel').dispatchEvent(new Event('change')), 'ok;'")
    js("crawler.cardClickNav", "document.querySelector('#crawlerDiscoveryGrid .crawl-card').click(), 'ok;'")
    time.sleep(0.4)
    js("crawler.cardNavReaderActive", "document.getElementById('navTabReader').className.includes('nav-active')")

    # --- custom import modal (restyled in App.vue) opens and closes ---
    js("modal.open", "document.getElementById('btnOpenCustomImport').click()")
    time.sleep(0.2)
    js("modal.visible", "!document.getElementById('modalCustomImport').classList.contains('hidden')")
    js("modal.close", "document.getElementById('btnCancelCustomModal').click()")
    time.sleep(0.2)
    js("modal.closedAgain", "document.getElementById('modalCustomImport').classList.contains('hidden')")

    # --- 安徽专升本 level support ---
    js("modal.levelSelect", "!!document.getElementById('customInputLevel')")
    js("crawler.levelOption", "[...document.getElementById('crawlTargetLevel').options].some(o=>o.value==='安徽专升本')")


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
