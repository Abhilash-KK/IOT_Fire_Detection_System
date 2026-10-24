"""
IoT Fire Detection System - History Purge Utility
Safely deletes unwanted simulation logs or resets database history.

Usage:
  # Delete only the simulated test logs (keeps real physical ESP32 records intact)
  python tests/clear_history.py

  # Reset all records (complete clean slate for project presentation)
  python tests/clear_history.py --all

  # Specify a custom URL or API key
  python tests/clear_history.py --url https://iot-fire-detection-backend.onrender.com --api-key <YOUR_KEY>
"""

import argparse
import requests


def purge_history(
    api_url: str,
    api_key: str,
    simulated_only: bool = True,
    device_id: str = None,
    delete_all: bool = False
):
    endpoint = f"{api_url.rstrip('/')}/api/readings"
    headers = {
        "X-API-Key": api_key
    }
    params = {
        "simulated_only": str(simulated_only).lower(),
        "delete_all": str(delete_all).lower()
    }
    if device_id:
        params["device_id"] = device_id

    mode_label = "ALL RECORDS (COMPLETE RESET)" if delete_all else ("SIMULATED LOGS ONLY" if simulated_only else f"DEVICE: {device_id}")

    print("=" * 65)
    print("  IoT Fire Detection System - Database History Purge")
    print(f"  Target Server: {api_url}")
    print(f"  Purge Target : {mode_label}")
    print("=" * 65)

    try:
        response = requests.delete(endpoint, headers=headers, params=params, timeout=15)
        if response.status_code == 200:
            result = response.json()
            print(f"[SUCCESS] {result['message']}")
            print("Refresh your browser dashboard to view the updated history!")
        elif response.status_code == 401:
            print("[ERROR] 401 Unauthorized: Invalid or missing DEVICE_API_KEY.")
        else:
            print(f"[ERROR] HTTP {response.status_code}: {response.text}")
    except requests.RequestException as exc:
        print(f"[ERROR] Could not connect to server: {exc}")


def main():
    parser = argparse.ArgumentParser(description="Purge unwanted telemetry logs from the database")
    parser.add_argument(
        "--url",
        default="https://iot-fire-detection-backend.onrender.com",
        help="Base URL of backend (defaults to Render deployment)"
    )
    parser.add_argument(
        "--api-key",
        default="OmwaORYUoxHYaSCgPucODxuuPAjqeOr4kx/NjCmBsoA=",
        help="Device API Key matching DEVICE_API_KEY in Render environment"
    )
    parser.add_argument(
        "--device-id",
        default=None,
        help="Optional: Delete logs from a specific device ID (e.g. SIMULATED_ESP32_01)"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Delete ALL historical records and reset tables completely"
    )

    args = parser.parse_args()

    # If --all is not specified, default to simulated-only
    simulated_only = not args.all

    purge_history(
        api_url=args.url,
        api_key=args.api_key,
        simulated_only=simulated_only,
        device_id=args.device_id,
        delete_all=args.all
    )


if __name__ == "__main__":
    main()
