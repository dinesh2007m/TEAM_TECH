"""
routes/system.py
----------------
FastAPI router for System & Admin operations (health status, DB clear/refresh/export/import).
"""
import json
import logging
from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, File, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.crud import count_scans, list_scans, save_full_scan
from app.database.init_db import seed_sample_scans
from app.database.models import ScanRecord, IndicatorRecord, AttachmentRecord, ReportRecord

logger = logging.getLogger("app.routes.system")

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/status", summary="Get backend system health and database statistics")
def get_system_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        scans_count = count_scans(db)
        return {
            "status": "online",
            "backend_version": "1.0.0",
            "build_version": "2026.08.01",
            "database": {
                "type": "SQLite",
                "connected": True,
                "total_scans": scans_count,
            },
            "developer_team": "TEAM_TECH AEGISX Engineering",
        }
    except Exception as e:
        logger.error("Database connection error in system status: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database check failed: {str(e)}",
        )


@router.delete("/clear-history", summary="Clear all scan history from database")
def clear_scan_history(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        db.query(ReportRecord).delete()
        db.query(AttachmentRecord).delete()
        db.query(IndicatorRecord).delete()
        db.query(ScanRecord).delete()
        db.commit()
        logger.info("Cleared all scan history from database.")
        return {"status": "success", "message": "All scan history records deleted."}
    except Exception as e:
        db.rollback()
        logger.error("Failed to clear scan history: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear history: {str(e)}",
        )


@router.post("/db/refresh", summary="Refresh database and seed sample scans")
def refresh_database(db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        # Clear existing scans first
        db.query(ReportRecord).delete()
        db.query(AttachmentRecord).delete()
        db.query(IndicatorRecord).delete()
        db.query(ScanRecord).delete()
        db.commit()

        # Seed sample scans
        seeded_count = seed_sample_scans(db)
        logger.info("Database refreshed and seeded with %d sample scans.", seeded_count)
        return {
            "status": "success",
            "message": f"Database refreshed. Seeded {seeded_count} sample scans.",
            "seeded_count": seeded_count,
        }
    except Exception as e:
        db.rollback()
        logger.error("Failed to refresh database: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh database: {str(e)}",
        )


@router.get("/db/export", summary="Export full database as JSON file")
def export_database(db: Session = Depends(get_db)) -> Response:
    scans = list_scans(db, limit=1000)
    export_data = []
    for scan in scans:
        export_data.append({
            "scan_id": scan.scan_id,
            "created_at": scan.created_at.isoformat() if scan.created_at else None,
            "sender": scan.sender,
            "receiver": scan.receiver,
            "subject": scan.subject,
            "risk_score": scan.risk_score,
            "risk_level": scan.risk_level,
            "summary": scan.summary,
            "recommendation": scan.recommendation,
            "indicators": [
                {
                    "name": i.name,
                    "severity": i.severity,
                    "reason": i.reason,
                    "source": i.source,
                }
                for i in scan.indicators
            ],
            "attachments": [
                {
                    "filename": a.filename,
                    "sha256": a.sha256,
                    "mime_type": a.mime_type,
                    "entropy": a.entropy,
                    "size": a.size,
                    "risk": a.risk,
                }
                for a in scan.attachments
            ],
        })

    json_bytes = json.dumps({"version": "1.0.0", "scans": export_data}, indent=2, default=str).encode("utf-8")
    return Response(
        content=json_bytes,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="aegisx_database_backup.json"'},
    )


@router.post("/db/import", summary="Import scans from JSON backup file")
async def import_database(file: UploadFile = File(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
        scans_data = data.get("scans", []) if isinstance(data, dict) else data if isinstance(data, list) else []

        imported_count = 0
        for s in scans_data:
            scan_id = s.get("scan_id")
            if not scan_id:
                continue
            save_full_scan(
                db,
                scan_id=scan_id,
                sender=s.get("sender"),
                receiver=s.get("receiver"),
                subject=s.get("subject"),
                risk_score=s.get("risk_score", 0),
                risk_level=s.get("risk_level", "Low"),
                recommendation=s.get("recommendation"),
                summary=s.get("summary"),
                phishing_indicators=[i for i in s.get("indicators", []) if i.get("source") == "phishing" or not i.get("source")],
                sandbox_indicators=[i for i in s.get("indicators", []) if i.get("source") == "sandbox"],
                attachments=s.get("attachments", []),
                json_report=s,
            )
            imported_count += 1

        db.commit()
        return {
            "status": "success",
            "message": f"Successfully imported {imported_count} scan records.",
            "imported_count": imported_count,
        }
    except Exception as e:
        db.rollback()
        logger.error("Import database error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to import database: {str(e)}",
        )
