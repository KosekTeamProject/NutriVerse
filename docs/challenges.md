# Upgraded Challenges Hub

The Challenge Hub is a consistency motivation feature within NutriVerse, designed to help travelers complete daily, weekly, and monthly targets across various fitness and wellness categories.

## Foundation & Upgrades

This feature is an upgrade and integration of the existing challenge prototype rather than a newly generated system:
* **Preserved Daily Selection:** The deterministic picker algorithm is preserved, selecting exactly 3 daily challenges from a pool using date keys to avoid hydration mismatches.
* **Preserved Automatic Completion:** Cardio and mobility challenges continue to track automatically from activity telemetry data without manual validation steps.
* **Self-Reported Actions:** Manual categories (such as strength exercises, hydration goals, and recovery logs) maintain their checkboxes labeled clearly as *Self-Reported* actions.

---

## Domain & Taxonomies

### 1. Challenge Period
- `harian` (Daily)
- `mingguan` (Weekly)
- `bulanan` (Monthly)

### 2. Challenge Categories
- `cardio` (Cardio activities like lari, sepeda)
- `mobility` (Mobility/jalan)
- `strength` (Strength exercises like plank, pushups)
- `nutrition` (Balanced nutrition targets)
- `recovery` (Sleep and stretching targets)
- `habit` (Healthy habits like hydration)

### 3. Source Mode
- `automatic-activity` (GPS-based tracking updates)
- `automatic-system` (System generated checks)
- `manual-confirmation` (Traveler checklist checkboxes)
- `optional-selection` (Optional challenges)
- `simulated` (Mock competition records)

### 4. Trust Level
- `verified` (GPS validated runs/walks)
- `partially-verified` (Structured confirmed scanner inputs)
- `self-reported` (Manual traveler checks)
- `simulated` (Deterministic mock data)
- `mixed` (Mixed verification sources)
- `missing` (No telemetry source)

---

## Integrations

1. **Living Home:** Displays a featured summary block of the primary `Light Cardio Journey` (7.2 / 10 km, 72% completed) with a link pointing directly to `/challenge/challenge-light-cardio`.
2. **Today's Journey:** Embeds active challenge progression as a core milestone contribution.
3. **Journey Detail:** Shows how verified walking segments contribute to the weekly cardio targets.
4. **Nora Companion:** Analyzes the active challenge progress to offer encouraging, safe next-steps.

---

## Safety & Reward Disclaimers

### Fair Progress
- GPS-based challenges require trusted, validated activity.
- Manual checklist items are self-reported and do not become verified.
- Rest/recovery is recognized as healthy progress.
- Missing data is treated neutrally.
- Suspicious activity is not treated as proof of intentional cheating.

### Reward-Preview Boundary
All rewards display as previews (`Potential XP`, `Potential HP`) with the note: *"Potential reward after verified completion. Only trusted activity contributes to this Challenge."* Real balances are not mutated on the client.

---

## Simulation Status & Deferred Work
* **No Database Sync:** Completing manual challenges and tracking GPS metrics are evaluated in local/simulated states.
* **Deferred Verification:** Backend validations of telemetry route anti-cheat parameters and reward transactions are deferred to subsequent backend sprints.
