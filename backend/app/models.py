from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    func
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    device_name = Column(String(100), nullable=False, default="ESP32 Flame Detector")
    location = Column(String(100), nullable=True, default="Main Lab / Station 1")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_seen_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    readings = relationship(
        "SensorReading",
        back_populates="device",
        cascade="all, delete-orphan",
        order_by="desc(SensorReading.received_at)"
    )

    def __repr__(self):
        return f"<Device(device_id='{self.device_id}', name='{self.device_name}')>"


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(
        String(64),
        ForeignKey("devices.device_id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    sensor_value = Column(Integer, nullable=False)  # 0 = LOW (Flame), 1 = HIGH (No flame)
    flame_detected = Column(Boolean, nullable=False, index=True)
    rssi = Column(Integer, nullable=True)  # Wi-Fi RSSI in dBm
    recorded_at = Column(DateTime(timezone=True), nullable=True)  # Client timestamp
    received_at = Column(DateTime(timezone=True), server_default=func.now(), index=True, nullable=False)
    is_simulated = Column(Boolean, default=False, nullable=False, index=True)

    # Relationships
    device = relationship("Device", back_populates="readings")

    # Composite indexes for high-performance timestamp and device filtering
    __table_args__ = (
        Index("idx_device_received", "device_id", "received_at"),
        Index("idx_flame_received", "flame_detected", "received_at"),
    )

    def __repr__(self):
        return (
            f"<SensorReading(id={self.id}, device='{self.device_id}', "
            f"flame={self.flame_detected}, value={self.sensor_value})>"
        )
