from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db

router = APIRouter(prefix="/healthcheck", tags=["System"])

@router.get("/")
def healthcheck(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "db_connected": True}
    except Exception as e:
        return {"status": "error", "db_connected": False, "detail": str(e)}
