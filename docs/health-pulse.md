# Health Pulse

The Health Pulse is a comprehensive metric designed to capture the traveler’s wellness habits across five primary wellness coordinates. It rejects medical diagnostic models in favor of a reflective progress index.

## Purpose

To track daily habits and consistency trends, giving travelers clear feedback on their daily actions and focus areas.

## Five Wellness Dimensions

1. **Activity:** Represents cardio workouts, steps, and general physical active time (current: 84%).
2. **Nutrition:** Focuses on nutritional targets like protein minimums and macro splits (current: 72%).
3. **Recovery:** Highlights restorative sleep, active stretching, and rest cycles (current: 68%).
4. **Consistency:** Reflects habit streak repetitions and daily log continuity (current: 86%).
5. **Lifestyle:** Captures general habits like hydration and study break exercises (current: 70%).

## Taxonomy & Boundaries

### 1. Status Levels
- `seed`
- `growing`
- `balanced`
- `flourishing` (Current status)
- `thrive`

### 2. Trend Indices
- `improving` (Current trend)
- `stable`
- `recovering`
- `needs-attention`

### 3. Trust Levels
- `trusted` (sensor validation)
- `partially-verified` (verified inputs or logic checks)
- `self-reported` (manual logs)
- `simulated` (simulated scenarios)
- `missing` (no logged data)

## Non-Medical Boundaries & Disclaimer
The Health Pulse is strictly an educational tool. The UI shows a clear disclaimer on detailed screens:
> **A Wellness Guide, Not a Medical Diagnosis**
> Health Pulse helps you understand patterns in your daily wellness habits. It does not diagnose medical conditions or replace advice from qualified health professionals.

Furthermore, missing data is treated as neutral rather than a negative indicator.

## Canonical Data Snapshots

### Current Snapshot (`health-pulse-current`)
- **Score:** 78.0
- **Previous Score:** 76.8
- **Change:** +1.2
- **Status:** flourishing
- **Trend:** improving
- **Strongest Dimension:** consistency (86%)
- **Focus Dimension:** recovery (68%)
- **Data Completeness:** 86%
- **Recommended Next Action:** "A light recovery walk may help balance today’s progress."

### 14-Day History Trend
A deterministic 14-day history score curve maps gradual habit progress:
`73.2, 73.8, 74.1, 74.9, 75.4, 75.0 (modest dip), 75.6 (recovery), 76.1, 76.4, 76.8, 76.5 (modest dip), 77.1 (recovery), 77.6, 78.0`

## Integrations

1. **Living Home:** The dashboard replaces local mock data with the new shared compact `HealthPulseCard` referencing `currentSnapshot` and links directly to `/health-pulse`.
2. **Journey History:** Renders before/after pulse deltas (e.g. `76.8 -> 78.0` for Morning Walk) on public segments. Private dimension details remain hidden from public views.
3. **Health Story Sharing:** Renders safe, public-safe pulse change summaries (`+1.2`) on generated sharing formats while hiding trust scores and data completeness details.
4. **Nora AI Brief:** Features a simulatedstatic interpretation on detailed pages.

## Architecture & Simulation
- **No Production Formula:** Score numbers are static mock values defined in [`data.ts`](file:///c:/dev/NutriVerse/src/features/health-pulse/data.ts) to represent a realistic, consistent client demo.
- **Deferred Persistence:** Auth validation, DB writes, and real-time backend updates will be integrated during the database phase.
