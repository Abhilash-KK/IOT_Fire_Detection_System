from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict


class ReadingCreate(BaseModel):
    device_id: str = Field(..., min_length=1, max_length=64, description="Unique identifier of reporting ESP32 device")
    sensor_value: int = Field(..., ge=0, le=1, description="Digital reading: 0 (LOW) or 1 (HIGH)")
    flame_detected: bool = Field(..., description="Boolean indicating if flame is detected")
    rssi: Optional[int] = Field(default=None, ge=-130, le=0, description="Wi-Fi signal strength in dBm")
    recorded_at: Optional[datetime] = Field(default=None, description="Client-side timestamp if device has RTC/NTP")
    is_simulated: bool = Field(default=False, description="Flag indicating simulated test data vs physical sensor")

    @field_validator("device_id")
    @classmethod
    def clean_device_id(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("device_id cannot be empty or blank")
        return cleaned


class ReadingResponse(BaseModel):
    id: int
    device_id: str
    sensor_value: int
    flame_detected: bool
    rssi: Optional[int] = None
    recorded_at: Optional[datetime] = None
    received_at: datetime
    is_simulated: bool

    model_config = ConfigDict(from_attributes=True)


class PaginatedReadings(BaseModel):
    items: List[ReadingResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DeviceBase(BaseModel):
    device_id: str
    device_name: str = "ESP32 Flame Detector"
    location: Optional[str] = "Main Lab / Station 1"


class DeviceResponse(DeviceBase):
    id: int
    created_at: datetime
    last_seen_at: datetime
    is_active: bool
    is_online: bool
    seconds_since_last_seen: Optional[int] = None
    latest_reading: Optional[ReadingResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StatsResponse(BaseModel):
    total_readings: int
    flame_events: int
    normal_events: int
    total_devices: int
    active_devices_online: int
    last_reading_time: Optional[datetime] = None
    current_system_status: str  # "ALERT", "SAFE", "OFFLINE", "NO_DATA"
    recent_readings_24h: int
    flame_events_24h: int
    offline_threshold_seconds: int


class HealthResponse(BaseModel):
    status: str  # "healthy", "degraded", "unhealthy"
    database: str  # "connected", "disconnected"
    version: str
    timestamp: datetime
    environment: str
