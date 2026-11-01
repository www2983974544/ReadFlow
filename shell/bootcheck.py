"""P1 end-to-end boot check: shell window + built Vue app + stores over the API.

Run: .venv/Scripts/python shell/bootcheck.py
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


def run_checks() -> None:
    window = WINDOW
    window.events.loaded.wait(timeout=20)
    time.sleep(4)  # stores fetch in onMounted
    text = window.evaluate_js("document.body.innerText") or ""
    print("=== BOOTCHECK ===", flush=True)
    print(text, flush=True)
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
        title="ReadFlow Boot-Check",
        url=f"http://127.0.0.1:{port}/",
        width=800,
        height=500,
    )
    webview.start(run_checks)


if __name__ == "__main__":
    main()
