#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// Configure locally; never commit real credentials or production tokens.
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* API_URL = "https://your-swms-host.example.com/api/smart-bins/readings";
const char* DEVICE_ID = "YOUR_REGISTERED_DEVICE_ID";
const char* DEVICE_TOKEN = "YOUR_ONE_TIME_DEVICE_TOKEN";

// Verify the exact JSN-SR04T board revision before wiring. GPIO34 is input-only.
constexpr uint8_t TRIG_PIN = 5;
constexpr uint8_t ECHO_PIN = 34;
constexpr unsigned long SEND_INTERVAL_MS = 5UL * 60UL * 1000UL;
constexpr float EMPTY_DISTANCE_CM = 120.0f;
constexpr float FULL_DISTANCE_CM = 20.0f;
constexpr float WARNING_THRESHOLD = 70.0f;
constexpr float CRITICAL_THRESHOLD = 90.0f;

// Paste the SWMS server's trusted root CA here. Do not use setInsecure() in production.
const char* ROOT_CA = "-----BEGIN CERTIFICATE-----\nPASTE_SERVER_ROOT_CA_HERE\n-----END CERTIFICATE-----\n";

WiFiClientSecure tls;
unsigned long nextSendAt = 0;
uint32_t sequenceNumber = 0;

float readDistanceCm() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(3);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10); digitalWrite(TRIG_PIN, LOW);
  unsigned long duration = pulseIn(ECHO_PIN, HIGH, 40000UL);
  if (duration == 0) return NAN;
  return duration * 0.0343f / 2.0f;
}

float medianDistance() {
  float values[5]; int count = 0;
  for (int i = 0; i < 5; i++) {
    float d = readDistanceCm();
    if (isfinite(d) && d >= 2.0f && d <= EMPTY_DISTANCE_CM * 1.5f) values[count++] = d;
    delay(80);
  }
  if (count < 3) return NAN;
  for (int i = 0; i < count - 1; i++) for (int j = i + 1; j < count; j++) if (values[j] < values[i]) { float t = values[i]; values[i] = values[j]; values[j] = t; }
  return values[count / 2];
}

float fillPercent(float distanceCm) {
  if (EMPTY_DISTANCE_CM <= FULL_DISTANCE_CM) return NAN;
  float pct = ((EMPTY_DISTANCE_CM - distanceCm) / (EMPTY_DISTANCE_CM - FULL_DISTANCE_CM)) * 100.0f;
  return constrain(pct, 0.0f, 100.0f);
}

bool sendReading(float distance, float fill, bool sensorOk) {
  if (WiFi.status() != WL_CONNECTED) return false;
  HTTPClient http;
  if (!http.begin(tls, API_URL)) return false;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Id", DEVICE_ID);
  http.addHeader("X-Device-Token", DEVICE_TOKEN);
  JsonDocument doc;
  doc["readingId"] = String(DEVICE_ID) + "-" + String(++sequenceNumber);
  time_t now = time(nullptr);
  if (now < 1700000000) { Serial.println("NTP time is not ready; refusing to send an unverifiable reading"); http.end(); return false; }
  struct tm utc; gmtime_r(&now, &utc); char timestamp[32]; strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &utc);
  doc["measuredAt"] = timestamp;
  doc["distanceCm"] = distance;
  doc["fillPercent"] = fill;
  doc["sensorOk"] = sensorOk;
  String body; serializeJson(doc, body);
  int status = http.POST(body);
  Serial.printf("POST status=%d response=%s\n", status, http.getString().c_str());
  http.end();
  return status >= 200 && status < 300;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA); WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  for (int attempt = 0; attempt < 20 && WiFi.status() != WL_CONNECTED; attempt++) { delay(500); Serial.print("."); }
  Serial.printf("\nWiFi status=%d IP=%s\n", WiFi.status(), WiFi.localIP().toString().c_str());
}

void setup() {
  Serial.begin(115200); pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  tls.setCACert(ROOT_CA); connectWiFi(); configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  nextSendAt = millis();
}

void loop() {
  if ((long)(millis() - nextSendAt) < 0) { delay(250); return; }
  nextSendAt = millis() + SEND_INTERVAL_MS;
  if (WiFi.status() != WL_CONNECTED) connectWiFi();
  float distance = medianDistance(); bool ok = isfinite(distance); float fill = ok ? fillPercent(distance) : 0.0f;
  Serial.printf("sensorOk=%s distance=%.1fcm fill=%.1f%% warning=%.1f critical=%.1f\n", ok ? "true" : "false", distance, fill, WARNING_THRESHOLD, CRITICAL_THRESHOLD);
  for (int attempt = 0; attempt < 3 && !sendReading(ok ? distance : 0.0f, fill, ok); attempt++) delay((1UL << attempt) * 2000UL);
}
