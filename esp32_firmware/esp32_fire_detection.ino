/**
 * ============================================================================
 * IoT Fire Detection System - ESP32 DevKit V1 Firmware
 * MCA Capstone Project
 * 
 * Hardware Connections:
 * - ESP32 GPIO27 <---> IR Flame Sensor Digital Output (DO)
 * - ESP32 GPIO26 <---> Red LED Anode (+ via 220-ohm resistor)
 * - ESP32 GPIO25 <---> Green LED Anode (+ via 220-ohm resistor)
 * - ESP32 3V3    <---> IR Flame Sensor VCC
 * - ESP32 GND    <---> IR Flame Sensor GND & Both LED Cathodes
 * 
 * Features:
 * - Active-LOW optical flame detection
 * - Instant local hardware LED response (< 10ms) independent of network state
 * - Non-blocking HTTP POST transmission to FastAPI backend
 * - Safe automatic Wi-Fi reconnection without stalling hardware interrupts
 * - Serial Monitor diagnostic telemetry at 115200 baud
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// If you created a custom config.h, include it. Otherwise default definitions below will apply.
#if __has_include("config.h")
  #include "config.h"
#else
  // Default fallback credentials (replace for your environment)
  const char* WIFI_SSID          = "YOUR_WIFI_SSID";
  const char* WIFI_PASSWORD      = "YOUR_WIFI_PASSWORD";
  const char* BACKEND_SERVER_URL = "http://192.168.1.100:8000/api/readings";
  const char* DEVICE_API_KEY     = "test_device_key_12345";
  const char* DEVICE_ID          = "ESP32_FLAME_STATION_01";

  const int PIN_FLAME_SENSOR     = 27;  // Digital output of IR Flame Sensor
  const int PIN_RED_LED          = 26;  // Red Alert LED
  const int PIN_GREEN_LED        = 25;  // Green Safe LED

  const int FLAME_DETECTED_LOGIC = 0;   // 0 = LOW (Flame present), 1 = HIGH (Safe)

  const unsigned long HEARTBEAT_INTERVAL_MS   = 4000;  // 4s normal report rate
  const unsigned long ALARM_RETRY_INTERVAL_MS = 1500;  // 1.5s active flame report rate
  const unsigned long SENSOR_SAMPLE_INTERVAL_MS = 100; // 100ms local sensor poll
#endif

// State Tracking Variables
int currentSensorValue = -1;
bool isFlameDetected = false;
bool previousFlameState = false;

unsigned long lastSensorSampleTime = 0;
unsigned long lastTelemetrySentTime = 0;
unsigned long lastWifiRetryTime = 0;
const unsigned long WIFI_RETRY_INTERVAL_MS = 10000; // 10 seconds between Wi-Fi reconnect attempts

// Forward Declarations
void handleLocalHardware(int sensorVal, bool flameState);
void sendTelemetryHttp(int sensorVal, bool flameState);
void checkAndMaintainWifi();

void setup() {
  // Initialize Serial Monitor for debugging
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=======================================================");
  Serial.println("  IoT Fire Detection System - ESP32 Firmware Starting  ");
  Serial.println("=======================================================");

  // Configure GPIO Pins
  pinMode(PIN_FLAME_SENSOR, INPUT);
  pinMode(PIN_RED_LED, OUTPUT);
  pinMode(PIN_GREEN_LED, OUTPUT);

  // Initial LED self-test: flash both LEDs briefly
  Serial.println("[BOOT] Running LED self-test...");
  digitalWrite(PIN_RED_LED, HIGH);
  digitalWrite(PIN_GREEN_LED, HIGH);
  delay(400);
  digitalWrite(PIN_RED_LED, LOW);
  digitalWrite(PIN_GREEN_LED, LOW);
  delay(200);

  // Connect to Wi-Fi
  Serial.printf("[WIFI] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Non-blocking initial attempt (up to 8 seconds)
  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 8000) {
    delay(400);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected Successfully!");
    Serial.printf("[WIFI] IP Address: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WIFI] Signal Strength (RSSI): %d dBm\n", WiFi.RSSI());
  } else {
    Serial.println("\n[WARN] Wi-Fi connection pending. Operating in offline safety mode.");
  }

  Serial.println("[SYSTEM] Armed. Monitoring flame sensor on GPIO27...");
}

void loop() {
  unsigned long currentMillis = millis();

  // 1. Maintain Wi-Fi connectivity in background without blocking loop
  if (currentMillis - lastWifiRetryTime >= WIFI_RETRY_INTERVAL_MS) {
    lastWifiRetryTime = currentMillis;
    checkAndMaintainWifi();
  }

  // 2. High-Frequency Local Sensor Sampling (every 100ms)
  if (currentMillis - lastSensorSampleTime >= SENSOR_SAMPLE_INTERVAL_MS) {
    lastSensorSampleTime = currentMillis;

    // Read digital pin from IR Flame Sensor
    int sensorReading = digitalRead(PIN_FLAME_SENSOR);
    bool flameState = (sensorReading == FLAME_DETECTED_LOGIC);

    currentSensorValue = sensorReading;
    isFlameDetected = flameState;

    // 3. Update Local Physical Actuators (Red/Green LEDs) IMMEDIATELY
    handleLocalHardware(currentSensorValue, isFlameDetected);

    // 4. Transmission Trigger Logic:
    // a) IMMEDIATE TRANSMISSION if flame status just transitioned (Safe -> Flame or Flame -> Safe)
    bool stateChanged = (isFlameDetected != previousFlameState);
    
    // b) Periodic heartbeat timer (faster if in alarm mode)
    unsigned long activeInterval = isFlameDetected ? ALARM_RETRY_INTERVAL_MS : HEARTBEAT_INTERVAL_MS;
    bool timerExpired = (currentMillis - lastTelemetrySentTime >= activeInterval);

    if (stateChanged || timerExpired) {
      if (stateChanged) {
        Serial.printf("[EVENT] Status Transition Detected! Flame: %s\n", isFlameDetected ? "DETECTED" : "CLEARED");
      }
      sendTelemetryHttp(currentSensorValue, isFlameDetected);
      lastTelemetrySentTime = currentMillis;
      previousFlameState = isFlameDetected;
    }
  }
}

/**
 * Updates Red and Green LEDs according to flame sensor reading.
 * Guarantees local safety warning is responsive even when offline.
 */
void handleLocalHardware(int sensorVal, bool flameState) {
  if (flameState) {
    // FLAME DETECTED: Red LED ON, Green LED OFF
    digitalWrite(PIN_RED_LED, HIGH);
    digitalWrite(PIN_GREEN_LED, LOW);
  } else {
    // NO FLAME: Red LED OFF, Green LED ON
    digitalWrite(PIN_RED_LED, LOW);
    digitalWrite(PIN_GREEN_LED, HIGH);
  }
}

/**
 * Transmits sensor readings to FastAPI backend over HTTP/HTTPS.
 */
void sendTelemetryHttp(int sensorVal, bool flameState) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[TELEMETRY] Cannot send: Wi-Fi disconnected. Local indicators active.");
    return;
  }

  HTTPClient http;
  int wifiRssi = WiFi.RSSI();

  // Handle both standard HTTP (local dev) and HTTPS (cloud Render)
  if (String(BACKEND_SERVER_URL).startsWith("https://")) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Allows college/demo SSL handshake without custom root CA bundle
    http.begin(secureClient, BACKEND_SERVER_URL);
  } else {
    WiFiClient standardClient;
    http.begin(standardClient, BACKEND_SERVER_URL);
  }

  // Set Headers
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", DEVICE_API_KEY);
  http.setTimeout(4000); // 4-second timeout to avoid stalling sensor monitoring

  // Construct JSON Payload
  // Active-LOW: sensorVal is 0 or 1. flame_detected is true or false.
  String jsonPayload = "{";
  jsonPayload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  jsonPayload += "\"sensor_value\":" + String(sensorVal) + ",";
  jsonPayload += "\"flame_detected\":" + String(flameState ? "true" : "false") + ",";
  jsonPayload += "\"rssi\":" + String(wifiRssi) + ",";
  jsonPayload += "\"is_simulated\":false";
  jsonPayload += "}";

  Serial.printf("[HTTP POST] Transmitting -> %s\n", jsonPayload.c_str());

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String responseString = http.getString();
    Serial.printf("[HTTP RES] Code: %d | Body: %s\n", httpResponseCode, responseString.c_str());
  } else {
    Serial.printf("[HTTP ERR] Request Failed: %s (Code: %d)\n", http.errorToString(httpResponseCode).c_str(), httpResponseCode);
  }

  http.end();
}

/**
 * Background Wi-Fi health check and reconnect logic.
 */
void checkAndMaintainWifi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[WIFI] Reconnecting to Wi-Fi...");
    WiFi.disconnect();
    WiFi.reconnect();
  }
}
