# Hardware Wiring & Interface Guide — IoT Fire Detection System

This document provides complete electrical schematics, pinout tables, safety specifications, and controlled testing instructions for the hardware subsystem.

---

## 1. Bill of Materials (BOM)

| Item | Component | Specification | Quantity |
|---|---|---|---|
| 1 | ESP32 DevKit V1 | 30-pin or 38-pin Dual Core 240MHz, 2.4GHz Wi-Fi | 1 |
| 2 | Optical IR Flame Sensor Module | LM393 Comparator with 760nm–1100nm IR phototransistor | 1 |
| 3 | Red 5mm LED | 2.0V forward voltage, 15mA–20mA | 1 |
| 4 | Green 5mm LED | 2.2V forward voltage, 15mA–20mA | 1 |
| 5 | Carbon Film Resistors | 220Ω (1/4 Watt, ±5% tolerance) | 2 |
| 6 | Solderless Breadboard | 400 or 830 tie points | 1 |
| 7 | Jumper Wires | Male-to-Male / Male-to-Female | 8 |
| 8 | Micro-USB Cable | USB 2.0 Data + Power cable (5V / 1A) | 1 |

---

## 2. GPIO Pin Connection Table

| ESP32 DevKit V1 Pin | Target Device / Pin | Function | Electrical Characteristics |
|---|---|---|---|
| **3V3** | Flame Sensor **VCC** | DC Power Supply | 3.3V Regulated Output |
| **GND** | Flame Sensor **GND** | Ground Rail | 0V Common Ground |
| **GND** | Red LED Cathode (-) | Ground Return | Return through 220Ω resistor |
| **GND** | Green LED Cathode (-) | Ground Return | Return through 220Ω resistor |
| **GPIO 27** | Flame Sensor **DO** | Digital Telemetry Input | Active-LOW (0V = Flame, 3.3V = Safe) |
| **GPIO 26** | Red LED Anode (+) | Fire Alarm Actuator | 3.3V Logic HIGH = Active |
| **GPIO 25** | Green LED Anode (+) | Safe Indicator Actuator | 3.3V Logic HIGH = Active |

---

## 3. Active-LOW Digital Logic Explained

The flame sensor module incorporates an infrared photodiode coupled to an **LM393 voltage comparator IC**:

- **No Flame Detected (Safe)**:
  - Infrared photodiode resistance is high.
  - The comparator output remains pulled HIGH to `VCC` (3.3V).
  - ESP32 digital read returns: `HIGH` (`1`).
  - Firmware executes: `digitalWrite(GPIO26_RED, LOW)` (OFF) and `digitalWrite(GPIO25_GREEN, HIGH)` (ON).

- **Flame Detected (Alert)**:
  - Infrared radiation in the 760nm–1100nm band hits the photodiode, dropping its resistance.
  - The comparator inverts its output, driving the DO pin to Ground.
  - ESP32 digital read returns: `LOW` (`0`).
  - Firmware executes: `digitalWrite(GPIO26_RED, HIGH)` (ON) and `digitalWrite(GPIO25_GREEN, LOW)` (OFF).

---

## 4. Why the Unknown Buzzer Must NOT Be Directly Connected

> [!CAUTION]
> **ELECTRICAL HAZARD**: Do not connect the unknown two-terminal buzzer directly to an ESP32 GPIO pin.
>
> 1. **Current Limit Overload**: Standard ESP32 GPIO pins have an absolute maximum recommended current rating of **12mA to 20mA** (absolute max 40mA). Many standard electromagnetic buzzers draw between **30mA and 120mA**, which will permanently burn out the ESP32 pin output transistor.
> 2. **Inductive Flyback Voltage Spikes**: Electromagnetic buzzers contain an internal inductive coil. When the GPIO pin turns off, the collapsing magnetic field generates a reverse voltage spike (flyback voltage) that can exceed 30V–50V, destroying the ESP32 silicon.
> 3. **Proper Future Integration**: If a buzzer is integrated in the future, connect it using an **NPN transistor switch** (e.g., 2N2222 or BC547), a 1kΩ base current-limiting resistor, and a **1N4148 flyback protection diode** placed across the buzzer terminals in reverse polarity.

---

## 5. Controlled Testing Procedures (No Open Flame Required)

You do **not** need an open flame or candle in your classroom or lab to demonstrate the project safely. Use one of these controlled testing methods:

### Method A: TV / Air Conditioner Remote Control (Recommended)
- Standard infrared remote controls emit light at ~940nm, directly matching the peak sensitivity band of the flame sensor.
- Aim an ordinary TV or AC remote control at the sensor photodiode from 10–20 cm away and press any button.
- The sensor's onboard LED will light up, the ESP32 Red LED will illuminate, and the dashboard will trigger a **FLAME DETECTED** alert immediately.

### Method B: Potentiometer Sensitivity Threshold Adjustment
- Using a small flathead screwdriver, gently turn the onboard blue potentiometer on the flame sensor module.
- Turning clockwise increases sensitivity until ambient indoor ceiling light triggers the threshold.
- Adjust it so the indicator LED turns off under normal room light, then cover or expose it to trigger transitions predictably.

### Method C: Software Simulation Script
- Run the provided simulation script without any hardware connected:
  ```powershell
  python tests/simulate_device.py --trigger-flame
  python tests/simulate_device.py --trigger-safe
  ```
- This tests the complete backend, database, and dashboard pipeline cleanly.
