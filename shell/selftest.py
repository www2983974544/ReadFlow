"""One-shot WebView2 capability self-test.

Opens the backend self-test page in a pywebview window, collects the check
results (API round trip, speechSynthesis voices, Youdao audio loading) via
evaluate_js, prints them to stdout and exits.

Run: .venv/Scripts/python shell/selftest.py
"""
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


def _find_port() -> int:
    for port in range(BACKEND_PORT, BACKEND_PORT + 20):
        with socket.socket() as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return BACKEND_PORT


def log(msg: str) -> None:
    print(f"[selftest] {msg}", flush=True)


def run_checks() -> None:
    window = WINDOW
    log("waiting for page loaded event")
    window.events.loaded.wait(timeout=20)
    log("page loaded, sleeping 10s for async checks")
    time.sleep(10)  # selftest.html finishes async checks within ~7s
    log("reading results")
    html = window.evaluate_js("document.getElementById('results').innerHTML") or ""
    print("=== SELFTEST RESULTS ===", flush=True)
    print(html.replace("</li>", "</li>\n"), flush=True)
    log("destroying window")
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
        title="ReadFlow Self-Test",
        url=f"http://127.0.0.1:{port}/selftest",
        width=760,
        height=520,
    )
    webview.start(run_checks)


if __name__ == "__main__":
    main()
