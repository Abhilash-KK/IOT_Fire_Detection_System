import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.config import settings
from backend.app.database import Base, get_db
from backend.app.main import app
import backend.app.models as models

# Use StaticPool so all threads and requests share the same in-memory SQLite database
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


API_KEY_HEADER = {"X-API-Key": settings.DEVICE_API_KEY}


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "IoT Fire Detection System Backend"
    assert data["status"] == "operational"


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_submit_reading_unauthorized(client):
    payload = {
        "device_id": "ESP32_01",
        "sensor_value": 0,
        "flame_detected": True,
        "rssi": -65
    }
    # No header provided
    response = client.post("/api/readings", json=payload)
    assert response.status_code in (401, 422)

    # Wrong header provided
    response = client.post("/api/readings", json=payload, headers={"X-API-Key": "wrong_key"})
    assert response.status_code == 401
    assert "Invalid or missing" in response.json()["detail"]


def test_submit_reading_validation_error(client):
    # sensor_value must be 0 or 1
    invalid_payload = {
        "device_id": "ESP32_01",
        "sensor_value": 5,  # Invalid
        "flame_detected": True
    }
    response = client.post("/api/readings", json=invalid_payload, headers=API_KEY_HEADER)
    assert response.status_code == 422


def test_submit_and_retrieve_reading(client):
    payload = {
        "device_id": "ESP32_DEV_LAB",
        "sensor_value": 0,
        "flame_detected": True,
        "rssi": -62,
        "is_simulated": False
    }
    # Submit reading
    post_res = client.post("/api/readings", json=payload, headers=API_KEY_HEADER)
    assert post_res.status_code == 201, post_res.text
    data = post_res.json()
    assert data["device_id"] == "ESP32_DEV_LAB"
    assert data["sensor_value"] == 0
    assert data["flame_detected"] is True
    assert data["rssi"] == -62
    reading_id = data["id"]

    # Retrieve latest reading
    latest_res = client.get("/api/readings/latest")
    assert latest_res.status_code == 200
    latest_data = latest_res.json()
    assert latest_data["id"] == reading_id
    assert latest_data["flame_detected"] is True

    # Retrieve historical readings
    history_res = client.get("/api/readings?page=1&page_size=10")
    assert history_res.status_code == 200
    history_data = history_res.json()
    assert history_data["total"] == 1
    assert len(history_data["items"]) == 1


def test_device_auto_registration_and_status(client):
    payload = {
        "device_id": "ESP32_STATION_A",
        "sensor_value": 1,
        "flame_detected": False,
        "rssi": -70
    }
    res = client.post("/api/readings", json=payload, headers=API_KEY_HEADER)
    assert res.status_code == 201

    # Check devices endpoint
    dev_res = client.get("/api/devices")
    assert dev_res.status_code == 200
    devices = dev_res.json()
    assert len(devices) == 1
    assert devices[0]["device_id"] == "ESP32_STATION_A"
    assert devices[0]["is_online"] is True
    assert devices[0]["latest_reading"]["flame_detected"] is False


def test_system_stats(client):
    # Empty stats first
    empty_stats = client.get("/api/stats").json()
    assert empty_stats["total_readings"] == 0
    assert empty_stats["current_system_status"] == "NO_DATA"

    # Insert 1 safe reading
    client.post(
        "/api/readings",
        json={"device_id": "ESP32_01", "sensor_value": 1, "flame_detected": False},
        headers=API_KEY_HEADER
    )
    safe_stats = client.get("/api/stats").json()
    assert safe_stats["total_readings"] == 1
    assert safe_stats["flame_events"] == 0
    assert safe_stats["current_system_status"] == "SAFE"

    # Insert 1 flame reading
    client.post(
        "/api/readings",
        json={"device_id": "ESP32_01", "sensor_value": 0, "flame_detected": True},
        headers=API_KEY_HEADER
    )
    alert_stats = client.get("/api/stats").json()
    assert alert_stats["total_readings"] == 2
    assert alert_stats["flame_events"] == 1
    assert alert_stats["current_system_status"] == "ALERT"
