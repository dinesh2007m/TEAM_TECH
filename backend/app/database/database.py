"""
database/database.py
--------------------
SQLAlchemy 2.x engine, session factory, and dependency-injection helper.

The database file is created automatically inside  backend/  as
``team_tech.db`` the first time the application starts.

Usage inside a FastAPI route (dependency injection):
    from app.database.database import get_db
    from sqlalchemy.orm import Session

    def my_route(db: Session = Depends(get_db)):
        ...
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

logger = logging.getLogger("app.database")

# ─── Paths ────────────────────────────────────────────────────────────────────
# backend/ lives two levels above this file  (backend/app/database/database.py)
_BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
DB_PATH: Path = _BACKEND_DIR / "team_tech.db"
DATABASE_URL: str = f"sqlite:///{DB_PATH}"

logger.info("SQLite database path: %s", DB_PATH)

# ─── Engine ───────────────────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    # SQLite requires this pragma to honour foreign-key constraints
    connect_args={"check_same_thread": False},
    # Echo SQL to the log at DEBUG level only
    echo=False,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, _connection_record) -> None:  # noqa: ANN001
    """Enable WAL mode and foreign-key enforcement on every new connection."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("PRAGMA journal_mode = WAL")   # better concurrent read/write
    cursor.close()


# ─── Session factory ──────────────────────────────────────────────────────────
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,   # safe for async / background usage
)


# ─── Declarative base ─────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""


# ─── FastAPI dependency ───────────────────────────────────────────────────────
def get_db() -> Generator[Session, None, None]:
    """
    Yield a database session for use as a FastAPI dependency.

    The session is always closed – even on exception – via the finally block.

    Example::

        from app.database.database import get_db
        from fastapi import Depends
        from sqlalchemy.orm import Session

        @router.get("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db: Session = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
