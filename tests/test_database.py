import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base
from backend.app.models import Device, SensorReading
from backend.app.schemas import ReadingCreate
import backend.app.crud as crud

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    session = Session()
    try:
        yield session
    finally:
        session.close()


def test_device_auto_creation_and_last_seen(db):
    dev1 = crud.get_or_create_device(db, device_id="TEST_ESP32_01", device_name="Lab Sensor 1")
    assert dev1.id is not None
    assert dev1.device_id == "TEST_ESP32_01"
    initial_last_seen = dev1.last_seen_at

    # Call again: should retrieve existing device and update last_seen_at
    dev2 = crud.get_or_create_device(db, device_id="TEST_ESP32_01")
    assert dev2.id == dev1.id
    assert dev2.last_seen_at >= initial_last_seen


def test_sensor_reading_creation_and_query(db):
    reading_data = ReadingCreate(
        device_id="TEST_ESP32_02",
        sensor_value=0,
        flame_detected=True,
        rssi=-58,
        is_simulated=True
    )
    reading = crud.create_sensor_reading(db, reading_data)
    assert reading.id is not None
    assert reading.sensor_value == 0
    assert reading.flame_detected is True
    assert reading.rssi == -58
    assert reading.is_simulated is True

    # Check that device was automatically registered
    device = db.query(Device).filter(Device.device_id == "TEST_ESP32_02").first()
    assert device is not None
    assert device.device_id == "TEST_ESP32_02"

    # Query latest reading
    latest = crud.get_latest_reading(db)
    assert latest.id == reading.id


def test_pagination_and_filtering(db):
    now = datetime.now(timezone.utc)
    # Insert 10 safe readings and 5 flame readings
    for i in range(10):
        crud.create_sensor_reading(
            db,
            ReadingCreate(
                device_id="DEV_A",
                sensor_value=1,
                flame_detected=False,
                rssi=-60,
                is_simulated=False
            )
        )
    for i in range(5):
        crud.create_sensor_reading(
            db,
            ReadingCreate(
                device_id="DEV_B",
                sensor_value=0,
                flame_detected=True,
                rssi=-65,
                is_simulated=True
            )
        )

    # Test total pagination
    items, total = crud.get_paginated_readings(db, page=1, page_size=10)
    assert total == 15
    assert len(items) == 10

    # Test flame filter
    flame_items, flame_total = crud.get_paginated_readings(db, page=1, page_size=20, flame_detected=True)
    assert flame_total == 5
    assert all(r.flame_detected is True for r in flame_items)

    # Test device filter
    dev_b_items, dev_b_total = crud.get_paginated_readings(db, page=1, page_size=20, device_id="DEV_B")
    assert dev_b_total == 5
    assert all(r.device_id == "DEV_B" for r in dev_b_items)


def test_system_stats_offline_logic(db):
    # Register an old device seen 60 seconds ago
    old_time = datetime.now(timezone.utc) - timedelta(seconds=60)
    old_dev = Device(
        device_id="ESP32_STALE",
        device_name="Stale Unit",
        created_at=old_time,
        last_seen_at=old_time,
        is_active=True
    )
    db.add(old_dev)
    db.commit()

    # Add reading from this stale device
    reading = SensorReading(
        device_id="ESP32_STALE",
        sensor_value=1,
        flame_detected=False,
        received_at=old_time,
        is_simulated=False
    )
    db.add(reading)
    db.commit()

    # With 30s threshold, the system status must be OFFLINE, NOT SAFE!
    # "Distinguish clearly between a disconnected device and a device reporting no flame.
    #  Do not treat missing readings as a safe condition."
    stats = crud.get_system_stats(db, offline_threshold_seconds=30)
    assert stats["total_readings"] == 1
    assert stats["active_devices_online"] == 0
    assert stats["current_system_status"] == "OFFLINE"
