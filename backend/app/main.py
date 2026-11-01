"""ReadFlow FastAPI application: /api routers + static hosting of the built frontend."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles

from .config import FRONTEND_DIST
from .db import SessionLocal, init_db
from .news import seed_crawl_sources
from .routers import articles, crawl, settings, stats, vocab
from .seed import seed_if_empty
from .selftest_page import SELFTEST_HTML


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_if_empty(db)
        seed_crawl_sources(db)
    finally:
        db.close()
    yield


app = FastAPI(title="ReadFlow", docs_url=None, redoc_url=None, lifespan=lifespan)
app.include_router(articles.router)
app.include_router(vocab.router)
app.include_router(stats.router)
app.include_router(settings.router)
app.include_router(crawl.router)


@app.get("/api/ping")
def ping() -> dict:
    return {"ok": True, "service": "readflow-backend"}


@app.get("/selftest", response_class=HTMLResponse)
def selftest():
    return SELFTEST_HTML


if (FRONTEND_DIST / "index.html").is_file():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}")
    def spa(path: str):
        candidate = (FRONTEND_DIST / path).resolve()
        if path and candidate.is_file() and str(candidate).startswith(str(FRONTEND_DIST)):
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/", response_class=HTMLResponse)
    def dev_index():
        return SELFTEST_HTML
