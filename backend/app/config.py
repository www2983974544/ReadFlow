"""ReadFlow backend configuration."""
import os
import sys
from pathlib import Path

BACKEND_PORT = int(os.environ.get("READFLOW_PORT", "17878"))

# User data root: %APPDATA%/ReadFlow (override with READFLOW_DATA_DIR, used by tests/dev).
_DATA_DIR = os.environ.get("READFLOW_DATA_DIR") or os.path.join(
    os.environ.get("APPDATA") or str(Path.home()), "ReadFlow"
)
DATA_DIR = Path(_DATA_DIR)
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "readflow.db"

# Packaged (PyInstaller) mode serves the frontend from the bundle (--add-data
# "frontend/dist;frontend_dist"); dev mode from the Vite build output on disk.
if getattr(sys, "frozen", False):
    FRONTEND_DIST = Path(getattr(sys, "_MEIPASS")) / "frontend_dist"
else:
    FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"
