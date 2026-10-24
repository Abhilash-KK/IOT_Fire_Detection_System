from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.config import settings
from backend.app.schemas import DeviceResponse
import backend.app.crud as crud

router = APIRouter(prefix="/api/devices", tags=["Devices"])


@router.get("", response_model=List[DeviceResponse], summary="List all registered devices")
def get_devices(db: Session = Depends(get_db)):
    """
    Returns registered devices with dynamic online/offline status based on
    the configured DEVICE_OFFLINE_THRESHOLD_SECONDS, along with each device's
    latest reading.
    """
    return crud.get_all_devices(
        db=db,
        offline_threshold_seconds=settings.DEVICE_OFFLINE_THRESHOLD_SECONDS
    )
