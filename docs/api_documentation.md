# REST API Documentation — IoT Fire Detection System

The backend is built with **Python FastAPI** and automatically serves interactive Swagger UI documentation at `/docs` and ReDoc at `/redoc`.

---

## 1. Authentication & Security

Device telemetry ingestion (`POST /api/readings`) is protected using header-based API key validation:

- **Header Name**: `X-API-Key`
- **Configuration**: Defined by the `DEVICE_API_KEY` environment variable in the backend `.env` file.
- **Unauthorized Request**: Returns `401 Unauthorized` with `{"detail": "Invalid or missing X-API-Key header."}`.

---

## 2. API Endpoints Reference

### 2.1 Root Service Metadata
- **Endpoint**: `GET /`
- **Description**: Returns basic service information, version, and primary endpoint URLs.
- **Response `200 OK`**:
```json
{
  "service": "IoT Fire Detection System Backend",
  "version": "1.0.0",
  "environment": "development",
  "status": "operational",
  "documentation": "/docs",
  "endpoints": {
    "health": "/health",
    "ingest_reading": "POST /api/readings",
    "latest_reading": "GET /api/readings/latest",
    "historical_readings": "GET /api/readings",
    "system_statistics": "GET /api/stats",
    "registered_devices": "GET /api/devices"
  }
}
```

---

### 2.2 Health Check
- **Endpoint**: `GET /health`
- **Description**: Verifies container and database connectivity. Used by Render and Docker health probes.
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0",
  "timestamp": "2026-10-24T18:01:21.471395Z",
  "environment": "production"
}
```
- **Response `503 Service Unavailable`** (if database connection fails):
```json
{
  "status": "unhealthy",
  "database": "disconnected: <error details>",
  "version": "1.0.0",
  "timestamp": "2026-10-24T18:01:21.471395Z",
  "environment": "production"
}
```

---

### 2.3 Ingest Sensor Reading
- **Endpoint**: `POST /api/readings`
- **Headers**:
  - `Content-Type: application/json`
  - `X-API-Key: <DEVICE_API_KEY>`
- **Request Body**:
```json
{
  "device_id": "ESP32_FLAME_01",
  "sensor_value": 0,
  "flame_detected": true,
  "rssi": -65,
  "recorded_at": "2026-10-24T18:01:20.000Z",
  "is_simulated": false
}
```
- **Response `201 Created`**:
```json
{
  "id": 14,
  "device_id": "ESP32_FLAME_01",
  "sensor_value": 0,
  "flame_detected": true,
  "rssi": -65,
  "recorded_at": "2026-10-24T18:01:20Z",
  "received_at": "2026-10-24T18:01:21.471395Z",
  "is_simulated": false
}
```

---

### 2.4 Latest Reading
- **Endpoint**: `GET /api/readings/latest`
- **Query Parameters**:
  - `device_id` (optional, string): Filter latest reading for a specific device.
- **Response `200 OK`**: Returns the most recent reading record.
- **Response `404 Not Found`**: Returned if the database contains zero readings.

---

### 2.5 Historical Readings (Paginated)
- **Endpoint**: `GET /api/readings`
- **Query Parameters**:
  - `page` (integer, default: 1): Page number.
  - `page_size` (integer, default: 20, max: 200): Items per page.
  - `device_id` (optional, string): Filter by reporting device.
  - `flame_detected` (optional, boolean): `true` or `false`.
  - `start_date` (optional, ISO datetime string): Filter from timestamp.
  - `end_date` (optional, ISO datetime string): Filter until timestamp.
  - `include_simulated` (boolean, default: true): Include or exclude simulated records.
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": 14,
      "device_id": "ESP32_FLAME_01",
      "sensor_value": 0,
      "flame_detected": true,
      "rssi": -65,
      "recorded_at": "2026-10-24T18:01:20Z",
      "received_at": "2026-10-24T18:01:21.471395Z",
      "is_simulated": false
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 20,
  "total_pages": 1
}
```

---

### 2.6 System Statistics & Status
- **Endpoint**: `GET /api/stats`
- **Description**: Returns aggregate event counts, 24-hour trends, and real-time status summary.
- **Response `200 OK`**:
```json
{
  "total_readings": 150,
  "flame_events": 12,
  "normal_events": 138,
  "total_devices": 2,
  "active_devices_online": 2,
  "last_reading_time": "2026-10-24T18:01:21.471395Z",
  "current_system_status": "ALERT",
  "recent_readings_24h": 150,
  "flame_events_24h": 12,
  "offline_threshold_seconds": 30
}
```

---

### 2.7 Registered Devices
- **Endpoint**: `GET /api/devices`
- **Description**: Lists all registered nodes with their dynamically calculated online/offline status and latest reading.
- **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "device_id": "ESP32_FLAME_01",
    "device_name": "ESP32 Flame Detector",
    "location": "Main Lab / Station 1",
    "created_at": "2026-10-24T17:30:00Z",
    "last_seen_at": "2026-10-24T18:01:21Z",
    "is_active": true,
    "is_online": true,
    "seconds_since_last_seen": 2,
    "latest_reading": {
      "id": 14,
      "device_id": "ESP32_FLAME_01",
      "sensor_value": 0,
      "flame_detected": true,
      "rssi": -65,
      "recorded_at": "2026-10-24T18:01:20Z",
      "received_at": "2026-10-24T18:01:21Z",
      "is_simulated": false
    }
  }
]
```
