# IoT Fire Detection System — Full-Stack Web Application

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Container-Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Render](https://img.shields.io/badge/Hosting-Render-46E3B7?style=flat-square&logo=render)](https://render.com/)
[![ESP32](https://img.shields.io/badge/Hardware-ESP32%20DevKit%20V1-E7352C?style=flat-square&logo=espressif)](https://www.espressif.com/)

A complete, production-ready MCA IoT capstone project implementing an intelligent, end-to-end fire detection and monitoring system. Features an **ESP32 DevKit V1** and an **IR optical flame sensor** transmitting active-LOW telemetry over Wi-Fi/HTTP to a containerized **FastAPI** backend, persisting records in **PostgreSQL**, and rendering live status on a **React dashboard**.

---

## 🌟 Key Features

- **Real-Time Flame Detection**: Active-LOW optical infrared flame sensing with sub-10ms local hardware visual indicators (GPIO26 Red Alert LED, GPIO25 Green Safe LED).
- **FastAPI REST API**: Validated JSON ingestion, API-key authentication (`X-API-Key`), Alembic database migrations, and health check monitoring.
- **Relational PostgreSQL Datastore**: Persistent time-series logging with composite indexes for device IDs and timestamps.
- **Responsive Web Dashboard**: Built with React, Vite, Tailwind CSS, and Recharts. Features 3-second periodic polling, live waveform visualizer, paginated logs, date filtering, and device connection tracking.
- **Fail-Safe Offline Detection**: Strictly distinguishes between a device reporting no flame and an offline/disconnected sensor. Missing telemetry is **never** treated as safe.
- **Production Containerization**: Ready-to-deploy `Dockerfile` and `render.yaml` Blueprint for Render Web Services and Static Sites.
- **Automated Testing & Simulation**: Includes 11 automated pytest test cases and a dedicated device simulation script (`simulate_device.py`) for live demonstrations without an open flame.

---

## 📁 Repository Structure

```text
├── backend/                  # FastAPI Application
│   ├── alembic/              # Database migration versions and environment
│   ├── app/
│   │   ├── config.py         # Pydantic environment settings
│   │   ├── crud.py           # Database queries and status logic
│   │   ├── database.py       # SQLAlchemy engine and session dependency
│   │   ├── dependencies.py   # API-key authentication
│   │   ├── main.py           # FastAPI server and middleware setup
│   │   ├── models.py         # SQLAlchemy ORM models (Device, SensorReading)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   └── routers/          # Modular API routes (health, readings, stats, devices)
│   ├── alembic.ini           # Alembic migration configuration
│   ├── requirements.txt      # Python dependencies
│   └── run.py                # Server runner script
│
├── frontend/                 # React 19 + Vite + Tailwind CSS Dashboard
│   ├── src/
│   │   ├── components/       # Header, StatusBanner, MetricsCards, Chart, DeviceList, Table
│   │   ├── api.js            # Fetch API integration client
│   │   ├── App.jsx           # Master dashboard view
│   │   └── index.css         # Tailwind styles
│   ├── package.json
│   └── vite.config.js
│
├── esp32_firmware/           # ESP32 DevKit V1 Arduino Firmware
│   ├── esp32_fire_detection.ino  # Main firmware sketch
│   ├── config.h.example          # Wi-Fi and server configuration template
│   └── README.md                 # Flashing and wiring guide
│
├── tests/                    # Testing Suite
│   ├── test_api.py           # Pytest API endpoint and auth tests
│   ├── test_database.py      # Pytest ORM and database logic tests
│   └── simulate_device.py    # Virtual ESP32 device telemetry generator
│
├── docs/                     # Project Documentation
│   ├── system_architecture.md      # Mermaid diagrams and state machine
│   ├── hardware_wiring.md          # Wiring table, active-LOW explanation, buzzer note
│   ├── api_documentation.md        # Complete REST API reference
│   ├── deployment_render_guide.md  # Step-by-step Render and local deployment
│   └── college_project_report.md   # MCA college project report outline
│
├── Dockerfile                # Production Docker container for Render Web Service
├── render.yaml               # Render Infrastructure-as-Code Blueprint
├── .env.example              # Environment variables template
├── .gitignore                # Git exclusions
└── README.md                 # Project README
```

---

## 🔌 Hardware Connections

| Component | Component Pin | ESP32 Pin | Function |
|---|---|---|---|
| **IR Flame Sensor** | VCC | **3V3** | 3.3V Power Supply |
| **IR Flame Sensor** | GND | **GND** | Ground Rail |
| **IR Flame Sensor** | DO | **GPIO 27** | Active-LOW (0 = Flame, 1 = Safe) |
| **Red Alert LED** | Anode (+) | **GPIO 26** | Connected in series with 220Ω resistor |
| **Green Safe LED** | Anode (+) | **GPIO 25** | Connected in series with 220Ω resistor |
| **Both LEDs** | Cathode (-) | **GND** | Ground Return |

> [!CAUTION]
> **Unknown Buzzer Safety Warning**: Do **not** connect the unknown two-terminal buzzer directly to an ESP32 GPIO pin. ESP32 GPIO pins cannot deliver the required inductive current and lack flyback diode protection. See [hardware_wiring.md](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/hardware_wiring.md) for safe transistor driver schematics.

---

## 🚀 Quick Start Guide

### 1. Local Setup

```powershell
# 1. Clone repository & install backend dependencies
pip install -r backend/requirements.txt

# 2. Run database migrations
python -m alembic upgrade head

# 3. Start backend server
python backend/run.py

# 4. In a new terminal, run the frontend
cd frontend
npm install
npm run dev
```

- Backend API: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- Frontend Dashboard: `http://localhost:5173`

### 2. Run Automated Tests

```powershell
python -m pytest tests/ -v
```

All 11 automated test cases will execute and verify health, authentication, payload validation, pagination, and offline fail-safe logic.

### 3. Test Device Simulation (No Hardware Needed)

```powershell
# Send a safe telemetry packet (Green dashboard panel)
python tests/simulate_device.py --trigger-safe

# Send a flame detection alert packet (Red flashing dashboard panel)
python tests/simulate_device.py --trigger-flame

# Run continuous simulation
python tests/simulate_device.py --mode continuous
```

---

## ☁️ Deploying to Render

This repository includes a [`render.yaml`](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/render.yaml) blueprint:

1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com) → **New +** → **Blueprint**.
3. Connect your repository. Render will automatically spin up:
   - **PostgreSQL Database**: `fire-detection-postgres`
   - **FastAPI Docker Backend**: `iot-fire-detection-backend`
   - **React Static Site**: `iot-fire-detection-dashboard`
4. Update `esp32_firmware/config.h` with your deployed backend HTTPS URL and flash your ESP32.

For detailed deployment steps and Render free-tier notes, see [deployment_render_guide.md](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/deployment_render_guide.md).

---

## 📖 Documentation Links

- [System Architecture & Sequence Flow](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/system_architecture.md)
- [Hardware Wiring & Electrical Schematics](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/hardware_wiring.md)
- [REST API Specification](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/api_documentation.md)
- [Render Cloud Deployment Guide](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/deployment_render_guide.md)
- [MCA Project Report Outline](file:///c:/Users/kkabh/OneDrive/Documents/IOT%20Project/docs/college_project_report.md)

---

## 🎓 Academic Credit & License

Developed as an MCA Capstone IoT Project. Open-source under the MIT License.
