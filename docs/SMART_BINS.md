# SWMS smart-bin integration

## Current implementation

The integration adds `SmartBin`, `SmartBinReading`, and `SmartBinAlert` entities to Prisma; an administrator-only registration/list API; an authenticated hardware ingestion endpoint at `POST /api/smart-bins/readings`; threshold-transition alerts; and an admin dashboard at `/admin/smart-bins`.

The ingestion endpoint accepts only registered active devices and compares a SHA-256 hash of `X-Device-Token` with the stored hash. Device tokens are returned only once during registration. The endpoint validates the device ID, timestamp, distance, optional reported fill percentage, and sensor status. Duplicate `readingId` values are safely ignored.

Example request:

```http
POST /api/smart-bins/readings
Content-Type: application/json
X-Device-Id: bin-001
X-Device-Token: <one-time-token>

{
  "readingId": "bin-001-000001",
  "measuredAt": "2026-10-17T12:00:00Z",
  "distanceCm": 48.2,
  "fillPercent": 69.8,
  "sensorOk": true
}
```

The server recalculates fill percentage from calibrated distances. A client-supplied percentage is accepted only when it is within five percentage points of the server calculation.

## Registration

Only `ADMIN` and `SUPER_ADMIN` users can register a device. Registration should be performed through an authenticated admin client or an admin UI built on `POST /api/smart-bins`. Save the returned `deviceToken` immediately; it is intentionally not recoverable from the database.

Required calibration values:

- `emptyDistanceCm`: sensor-to-bottom distance for an empty bin.
- `fullDistanceCm`: sensor-to-calibrated maximum-fill distance.
- `emptyDistanceCm` must be greater than `fullDistanceCm`.
- Thresholds and offline timeout are configurable per device.

## ESP32 firmware

`firmware/swms_smart_bin.ino` is a configurable Arduino IDE sketch. Replace the Wi-Fi credentials, API URL, device ID, device token, calibration distances, GPIO pins, and trusted server root CA locally. Do not commit those values.

The sketch uses five valid ultrasonic samples and a median filter, rejects missing/out-of-range readings, calculates a clamped 0–100 fill percentage, synchronizes time with NTP, sends over HTTPS, retries transient failures with backoff, and prints diagnostics over the serial monitor.

## Wiring assumptions and safety

The firmware assumes a common ESP32 DevKit-style board and a JSN-SR04T module with `VCC`, `GND`, `TRIG`, and `ECHO` pins. The exact JSN-SR04T revision must be checked before wiring because board variants differ in voltage and pin labeling.

Provisional pin table used by the sketch:

| JSN-SR04T | ESP32 DevKit | Notes |
|---|---|---|
| VCC | Suitable sensor supply | Confirm the module's rated supply from its datasheet |
| GND | GND | Common ground is required |
| TRIG | GPIO5 | 3.3 V ESP32 output |
| ECHO | GPIO34 through a level shifter or resistor divider if needed | Never connect a potentially 5 V ECHO directly to a 3.3 V GPIO |

Place the waterproof probe above the intended fill surface, keep the controller and breadboard dry, add strain relief, and use a suitable regulated supply. Do not place the electronics inside a wet bin enclosure without appropriate protection. Verify the sensor's ECHO voltage with the actual board documentation or a meter before connecting it.

## Calibration

1. Mount the probe in its final position.
2. Record several readings with the bin empty and use a stable representative distance for `emptyDistanceCm`.
3. Mark the operational maximum fill point, measure it, and use that value for `fullDistanceCm`.
4. Confirm that both values are outside the sensor's blind zone and that irregular waste does not create persistent false echoes.
5. Test with several waste surfaces and adjust filtering/calibration if needed.

The distance formula is:

```text
fill = clamp(((emptyDistance - measuredDistance) /
              (emptyDistance - fullDistance)) * 100, 0, 100)
```

This is an estimate, not a direct volume measurement. Bin geometry, angled surfaces, moisture, sensor blind zones, and environmental conditions can affect accuracy.

## Testing status

Software validation can cover malformed payloads, invalid credentials, duplicate IDs, timestamp windows, threshold transitions, and sensor-error payloads. Physical acceptance remains blocked until a real ESP32 and JSN-SR04T are connected and readings are observed in the deployed SWMS environment. Do not label simulated or software-only readings as live hardware data.
