from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.schemas import HealthResponse

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=HealthResponse)
def get_health_status(response: Response, db: Session = Depends(get_db)):
    """
    Health check endpoint returning application status, database connectivity,
    environment info, and timestamp.
    Used by Render health checks and container monitors.
    """
    now = datetime.now(timezone.utc)
    db_status = "disconnected"
    overall_status = "healthy"

    try:
        # Ping the database
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"disconnected: {str(exc)}"
        overall_status = "unhealthy"
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE

    return HealthResponse(
        status=overall_status,
        database=db_status,
        version=settings.APP_VERSION,
        timestamp=now,
        environment=settings.ENVIRONMENT
    )
