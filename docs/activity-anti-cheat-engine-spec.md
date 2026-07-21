# Activity Anti-Cheat Engine Specification

This specification defines the production validation architecture and algorithms designed to detect telemetry anomalies and verify GPS-tracked wellness progress.

---

## 1. Speed Thresholds (GPS Pacing)

Movement speed is computed incrementally between sequential telemetry coordinates. Segments exceeding the following maximum thresholds are classified as vehicle-aided and flag the session for manual review:

| Activity Kind | Target Pace / km | Max Velocity (Kmh) |
|---|---|---|
| **Walking (`walk`)** | $\ge 6.0\text{ min/km}$ | $10\text{ km/h}$ |
| **Running (`run`)** | $\ge 3.0\text{ min/km}$ | $20\text{ km/h}$ |
| **Cycling (`bike`)** | $\ge 1.2\text{ min/km}$ | $50\text{ km/h}$ |

---

## 2. Telemetry Signal Quality Criteria

Telemetry logs are subjected to the following quality checks before verification is approved:

1. **Displacement Jump Check:** Displacements between samples with timestamps $\Delta t < 2\text{s}$ that require velocities $> 150\text{ km/h}$ are flagged as teleportation or signal bounces.
2. **Signal Discontinuity (Gaps):** Continuous tracking intervals with signal dropout gaps exceeding $120\text{ seconds}$ are analyzed for battery-saving browser lock suspension or signal manipulation.
3. **Accuracy Degradation:** Horizontal accuracy circles exceeding $35\text{ meters}$ are discarded from path length integration.
4. **Timestamp Monotonicity:** Sequence packets with out-of-order timestamps or duplicate index counts are rejected immediately.

---

## 3. Sensor Spoofing & Replay Mitigation

To protect reward integrity, backend validation endpoints must implement:

- **Hardware Attestation:** Validation of platform device integrity tokens (e.g., Apple DeviceCheck / Google Play Integrity) to verify that raw location telemetry originates from verified native sensors rather than simulated browser endpoints.
- **Idempotency Boundaries:** Cryptographic signatures of telemetry runs matched against a deduplication store to prevent session replay attacks.
- **Fingerprinting:** Checking GPS path patterns against known emulator route generation scripts.

---

## 4. Privacy-Preserving Summary Protocols

* Raw latitude and longitude coordinates must be excluded from journey sharing endpoints.
* Visual maps are rendered client-side using localized coordinates and not stored in public sharing logs.
* Public summaries display only aggregated distance, active duration, and average pace to safeguard Traveler privacy.
