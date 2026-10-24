from datetime import datetime, timezone, timedelta
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from backend.app.models import Device, SensorReading
from backend.app.schemas import ReadingCreate


def get_or_create_device(
    db: Session,
    device_id: str,
    device_name: str = "ESP32 Flame Detector",
    location: str = "Main Lab / Station 1"
) -> Device:
    """Ensure device is registered; updates last_seen_at."""
    device = db.query(Device).filter(Device.device_id == device_id).first()
    now_utc = datetime.now(timezone.utc)
    if not device:
        device = Device(
            device_id=device_id,
            device_name=device_name,
            location=location,
            created_at=now_utc,
            last_seen_at=now_utc,
            is_active=True
        )
        db.add(device)
        db.commit()
        db.refresh(device)
    else:
        device.last_seen_at = now_utc
        db.commit()
        db.refresh(device)
    return device


def create_sensor_reading(db: Session, reading_in: ReadingCreate) -> SensorReading:
    """Persist a new sensor reading and update device's last-seen timestamp."""
    # Ensure device exists and update its last_seen_at
    get_or_create_device(db, device_id=reading_in.device_id)

    db_reading = SensorReading(
        device_id=reading_in.device_id,
        sensor_value=reading_in.sensor_value,
        flame_detected=reading_in.flame_detected,
        rssi=reading_in.rssi,
        recorded_at=reading_in.recorded_at,
        received_at=datetime.now(timezone.utc),
        is_simulated=reading_in.is_simulated
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)
    return db_reading


def get_latest_reading(db: Session, device_id: Optional[str] = None) -> Optional[SensorReading]:
    """Retrieve the most recent reading across all devices or for a specific device."""
    query = db.query(SensorReading)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)
    return query.order_by(desc(SensorReading.received_at)).first()


def get_paginated_readings(
    db: Session,
    page: int = 1,
    page_size: int = 20,
    device_id: Optional[str] = None,
    flame_detected: Optional[bool] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    include_simulated: bool = True
) -> Tuple[List[SensorReading], int]:
    """Retrieve historical readings with pagination and multi-criteria filtering."""
    query = db.query(SensorReading)

    if device_id:
        query = query.filter(SensorReading.device_id == device_id)

    if flame_detected is not None:
        query = query.filter(SensorReading.flame_detected == flame_detected)

    if not include_simulated:
        query = query.filter(SensorReading.is_simulated.is_(False))

    if start_date:
        query = query.filter(SensorReading.received_at >= start_date)

    if end_date:
        query = query.filter(SensorReading.received_at <= end_date)

    total = query.count()
    items = (
        query.order_by(desc(SensorReading.received_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return items, total


def get_all_devices(db: Session, offline_threshold_seconds: int = 30) -> List[dict]:
    """List all registered devices with their calculated online status and latest reading."""
    devices = db.query(Device).order_by(desc(Device.last_seen_at)).all()
    now_utc = datetime.now(timezone.utc)
    result = []

    for d in devices:
        # Calculate time difference
        last_seen = d.last_seen_at
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        
        diff_seconds = int((now_utc - last_seen).total_seconds())
        is_online = diff_seconds <= offline_threshold_seconds

        latest_reading = (
            db.query(SensorReading)
            .filter(SensorReading.device_id == d.device_id)
            .order_by(desc(SensorReading.received_at))
            .first()
        )

        result.append({
            "id": d.id,
            "device_id": d.device_id,
            "device_name": d.device_name,
            "location": d.location,
            "created_at": d.created_at,
            "last_seen_at": d.last_seen_at,
            "is_active": d.is_active,
            "is_online": is_online,
            "seconds_since_last_seen": max(0, diff_seconds),
            "latest_reading": latest_reading
        })

    return result


def get_system_stats(db: Session, offline_threshold_seconds: int = 30) -> dict:
    """Compute aggregate counts, 24-hour trends, and overall system status."""
    total_readings = db.query(SensorReading).count()
    flame_events = db.query(SensorReading).filter(SensorReading.flame_detected.is_(True)).count()
    normal_events = total_readings - flame_events

    now_utc = datetime.now(timezone.utc)
    since_24h = now_utc - timedelta(hours=24)

    recent_readings_24h = (
        db.query(SensorReading)
        .filter(SensorReading.received_at >= since_24h)
        .count()
    )
    flame_events_24h = (
        db.query(SensorReading)
        .filter(SensorReading.flame_detected.is_(True), SensorReading.received_at >= since_24h)
        .count()
    )

    devices = db.query(Device).all()
    total_devices = len(devices)

    active_online_count = 0
    for d in devices:
        last_seen = d.last_seen_at
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        if (now_utc - last_seen).total_seconds() <= offline_threshold_seconds:
            active_online_count += 1

    latest_reading = get_latest_reading(db)
    last_reading_time = latest_reading.received_at if latest_reading else None

    # Compute overall status:
    # 1. If no readings exist: "NO_DATA"
    # 2. If no active online device: "OFFLINE"
    # 3. If latest reading has flame_detected: "ALERT"
    # 4. Otherwise: "SAFE"
    if not latest_reading:
        system_status = "NO_DATA"
    elif active_online_count == 0:
        system_status = "OFFLINE"
    elif latest_reading.flame_detected:
        system_status = "ALERT"
    else:
        system_status = "SAFE"

    return {
        "total_readings": total_readings,
        "flame_events": flame_events,
        "normal_events": normal_events,
        "total_devices": total_devices,
        "active_devices_online": active_online_count,
        "last_reading_time": last_reading_time,
        "current_system_status": system_status,
        "recent_readings_24h": recent_readings_24h,
        "flame_events_24h": flame_events_24h,
        "offline_threshold_seconds": offline_threshold_seconds
    }
