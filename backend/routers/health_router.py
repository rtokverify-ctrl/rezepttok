"""Health Check Router – Self-diagnostic endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
import time

from database import get_db, engine

router = APIRouter(tags=["Health"])

# Track app start time
_start_time = time.time()


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Self-diagnostic endpoint. Checks:
    - Database connectivity & latency
    - All expected tables exist
    - Storage mode
    - App uptime
    """
    checks = {}
    overall = "healthy"

    # ── 1. Database connectivity ─────────────────────────────────────
    try:
        start = time.time()
        db.execute(text("SELECT 1"))
        latency_ms = round((time.time() - start) * 1000, 2)

        inspector = inspect(engine)
        tables = inspector.get_table_names()

        checks["database"] = {
            "status": "ok",
            "tables_found": len(tables),
            "latency_ms": latency_ms
        }
    except Exception as e:
        checks["database"] = {"status": "error", "error": str(e)}
        overall = "unhealthy"

    # ── 2. Expected tables ───────────────────────────────────────────
    expected_tables = [
        "users", "recipes", "comments", "likes", "follows",
        "notifications", "saved_recipes", "collections",
        "shopping_list_items", "conversations", "messages"
    ]
    try:
        inspector = inspect(engine)
        existing = set(inspector.get_table_names())
        missing = [t for t in expected_tables if t not in existing]
        checks["tables_exist"] = {
            "status": "ok" if not missing else "warning",
            "expected": len(expected_tables),
            "found": len(expected_tables) - len(missing),
            "missing": missing
        }
        if missing:
            overall = "degraded"
    except Exception as e:
        checks["tables_exist"] = {"status": "error", "error": str(e)}

    # ── 3. Storage mode ──────────────────────────────────────────────
    try:
        from services.storage_manager import storage_manager
        checks["storage"] = {
            "status": "ok",
            "mode": storage_manager.mode
        }
    except Exception as e:
        checks["storage"] = {"status": "error", "error": str(e)}

    # ── 4. Mail service ──────────────────────────────────────────────
    try:
        from services.mail_manager import mail_manager
        checks["mail"] = {
            "status": "ok" if mail_manager.api_key else "warning",
            "configured": bool(mail_manager.api_key),
            "from": mail_manager.from_email
        }
    except Exception as e:
        checks["mail"] = {"status": "error", "error": str(e)}

    # ── 5. Uptime ────────────────────────────────────────────────────
    uptime = round(time.time() - _start_time, 1)

    return {
        "status": overall,
        "uptime_seconds": uptime,
        "checks": checks,
        "version": "1.0.0"
    }
