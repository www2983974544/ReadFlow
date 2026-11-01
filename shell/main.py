"""ReadFlow desktop shell: boots the local FastAPI backend, then opens the app window.

Run (dev):    .venv/Scripts/python shell/main.py
Package:      pyinstaller --name ReadFlow (see scripts/build_exe)
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


def _find_port() -> int:
    for port in range(BACKEND_PORT, BACKEND_PORT + 20):
        with socket.socket() as sock:
            if sock.connect_ex(("127.0.0.1", port)) != 0:
                return port
    return BACKEND_PORT


def main() -> None:
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

    data_dir = os.path.join(
        os.environ.get("APPDATA") or os.path.expanduser("~"), "ReadFlow"
    )
    os.makedirs(data_dir, exist_ok=True)

    webview.create_window(
        title="ReadFlow",
        url=f"http://127.0.0.1:{port}/",
        width=1440,
        height=900,
        min_size=(980, 640),
        text_select=True,  # pywebview 默认全局禁选文字；开启后 UI 文字可选中/复制
    )
    # private_mode=False keeps WebView2 localStorage/cookies across restarts.
    webview.start(private_mode=False, storage_path=os.path.join(data_dir, "webview"))


if __name__ == "__main__":
    main()
