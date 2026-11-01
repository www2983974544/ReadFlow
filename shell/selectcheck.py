"""Verify text selection is enabled in the packaged window environment."""
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


def run_checks() -> None:
    window = WINDOW
    try:
        window.events.loaded.wait(timeout=20)
        time.sleep(2)
        user_select = window.evaluate_js("getComputedStyle(document.body).userSelect")
        # programmatic selection works regardless; the point is user-select style
        sel = window.evaluate_js(
            "(()=>{const r=document.createRange();"
            "const h=document.querySelector('h2');"
            "if(!h)return 'no-h2';r.selectNodeContents(h);"
            "const s=window.getSelection();s.removeAllRanges();s.addRange(r);"
            "return s.toString().length+';';})()"
        )
        print(f"body.userSelect = {user_select!r}", flush=True)
        print(f"selection length = {sel!r}", flush=True)
    finally:
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
        title="ReadFlow Select Check",
        url=f"http://127.0.0.1:{port}/",
        width=900,
        height=600,
        text_select=True,
    )
    webview.start(run_checks)


if __name__ == "__main__":
    main()
