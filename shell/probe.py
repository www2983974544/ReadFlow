"""Minimal probe: reproduce the evaluate_js failure with full error detail."""
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
from webview.errors import JavascriptException  # noqa: E402

from backend.app.config import BACKEND_PORT  # noqa: E402

WINDOW = None

EXPR = "(()=>{const e=document.getElementById('viewHome');if(!e)return 'no-element';const r=e.getBoundingClientRect();return (r.height>10&&r.width>10)+';';})()"


def run() -> None:
    window = WINDOW
    try:
        window.events.loaded.wait(timeout=20)
        time.sleep(3)
        try:
            out = window.evaluate_js(EXPR)
            print("OK:", repr(out), flush=True)
        except JavascriptException as exc:
            print("JavascriptException args:", repr(exc.args), flush=True)
            if exc.args and isinstance(exc.args[0], dict):
                print("stack:", exc.args[0].get("stack"), flush=True)
        # also test the simple expression that reportedly works
        try:
            out2 = window.evaluate_js("!!document.getElementById('cosmosStarfieldCanvas')")
            print("simple bool OK:", repr(out2), flush=True)
        except JavascriptException as exc:
            print("simple bool FAILED:", repr(exc.args), flush=True)
    finally:
        window.destroy()


def main() -> None:
    global WINDOW
    for port in range(BACKEND_PORT, BACKEND_PORT + 20):
        with socket.socket() as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                break
    from backend.app.main import app

    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning"))
    threading.Thread(target=server.run, daemon=True).start()
    for _ in range(100):
        try:
            urllib.request.urlopen(f"http://127.0.0.1:{port}/api/ping", timeout=0.3)
            break
        except Exception:
            time.sleep(0.1)

    WINDOW = webview.create_window("probe", f"http://127.0.0.1:{port}/", width=800, height=600)
    webview.start(run)


if __name__ == "__main__":
    main()
