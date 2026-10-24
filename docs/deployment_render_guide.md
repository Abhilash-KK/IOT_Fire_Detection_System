# Render Deployment & Local Setup Guide — IoT Fire Detection System

This guide provides step-by-step instructions for running the project locally, pushing to GitHub, deploying to **Render**, and diagnosing common connectivity or configuration issues.

---

## 1. Local Testing & Verification

### Step 1: Run Backend Locally
Open a terminal in the project root:
```powershell
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Run Alembic migrations to set up local database
python -m alembic upgrade head

# 3. Start the FastAPI server
python backend/run.py
```
Backend will be available at: `http://localhost:8000` (API documentation at `http://localhost:8000/docs`).

### Step 2: Run Frontend Locally
In a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Dashboard will open at: `http://localhost:5173`.

### Step 3: Send Test Readings via Device Simulator
In a third terminal:
```powershell
# Send a safe reading (Green panel)
python tests/simulate_device.py --trigger-safe

# Send a flame detected alert reading (Red panel)
python tests/simulate_device.py --trigger-flame

# Or start continuous transmission
python tests/simulate_device.py --mode continuous
```

---

## 2. Preparing GitHub Repository

1. Initialize git (if not already done) and commit the codebase:
   ```bash
   git add .
   git commit -m "feat: complete IoT fire detection full-stack system"
   ```
2. Create a **New Repository** on your GitHub account (named e.g. `iot-fire-detection-system`). Make it Public or Private.
3. Link your local repo and push to GitHub:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/iot-fire-detection-system.git
   git push -u origin main
   ```

---

## 3. Deploying to Render Step-by-Step

Render offers two deployment methods:
- **Option A: Blueprint Deployment (Fastest)** using the included `render.yaml`.
- **Option B: Manual Dashboard Setup** via the Render Web UI.

### Option A: One-Click Blueprint Deployment (Recommended)
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** → **Blueprint**.
3. Select your GitHub repository `iot-fire-detection-system`.
4. Render detects `render.yaml` automatically and configures:
   - `fire-detection-postgres` (PostgreSQL Database)
   - `iot-fire-detection-backend` (Docker Web Service)
   - `iot-fire-detection-dashboard` (Static Site)
5. Click **Apply**. Render will automatically provision the database, build the container, and publish the dashboard.

---

### Option B: Manual Dashboard Setup

#### 1. Create Render PostgreSQL Database
1. In Render, click **New +** → **PostgreSQL**.
2. **Name**: `fire-detection-db`
3. **Database**: `fire_detection_db`
4. **User**: `fire_admin`
5. **Plan**: Select **Free**.
6. Click **Create Database**.
7. Once created, copy the **Internal Database URL** (e.g. `postgres://fire_admin:...@dpg-...-a/fire_detection_db`).

#### 2. Deploy FastAPI Docker Backend
1. Click **New +** → **Web Service**.
2. Connect your GitHub repository.
3. **Name**: `iot-fire-detection-backend`
4. **Runtime**: **Docker**
5. **Dockerfile Path**: `./Dockerfile`
6. **Plan**: **Free**
7. In the **Environment Variables** section, add:
   - `ENVIRONMENT` = `production`
   - `DATABASE_URL` = Paste the **Internal Database URL** from Step 1.
   - `DEVICE_API_KEY` = A secure random string (e.g., `esp32_secret_key_college_2026`).
   - `ALLOWED_ORIGINS` = `*` (or your frontend URL after creating it).
   - `DEVICE_OFFLINE_THRESHOLD_SECONDS` = `30`
8. Under **Health Check Path**, enter: `/health`.
9. Click **Create Web Service**. Wait for the build and deployment to complete.
10. Copy your backend service URL (e.g., `https://iot-fire-detection-backend.onrender.com`).

#### 3. Deploy React Frontend Static Site
1. Click **New +** → **Static Site**.
2. Connect your GitHub repository.
3. **Name**: `iot-fire-detection-dashboard`
4. **Root Directory**: `frontend`
5. **Build Command**: `npm install && npm run build`
6. **Publish Directory**: `dist`
7. Under **Environment Variables**, add:
   - `VITE_API_URL` = Paste your backend URL (e.g., `https://iot-fire-detection-backend.onrender.com`).
   - `VITE_POLL_INTERVAL_MS` = `3000`
8. Under **Redirects/Rewrites**:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite`
9. Click **Create Static Site**.

---

## 4. Configuring ESP32 for Render Cloud HTTPS

Once your backend is live on Render:

1. Open `esp32_firmware/config.h` in Arduino IDE.
2. Set `BACKEND_SERVER_URL` to your Render backend HTTPS address:
   ```cpp
   const char* BACKEND_SERVER_URL = "https://iot-fire-detection-backend.onrender.com/api/readings";
   const char* DEVICE_API_KEY     = "esp32_secret_key_college_2026"; // Must match Render env var
   ```
3. Flash the sketch to your ESP32 DevKit V1.
4. Open the Arduino Serial Monitor at 115200 baud to verify:
   ```text
   [WIFI] Connected Successfully!
   [HTTP POST] Transmitting -> {"device_id":"ESP32_FLAME_STATION_01",...}
   [HTTP RES] Code: 201 | Body: {"id":1,"device_id":"ESP32_FLAME_STATION_01",...}
   ```
5. Open your frontend dashboard URL in your browser: real sensor readings will stream in automatically!

---

## 5. Render Free Tier Limitations

> [!WARNING]
> **Important Notes on Render Free Tier Plans**:
>
> 1. **Web Service Spin-Down (Inactivity Sleep)**:
>    - On the free plan, Render web services sleep after **15 minutes of inactivity**.
>    - When an incoming HTTP request arrives (e.g. opening the dashboard or an ESP32 sending a packet), Render wakes the service up.
>    - The first wake-up request takes **30–50 seconds** (cold start). Subsequent requests respond in milliseconds.
>    - *Tip for college viva/demo*: Send a test ping or open the dashboard 2 minutes before your demonstration so the backend is warm and responsive.
>
> 2. **PostgreSQL 30-Day Persistence Expiration**:
>    - Free Render PostgreSQL databases expire **30 days after creation**.
>    - For a semester project or viva, this is sufficient. If you need data long-term, export backups using `pg_dump` or recreate the database before final submission.

---

## 6. Troubleshooting & Diagnostics

| Symptom / Error | Root Cause | Solution |
|---|---|---|
| **ESP32 prints: `HTTP ERR: -1` or Connection Refused** | Incorrect IP or firewall blocking port 8000 (when testing locally) | Use the computer's actual LAN IPv4 address (e.g. `192.168.1.X`), not `localhost` or `127.0.0.1`. Allow Python through Windows Defender Firewall. |
| **ESP32 prints: `HTTP RES Code: 401`** | API Key mismatch | Verify that `DEVICE_API_KEY` in `config.h` matches the `DEVICE_API_KEY` in `.env` / Render environment variables exactly. |
| **ESP32 prints: `HTTP RES Code: 422`** | Validation error | Ensure `sensor_value` is `0` or `1` and `device_id` is a non-empty string. |
| **Frontend displays: "API Unreachable"** | Backend down, sleeping, or CORS issue | Check `/health` endpoint directly in the browser. In Render backend settings, ensure `ALLOWED_ORIGINS` includes your frontend domain. |
| **Database error: `no such table`** | Alembic migrations not applied | Run `python -m alembic upgrade head`. In Render Dockerfile, this is executed automatically on startup. |
| **Sensor always reports Flame (Red LED stuck ON)** | Sensor potentiometer sensitivity too high | Turn the blue potentiometer counter-clockwise until the sensor module LED turns off under ambient lighting. |
