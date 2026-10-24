from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.schemas import StatsResponse
import backend.app.crud as crud

router = APIRouter(prefix="/api/stats", tags=["Statistics"])


@router.get("", response_model=StatsResponse, summary="Get system statistics and status summary")
def get_stats(db: Session = Depends(get_db)):
    """
    Returns aggregate metrics including:
    - Total readings count
    - Flame detection events count
    - Active vs offline devices count
    - 24-hour trends
    - Real-time overall system status (ALERT / SAFE / OFFLINE / NO_DATA)
    """
    stats_data = crud.get_system_stats(
        db=db,
        offline_threshold_seconds=settings.DEVICE_OFFLINE_THRESHOLD_SECONDS
    )
    return stats_data
