# IoT Fire Detection System

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%208-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Hosting-Render-46E3B7?style=flat-square&logo=render)](https://render.com/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20DevKit%20V1-E7352C?style=flat-square&logo=espressif)](https://www.espressif.com/)

An end-to-end **IoT Fire Detection System** built for an MCA Capstone IoT project. It connects an **ESP32 DevKit V1** and an **infrared (IR) optical flame sensor** to a containerized **Python FastAPI** backend, stores telemetry in **PostgreSQL**, and displays live flame status, waveforms, and historical logs on a **React + Vite + Tailwind CSS** web dashboard.

The system is designed with fail-safe principles: local LED alerts react immediately even without internet access, and the web dashboard explicitly flags disconnected devices as **Offline** rather than treating missing readings as safe.

---

## Live Website

The application is deployed and hosted on **Render**:

- **Live Web Dashboard:** https://iot-fire-detection-dashboard.onrender.com
- **Backend REST API:** https://iot-fire-detection-backend.onrender.com
- **Interactive API Docs (Swagger UI):** https://iot-fire-detection-backend.onrender.com/docs
- **API Health Check:** https://iot-fire-detection-backend.onrender.com/health

> **Note on Render Free Tier:** The backend web service spins down after 15 minutes of inactivity. If the dashboard shows `API: Offline` on initial load, wait 30–50 seconds for the backend container to wake up and click **Refresh**.

---

## Features

### Hardware & ESP32 Firmware
- **Active-LOW IR Flame Sensing:** Reads digital sensor output on `GPIO27` (`0` / `LOW` = flame detected, `1` / `HIGH` = no flame).
- **Local Fail-Safe Indicators:** Immediately turns on the Red LED (`GPIO26`) and turns off the Green LED (`GPIO25`) when a flame is detected, even if Wi-Fi or the backend server is unavailable.
- **Non-Blocking Telemetry Transmission:** Polls the physical sensor every 100 ms, transmits immediately on state transitions, and sends periodic heartbeats over HTTP/HTTPS POST (every 4 seconds normally, or 1.5 seconds during an active flame event) along with Wi-Fi signal strength (`RSSI`).
- **Automatic Wi-Fi Reconnection:** Monitors Wi-Fi health and reconnects in the background without blocking sensor monitoring.

### Backend REST API & Database
- **API-Key Authentication:** Protects ingestion (`POST /api/readings`) and log deletion (`DELETE /api/readings`) routes using the `X-API-Key` header validated against `DEVICE_API_KEY`.
- **Automatic Device Registration:** Registers reporting ESP32 nodes in the `devices` table and tracks `last_seen_at` timestamps automatically.
- **Relational Persistence & Migrations:** Uses SQLAlchemy ORM and Alembic migrations with indexed queries across `devices` and `sensor_readings` (supporting PostgreSQL in production and SQLite for local development).
- **Rich Querying & Stats:** Provides paginated history (`GET /api/readings`) with filters for device ID, flame detection status, date range, and simulated vs. physical source, plus aggregate counters (`GET /api/stats`) and health checks (`GET /health`).

### Real-Time Web Dashboard
- **4-State Status Banner:** Clearly displays `FLAME DETECTED` (alert), `NO FLAME DETECTED` (safe), `SENSOR OFFLINE` (when no heartbeat arrives within 30 seconds), or `AWAITING TELEMETRY`.
- **Live Polling & Controls:** Polls the backend silently every 3 seconds (can be paused/resumed) with a manual **Refresh** button and live API connection indicator.
- **KPI Metric Cards:** Shows total telemetry packets, flame events triggered, normal (safe) packets, and online vs. total ESP32 nodes.
- **Waveform Visualization:** Plots recent flame/safe transitions over time using a stepped area chart (`Recharts`).
- **Registered Nodes Panel:** Displays each node's online/offline status, location, last-seen timestamp, latest `GPIO27` state, and Wi-Fi RSSI.
- **Telemetry Log & Safe Log Purge:** Paginated history table with filters (`All Statuses`, `Physical ESP32 Only` / `Simulated Only`, device ID search, and start/end date filters) plus an API-key-protected **Purge Logs** modal.

### Testing & Simulation Tools
- **Automated Test Suite:** Includes `pytest` tests for API endpoints, authentication, validation, pagination, database persistence, and offline fail-safe logic.
- **Virtual ESP32 Simulator & Cleanup CLI:** Includes `tests/simulate_device.py` (marks data with `is_simulated = true`) for hardware-free demonstrations and `tests/clear_history.py` to purge simulated or all logs.

---

## Technology Stack

| Layer | Technologies & Libraries |
|---|---|
| **Hardware & Firmware** | ESP32 DevKit V1, IR Flame Sensor Module (LM393), Arduino C++ (`WiFi.h`, `HTTPClient.h`, `WiFiClientSecure.h`) |
| **Frontend** | JavaScript (ES Modules), React 19 (`react`, `react-dom`), Vite 8 (`@vitejs/plugin-react`), Tailwind CSS v4 (`@tailwindcss/vite`), Recharts, Lucide React (`lucide-react`), Oxlint |
| **Backend** | Python 3.12, FastAPI, Uvicorn, SQLAlchemy, Alembic, Pydantic v2, `pydantic-settings`, `python-dotenv` |
| **Database** | PostgreSQL (`psycopg2-binary`) in production; SQLite for local development and unit tests |
| **Testing & CLI** | Pytest, `httpx`, `requests` |
| **Deployment** | Docker, Render (`render.yaml` Blueprint: Managed PostgreSQL, Docker Web Service, Static Site), Git & GitHub |

---

## Hardware Wiring (ESP32 DevKit V1)

| Component | Component Pin | ESP32 Pin | Notes |
|---|---|---|---|
| **IR Flame Sensor** | `VCC` | `3V3` | 3.3V power supply |
| **IR Flame Sensor** | `GND` | `GND` | Common ground |
| **IR Flame Sensor** | `DO` | `GPIO27` | Active-LOW digital output (`0` = Flame, `1` = Safe) |
| **Red Alert LED** | Anode (`+`) | `GPIO26` | Series `220Ω` resistor to LED; cathode to `GND` |
| **Green Safe LED** | Anode (`+`) | `GPIO25` | Series `220Ω` resistor to LED; cathode to `GND` |

> **Safety Note:** Do not connect an unrated two-terminal buzzer directly to an ESP32 GPIO pin, as inductive flyback spikes and excessive current draw can damage the microcontroller. See [docs/hardware_wiring.md](docs/hardware_wiring.md) for safe testing methods (e.g., using an IR TV remote).

---

## Installation & Setup (Local Development)

### Prerequisites
- **Python** 3.10+ and `pip`
- **Node.js** and `npm`
- **Arduino IDE** (only required if flashing a physical ESP32 board)

### 1. Clone the Repository
```bash
git clone https://github.com/Abhilash-KK/IOT_Fire_Detection_System.git
cd IOT_Fire_Detection_System
```

### 2. Configure Environment Variables
Create local `.env` files from the provided templates:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

**macOS / Linux:**
```bash
cp .env.example .env
cp frontend/.env.example frontend/.env
```

By default, `.env` uses a local SQLite database (`sqlite:///./fire_detection.db`) and `frontend/.env` points to `http://localhost:8000`. Update `DATABASE_URL` in `.env` if you want to connect to a local PostgreSQL instance.

### 3. Start the Backend Server
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Apply database migrations
python -m alembic upgrade head

# Start the FastAPI server (runs on http://localhost:8000)
python backend/run.py
```
Once running, interactive API documentation is available at `http://localhost:8000/docs`.

### 4. Start the Frontend Dashboard
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Run Automated Tests & Device Simulator
Open a third terminal in the project root:

```bash
# Run the automated test suite (11 tests)
python -m pytest tests/ -v
```

To simulate ESP32 readings locally without physical hardware (requires the `requests` library: `pip install requests`):
```bash
# Match the DEVICE_API_KEY in your .env file (default in .env.example is fire_detector_secret_key_change_me_in_production)
python tests/simulate_device.py --url http://127.0.0.1:8000 --api-key "<YOUR_DEVICE_API_KEY>" --trigger-safe
python tests/simulate_device.py --url http://127.0.0.1:8000 --api-key "<YOUR_DEVICE_API_KEY>" --trigger-flame

# Or stream continuous simulated readings every 3 seconds
python tests/simulate_device.py --url http://127.0.0.1:8000 --api-key "<YOUR_DEVICE_API_KEY>" --mode continuous
```

To clear simulated test logs from the database:
```bash
python tests/clear_history.py --url http://127.0.0.1:8000 --api-key "<YOUR_DEVICE_API_KEY>"
```

### 6. Flash the ESP32 Firmware (Optional Hardware Setup)
1. Open [esp32_firmware/esp32_fire_detection/esp32_fire_detection.ino](esp32_firmware/esp32_fire_detection/esp32_fire_detection.ino) in **Arduino IDE**.
2. Copy [esp32_firmware/config.h.example](esp32_firmware/config.h.example) to `esp32_firmware/esp32_fire_detection/config.h` and set your 2.4 GHz `WIFI_SSID`, `WIFI_PASSWORD`, `BACKEND_SERVER_URL`, and `DEVICE_API_KEY`.
3. Select board **DOIT ESP32 DEVKIT V1** (or **ESP32 Dev Module**), choose the COM port, and click **Upload**.
4. Open the **Serial Monitor** at `115200` baud to verify Wi-Fi connection and HTTP `201` telemetry responses.

For cloud deployment instructions using Docker and Render, see [docs/deployment_render_guide.md](docs/deployment_render_guide.md).

---

## Project Structure

```text
IOT_Fire_Detection_System/
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 1fb09a928148_create_devices_and_sensor_readings.py  # Initial schema migration
│   │   └── env.py                      # Alembic migration environment
│   ├── app/
│   │   ├── routers/
│   │   │   ├── devices.py              # GET /api/devices
│   │   │   ├── health.py               # GET /health (app & DB ping)
│   │   │   ├── readings.py             # POST, GET, DELETE /api/readings & /latest
│   │   │   └── stats.py                # GET /api/stats (counts & system status)
│   │   ├── config.py                   # Pydantic environment settings & DB URL normalization
│   │   ├── crud.py                     # SQLAlchemy database operations & online/offline logic
│   │   ├── database.py                 # SQLAlchemy engine & session dependency
│   │   ├── dependencies.py             # X-API-Key header validation
│   │   ├── main.py                     # FastAPI app initialization, CORS & routers
│   │   ├── models.py                   # Device & SensorReading ORM models
│   │   └── schemas.py                  # Pydantic request/response schemas
│   ├── alembic.ini                     # Container Alembic configuration
│   ├── requirements.txt                # Python package dependencies
│   └── run.py                          # Local Uvicorn entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DeviceList.jsx          # Registered ESP32 nodes & heartbeat status
│   │   │   ├── Header.jsx              # Navbar, API status pill, polling toggle & refresh
│   │   │   ├── MetricsCards.jsx        # Summary counters for packets, flames & nodes
│   │   │   ├── ReadingsTable.jsx       # Paginated log table, filters & Purge Logs modal
│   │   │   ├── StatusBanner.jsx        # 4-state status banner (ALERT / SAFE / OFFLINE / NO_DATA)
│   │   │   └── TelemetryChart.jsx      # Recharts stepped waveform chart
│   │   ├── App.jsx                     # Main dashboard layout & 3s polling loop
│   │   ├── api.js                      # Backend REST API client
│   │   ├── index.css                   # Tailwind CSS entry file
│   │   └── main.jsx                    # React root mount
│   ├── .env.example                    # Frontend environment template
│   ├── index.html                      # HTML entry template
│   ├── package.json                    # Frontend scripts & dependencies
│   └── vite.config.js                  # Vite + React + Tailwind configuration
├── esp32_firmware/
│   ├── esp32_fire_detection/
│   │   └── esp32_fire_detection.ino    # ESP32 Arduino sketch (GPIO25/26/27 & HTTP/HTTPS POST)
│   ├── config.h.example                # ESP32 Wi-Fi & server config template
│   └── README.md                       # Hardware flashing instructions
├── tests/
│   ├── clear_history.py                # CLI tool to purge simulated or all database logs
│   ├── simulate_device.py              # Virtual ESP32 simulator for hardware-free testing
│   ├── test_api.py                     # FastAPI endpoint & auth integration tests
│   └── test_database.py                # ORM, pagination & offline fail-safe unit tests
├── docs/
│   ├── api_documentation.md            # REST endpoint specs & sample payloads
│   ├── college_project_report.md       # MCA academic report outline & ER diagram
│   ├── deployment_render_guide.md      # Local setup & Render deployment walkthrough
│   ├── hardware_wiring.md              # BOM, GPIO table, buzzer safety & remote-test guide
│   └── system_architecture.md          # Architecture & sequence diagrams
├── .dockerignore                       # Docker build exclusions
├── .env.example                        # Backend environment template
├── .gitignore                          # Git exclusions (ignores .env, config.h, builds)
├── alembic.ini                         # Root Alembic configuration
├── Dockerfile                          # Production container running Alembic + Uvicorn
├── render.yaml                         # Render Blueprint (PostgreSQL + Backend + Static Site)
└── README.md                           # Project overview
```

---

## Screenshots

No screenshot image files are currently committed in this repository. You can view the live dashboard directly at **[https://iot-fire-detection-dashboard.onrender.com](https://iot-fire-detection-dashboard.onrender.com)**, which includes:

- **Top Status Banner:** Visualizes `CRITICAL FIRE WARNING` (red), `NO FLAME DETECTED` (green), or `SENSOR OFFLINE` (amber).
- **Real-Time Waveform & Node List:** Displays stepped flame-detection history alongside connected ESP32 node health and Wi-Fi RSSI.
- **Historical Telemetry Table:** Shows paginated packets tagged as `Physical ESP32` or `Simulated Test` with filtering and log purge controls.

---

## Documentation

Additional technical and academic guides are available in the `docs/` directory:

- [System Architecture & Sequence Flows](docs/system_architecture.md)
- [Hardware Wiring & Controlled Testing Guide](docs/hardware_wiring.md)
- [REST API Documentation](docs/api_documentation.md)
- [Render Deployment & Troubleshooting Guide](docs/deployment_render_guide.md)
- [MCA Project Report Outline](docs/college_project_report.md)

---

## Author

- **Abhilash**
- **GitHub:** [@Abhilash-KK](https://github.com/Abhilash-KK)
- **Email:** kkabhilash30@gmail.com
- **Repository:** [IOT_Fire_Detection_System](https://github.com/Abhilash-KK/IOT_Fire_Detection_System)
