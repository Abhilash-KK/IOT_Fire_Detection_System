from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.schemas import ReadingCreate, ReadingResponse, PaginatedReadings
from backend.app.dependencies import verify_device_api_key
import backend.app.crud as crud

router = APIRouter(prefix="/api/readings", tags=["Readings"])


@router.post(
    "",
    response_model=ReadingResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Accept and store ESP32 readings",
    description="Secured by X-API-Key header. Automatically links reading to registered device."
)
def submit_reading(
    reading_in: ReadingCreate,
    db: Session = Depends(get_db),
    _api_key: str = Depends(verify_device_api_key)
):
    try:
        new_reading = crud.create_sensor_reading(db=db, reading_in=reading_in)
        return new_reading
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to record sensor reading: {str(exc)}"
        )


@router.get(
    "/latest",
    response_model=ReadingResponse,
    summary="Get the most recent reading",
    description="Returns the newest sensor reading, optionally filtered by device ID."
)
def get_latest_reading(
    device_id: Optional[str] = Query(None, description="Optional device ID filter"),
    db: Session = Depends(get_db)
):
    reading = crud.get_latest_reading(db=db, device_id=device_id)
    if not reading:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No sensor readings found."
        )
    return reading


@router.get(
    "",
    response_model=PaginatedReadings,
    summary="Get paginated historical readings",
    description="Retrieve readings with pagination and optional filters (device, flame status, dates)."
)
def get_historical_readings(
    page: int = Query(1, ge=1, description="Page number starting at 1"),
    page_size: int = Query(20, ge=1, le=200, description="Items per page (max 200)"),
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    flame_detected: Optional[bool] = Query(None, description="Filter by flame detection status"),
    start_date: Optional[datetime] = Query(None, description="Filter from timestamp (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="Filter until timestamp (ISO format)"),
    include_simulated: bool = Query(True, description="Include simulated test readings"),
    db: Session = Depends(get_db)
):
    items, total = crud.get_paginated_readings(
        db=db,
        page=page,
        page_size=page_size,
        device_id=device_id,
        flame_detected=flame_detected,
        start_date=start_date,
        end_date=end_date,
        include_simulated=include_simulated
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return PaginatedReadings(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )



@router.delete(
    "",
    status_code=status.HTTP_200_OK,
    summary="Safely purge unwanted history logs (Secured with X-API-Key)",
    description="Purges simulated test logs or resets history. Protected by X-API-Key."
)
def delete_historical_readings(
    simulated_only: bool = Query(True, description="Delete only simulated test records"),
    device_id: Optional[str] = Query(None, description="Optional: Delete by device ID"),
    delete_all: bool = Query(False, description="Reset entire history (all devices)"),
    db: Session = Depends(get_db),
    _api_key: str = Depends(verify_device_api_key)
):
    try:
        deleted = crud.delete_sensor_readings(
            db=db,
            simulated_only=simulated_only,
            device_id=device_id,
            delete_all=delete_all
        )
        return {
            "status": "success",
            "deleted_count": deleted,
            "message": f"Successfully deleted {deleted} records from the database."
        }
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete records: {str(exc)}"
        )
