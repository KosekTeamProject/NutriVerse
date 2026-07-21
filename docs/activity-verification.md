# Activity Verification & Trust Specification

This document details the telemetry tracking, consent procedures, and verification status representations designed to provide a privacy-first, supportive fitness experience.

---

## 1. GPS Location Consent Flow

Travelers are prompted with the `Location Permission for Activity` dialog before starting an active tracker session:
* **Purpose Disclosure:** Location coordinates are used only during active session tracking to calculate distance, velocity, and consistency metrics.
* **Granular Duration:** GPS listening begins only after the traveler presses *Mulai* (Start) and ceases immediately when the session ends or is canceled.
* **Privacy Boundaries:** Raw GPS coordinates are never exposed in public journey streams or sharing cards.

---

## 2. Activity Verification Model

Recorded sessions are evaluated across a five-tier verification schema:

### Verification Statuses
* **`verified` (Verified):** The telemetry log passed all pace, timing, and consistency checks and is eligible for trusted progress systems.
* **`needs-review` (Needs Review):** Some segments require additional validation before rewards can contribute to trusted progress.
* **`not-verified` (Not Verified):** The telemetry data failed validation standards (e.g., duplicate sessions or insufficient duration) and is excluded from rewards.
* **`pending` (Verification in Progress):** Telemetry audit is currently processing.
* **`manual-review` (Manual Review):** Awaiting administrator evaluation.

---

## 3. Personal Record & Downstream Integration

* **Personal History:** Activities that fail telemetry validation (such as `needs-review` or `not-verified`) remain in the traveler's personal activity history.
* **Reward Previews:** Reward metrics display as `Potential XP` / `Eligible XP Preview` rather than granted assets. Balances are not mutated locally.
* **Challenge Integration:** Only `verified` cardio activities contribute automatically to challenge targets like `Light Cardio Journey`.
* **Journey Details:** The Morning Walk Journey details map active progress to verified telemetry sessions.

---

## 4. Simulation Boundaries
* Simulation mode is provided to demonstrate location features indoors.
* Simulated activities are clearly labeled with `Simulation Mode` and are excluded from production verified rewards.
