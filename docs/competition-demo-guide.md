# NutriVerse Competition Demo Guide

This guide outlines the step-by-step narration, click sequence, and technical rationale for presenting the NutriVerse wellness platform to judges.

---

## 1. Demo Objective
Demonstrate how NutriVerse supports a traveler’s sustainable health journey through small, verified, privacy-safe everyday actions guided by **Nora, the Health Companion**.

---

## 2. Canonical Scenario
* **Traveler:** Fathan Mubarak (Day 148, Radiant Division II, 7-day consistency streak)
* **Goal:** Morning Walk (1.4 km verified, target 2.0 km)
* **Status:** Health Pulse is 78.0 (Flourishing, +1.2 improvement)

---

## 3. Route Sequence
1. **Living Home:** `/dashboard`
2. **Today’s Journey:** `/todays-journey`
3. **Consistency Heatmap:** `/healthy-days`
4. **Your Journey (Timeline):** `/journey`
5. **Journey Detail & Health Story:** `/journey/journey-morning-walk`
6. **Health Pulse Details:** `/health-pulse`
7. **Nora Companion Hub:** `/companion`
8. **Weekly Letter:** `/companion/weekly-letter`
9. **Activity Hub:** `/aktivitas`
10. **Activity Trust & Safety:** `/aktivitas/kepercayaan`
11. **Food Scanner & Logger:** `/scan`
12. **Lingkaran Sehat (Community):** `/komunitas`
13. **Consistency Leaderboard:** `/leaderboard`
14. **Simulated Rewards Store:** `/reward`
15. **Traveler Profile:** `/profil`
16. **Settings Panel:** `/pengaturan`

---

## 4. Step-by-Step Click Sequence & Presenter Narration

### Step 1: Living Home (`/dashboard`)
* **Click:** Open [`/dashboard`](file:///c:/dev/NutriVerse/src/app/(app)/dashboard/page.tsx).
* **Narration:** *"Welcome to the NutriVerse Living Home. Our traveler Fathan Mubarak is on Day 148 of his Journey, holding a 7-day consistency streak. Nora greeting highlights his wellness highlights for the day, suggesting a morning walk and balanced nutrition."*
* **Proves:** Home screen integrates Companion briefings, Health Pulse, and daily checklists in a clean, non-overwhelming visual structure.

### Step 2: Today’s Journey (`/todays-journey`)
* **Click:** Click **Continue Journey** in the Today’s Journey card (opens `/todays-journey`).
* **Narration:** *"Today’s Journey tracks daily goals with clear verification status. Fathan’s Morning Walk is automatically verified via browser telemetry, his protein intake is partially verified, and hydration is self-reported."*
* **Proves:** Differentiates verified data sources from self-reported inputs.

### Step 3: Healthy Days Heatmap (`/healthy-days`)
* **Click:** Click **View Healthy Day History** (opens `/healthy-days`).
* **Narration:** *"Here we see Fathan's 28-day Healthy Day heatmap. Recovery days count as progress. Missing data is treated neutrally and never penalized. Consistency is about long-term rhythm."*
* **Proves:** Healthy Days engine supports active recovery rather than calorie-deficit shaming.

### Step 4: Your Journey Timeline (`/journey`)
* **Click:** Click **Journey** in the sidebar (opens `/journey`).
* **Narration:** *"Your Journey compiles the chronological log of Fathan's path. Each segment is associated with its specific meaning, trust metrics, and private reflections."*
* **Proves:** Private timeline mapping for personal habits.

### Step 5: Journey Detail & Health Story (`/journey/journey-morning-walk`)
* **Click:** Locate **Morning Walk** card, click **View Details** (opens `/journey/journey-morning-walk`).
* **Narration:** *"Here Fathan inspects the Morning Walk details. He can generate a Health Story preview in square or vertical format, ready for safe sharing with friends without exposing private data or coordinates."*
* **Proves:** Image export and share fallbacks operate safely.

### Step 6: Health Pulse Details (`/health-pulse`)
* **Click:** Click **Health Pulse** in the sidebar (opens `/health-pulse`).
* **Narration:** *"Health Pulse summarizes 14 days of wellness. The score is 78.0, Flourishing, showing a +1.2 improvement. Nora provides detailed dimension-by-dimension guidance."*
* **Proves:** Non-clinical wellness indexes and multi-dimensional analysis.

### Step 7: Nora Companion Hub & Weekly Letter
* **Click:** Click **Companion** (opens `/companion`), then click **Read Weekly Letter** (opens `/companion/weekly-letter`).
* **Narration:** *"The Weekly Letter summarizes Fathan’s growth areas. It encourages recovery focus and hydration rhythm for the upcoming week."*
* **Proves:** Relational, supportive AI guidance.

### Step 8: Activity Tracker & Trust & Safety
* **Click:** Click **Aktivitas** (opens `/aktivitas`), then click **Trust & Safety** (opens `/aktivitas/kepercayaan`).
* **Narration:** *"Aktivitas tracks real exercise. The Trust & Safety page explains telemetry verification checks like average pace and signal intervals to avoid cheating."*
* **Proves:** Telemetry audit guidelines.

### Step 9: Food Scanner & Logger (`/scan`)
* **Click:** Click **Scan Makanan** (opens `/scan`). Select **Balanced Breakfast** from the demo meals.
* **Narration:** *"The scanner allows snapping or selecting demo meals. Fathan confirms the breakfast identity to log it as 'confirmed' rather than raw calorie counting."*
* **Proves:** Privacy-aware image logging and estimated nutrition safety.

### Step 10: Healthy Circle, Leaderboard & Rewards
* **Click:** Walk through `/komunitas`, `/leaderboard`, and `/reward`.
* **Narration:** *"Fathan shares only public-safe milestones to the Healthy Circle feed. The Leaderboard displays consistency rankings. The Reward Store offers simulated redemptions."*
* **Proves:** Safe group motivation, supportive standings, and simulated rewards.

---

## 5. Judge Q&A

1. **Is Health Pulse medically validated?**
   * *Answer:* No, Health Pulse is a mock wellness index. It is designed to track progress patterns and does not diagnose conditions.
2. **Is Gemini live?**
   * *Answer:* No, the current implementation uses deterministic mock rules to guarantee smooth offline-ready presentations.
3. **Is the Food Scanner real AI?**
   * *Answer:* The scanner supports client-side simulation. Image analysis is simulated using pre-defined deterministic datasets.
4. **How is GPS privacy protected?**
   * *Answer:* Raw coordinate logs remain private on the browser. Shared stories and community feeds display only aggregate distance milestones.

---

## 6. Pre-Demo Checklist
* `[x]` App runs successfully locally.
* `[x]` TypeScript check compiles with 0 errors.
* `[x]` Lint checks pass with 0 warnings.
* `[x]` All route paths verify and render.
* `[x]` Simulated datasets map to Fathan Mubarak.
* `[x]` Web Share falls back to PNG download on desktop.
