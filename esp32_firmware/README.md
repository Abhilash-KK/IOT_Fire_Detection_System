# ESP32 Firmware Guide — IoT Fire Detection System

This directory contains the firmware for the **ESP32 DevKit V1** microcontroller connected to an **IR Optical Flame Sensor**.

---

## 1. Hardware Pinout & Wiring Table

| Component | Component Pin | ESP32 Pin | Details |
|---|---|---|---|
| **IR Flame Sensor** | VCC | **3V3** | 3.3V DC power supply |
| **IR Flame Sensor** | GND | **GND** | Common ground |
| **IR Flame Sensor** | DO (Digital Out) | **GPIO27** | Active-LOW: LOW = Flame, HIGH = Safe |
| **Red Alert LED** | Anode (+) | **GPIO26** | Connected in series with 220Ω resistor |
| **Red Alert LED** | Cathode (-) | **GND** | Ground |
| **Green Safe LED** | Anode (+) | **GPIO25** | Connected in series with 220Ω resistor |
| **Green Safe LED** | Cathode (-) | **GND** | Ground |

> [!CAUTION]
> **Optional Buzzer**: Do **NOT** connect the unknown two-terminal buzzer directly to an ESP32 GPIO pin. ESP32 pins are rated for a maximum of 12mA to 40mA at 3.3V. Directly driving an inductive buzzer without a flyback diode and a transistor driver circuit (e.g. 2N2222 or BC547) can damage the ESP32 GPIO.

---

## 2. Sensor Logic Configuration

The IR flame sensor module uses an LM393 comparator with an onboard potentiometer to adjust sensitivity:
- **No flame detected**: Output is **HIGH (1)**. Green LED is **ON**, Red LED is **OFF**.
- **Flame detected**: Output drops to **LOW (0)**. Green LED turns **OFF**, Red LED turns **ON**.

You can adjust the potentiometer on the blue module with a small screwdriver so the indicator LED on the sensor module stays off under ambient indoor light, and turns on when a lighter flame or infrared source is brought within 20–50 cm.

---

## 3. Flashing Instructions (Arduino IDE)

### Step 1: Install ESP32 Board Support in Arduino IDE
1. Open **Arduino IDE**.
2. Go to **File → Preferences**.
3. In **Additional boards manager URLs**, add:
   ```text
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**, search for `esp32` by Espressif Systems, and click **Install**.

### Step 2: Configure Arduino IDE Settings
- **Board**: `DOIT ESP32 DEVKIT V1` (or `ESP32 Dev Module`)
- **Upload Speed**: `921600` (or `115200` if upload fails)
- **CPU Frequency**: `240MHz (WiFi/BT)`
- **Flash Frequency**: `80MHz`
- **Port**: Select the COM port corresponding to your connected ESP32 (e.g., `COM3`, `COM4`, etc.)

### Step 3: Configure Network and Server
1. Copy `config.h.example` to `config.h`:
   ```bash
   cp esp32_firmware/config.h.example esp32_firmware/config.h
   ```
2. Open `config.h` and update:
   - `WIFI_SSID`: Your 2.4GHz Wi-Fi network name.
   - `WIFI_PASSWORD`: Your Wi-Fi network password.
   - `BACKEND_SERVER_URL`: 
     - For local testing: `http://<YOUR_COMPUTER_LOCAL_IP>:8000/api/readings` (Find via `ipconfig` on Windows).
     - For Render deployment: `https://<YOUR_RENDER_SERVICE_NAME>.onrender.com/api/readings`
   - `DEVICE_API_KEY`: Matching the backend `DEVICE_API_KEY` in `.env`.

### Step 4: Upload and Monitor
1. Click **Upload** (the Right Arrow button).
2. If the terminal prints `Connecting......._____`, press and hold the **BOOT** button on the ESP32 until the flashing progress percentage begins.
3. Once completed, open **Tools → Serial Monitor** and set the baud rate to **115200 baud**.
4. You will see:
   ```text
   [BOOT] Running LED self-test...
   [WIFI] Connecting to SSID: ...
   [WIFI] Connected Successfully!
   [WIFI] IP Address: 192.168.1.xxx
   [SYSTEM] Armed. Monitoring flame sensor on GPIO27...
   [HTTP POST] Transmitting -> {"device_id":"ESP32_FLAME_STATION_01","sensor_value":1,"flame_detected":false...}
   [HTTP RES] Code: 201 | Body: {"id":1,"device_id":"ESP32_FLAME_STATION_01",...}
   ```
