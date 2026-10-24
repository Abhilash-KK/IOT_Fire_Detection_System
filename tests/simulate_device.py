"""
IoT Fire Detection System - Device Simulation Utility
MCA IoT Project Testing Script

This script acts as a virtual ESP32 device sending HTTP POST telemetry to the
FastAPI backend. It labels all readings with `is_simulated = True` so simulated
data is never confused with physical ESP32 sensor output.

Usage:
  python tests/simulate_device.py --url http://127.0.0.1:8000 --api-key test_device_key_12345 --mode continuous
  python tests/simulate_device.py --url http://127.0.0.1:8000 --trigger-flame
  python tests/simulate_device.py --url http://127.0.0.1:8000 --trigger-safe
"""

import argparse
import random
import sys
import time
from datetime import datetime, timezone
import requests


def send_reading(
    api_url: str,
    api_key: str,
    device_id: str,
    sensor_value: int,
    flame_detected: bool,
    rssi: int = -65,
    is_simulated: bool = True
):
    url = f"{api_url.rstrip('/')}/api/readings"
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key
    }
    payload = {
        "device_id": device_id,
        "sensor_value": sensor_value,
        "flame_detected": flame_detected,
        "rssi": rssi,
        "is_simulated": is_simulated,
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=5)
        status_tag = "[ALERT - FLAME DETECTED]" if flame_detected else "[SAFE - NO FLAME]"
        if response.status_code == 201:
            data = response.json()
            print(
                f"[{datetime.now().strftime('%H:%M:%S')}] {status_tag} "
                f"ID={data['id']} Device={device_id} Value={sensor_value} RSSI={rssi}dBm -> HTTP 201 OK"
            )
            return True
        else:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Failed: HTTP {response.status_code} - {response.text}")
            return False
    except requests.RequestException as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Connection Error: {e}")
        return False


def run_continuous_simulation(api_url: str, api_key: str, device_id: str, interval: int = 3):
    print("=" * 65)
    print("  IoT Fire Detection System - Continuous Device Simulator")
    print(f"  Device ID    : {device_id}")
    print(f"  Target URL   : {api_url}")
    print(f"  Interval     : {interval} seconds")
    print("  Simulated Tag: True (clearly identified in DB/dashboard)")
    print("=" * 65)
    print("Press Ctrl+C to stop simulation.\n")

    iteration = 0
    try:
        while True:
            iteration += 1
            # Random Wi-Fi RSSI fluctuation typical of 2.4GHz ESP32
            rssi = random.randint(-75, -55)

            # Every 8th reading, simulate a flame trigger burst for 3 readings
            if 8 <= (iteration % 15) <= 10:
                sensor_value = 0
                flame_detected = True
            else:
                sensor_value = 1
                flame_detected = False

            send_reading(
                api_url=api_url,
                api_key=api_key,
                device_id=device_id,
                sensor_value=sensor_value,
                flame_detected=flame_detected,
                rssi=rssi,
                is_simulated=True
            )
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n[INFO] Simulation stopped by user.")


def main():
    parser = argparse.ArgumentParser(description="Simulate ESP32 readings for IoT Fire Detection System")
    parser.add_argument("--url", default="http://127.0.0.1:8000", help="Base URL of backend API")
    parser.add_argument("--api-key", default="test_device_key_12345", help="X-API-Key device authentication header")
    parser.add_argument("--device-id", default="SIMULATED_ESP32_01", help="Virtual device identifier")
    parser.add_argument("--interval", type=int, default=3, help="Transmission interval in seconds")
    parser.add_argument("--trigger-flame", action="store_true", help="Send a single FLAME DETECTED alert reading")
    parser.add_argument("--trigger-safe", action="store_true", help="Send a single NO FLAME safe reading")
    parser.add_argument("--mode", choices=["continuous", "single"], default="continuous", help="Simulation mode")

    args = parser.parse_args()

    if args.trigger_flame:
        print("[ACTION] Sending single FLAME DETECTED reading...")
        send_reading(args.url, args.api_key, args.device_id, sensor_value=0, flame_detected=True, rssi=-60)
    elif args.trigger_safe:
        print("[ACTION] Sending single SAFE (NO FLAME) reading...")
        send_reading(args.url, args.api_key, args.device_id, sensor_value=1, flame_detected=False, rssi=-60)
    else:
        run_continuous_simulation(args.url, args.api_key, args.device_id, interval=args.interval)


if __name__ == "__main__":
    main()
