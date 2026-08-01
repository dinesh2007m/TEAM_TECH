from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.upload import router as upload_router
from app.routes.phishing import router as phishing_router
from app.routes.sandbox import router as sandbox_router
from app.routes.scans import router as scans_router
from app.routes.reports import router as reports_router
from app.routes.history import router as history_router
from app.routes.risk import router as risk_router
from app.routes.system import router as system_router

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan – runs once at startup and once at shutdown.

    Startup:
        1. Create / verify all SQLite tables.
        2. Seed 10 sample scans if the database is empty.
    """
    from app.database.init_db import init_db, seed_sample_scans
    from app.database.database import SessionLocal

    logger.info("TEAM_TECH backend starting up…")
    init_db()

    db = SessionLocal()
    try:
        seeded = seed_sample_scans(db)
        if seeded:
            logger.info("Seeded %d sample scan(s).", seeded)
    finally:
        db.close()

    yield  # application runs here

    logger.info("TEAM_TECH backend shutting down.")


app = FastAPI(
    title="TEAM_TECH Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api/v1")
app.include_router(phishing_router, prefix="/api/v1")
app.include_router(sandbox_router, prefix="/api/v1")
app.include_router(scans_router, prefix="/api/v1")
app.include_router(reports_router, prefix="/api/v1")
app.include_router(history_router, prefix="/api/v1")
app.include_router(risk_router, prefix="/api/v1")
app.include_router(system_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"message": "Backend is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}
