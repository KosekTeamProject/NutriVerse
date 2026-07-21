# Behavior Engine

The Behavior Engine is a client-side system within NutriVerse that helps travelers track daily wellness pacing parameters, consistency streaks, and healthy days.

## Purpose
To encourage daily progress through balanced activity, nutrition, hydration, and recovery targets without pressure or shame. It highlights consistency patterns over individual day outcomes and respects self-reported entries.

## Domain & Taxonomies

### 1. Goal Period
- `daily` (Default tracking interval for goals)
- `weekly`
- `monthly`
- `journey`

### 2. Goal Category
- `activity` (Cardio, walking, running)
- `nutrition` (Macronutrients, proteins)
- `hydration` (Water intake)
- `recovery` (Sleep, stretching)
- `consistency` (Streak achievements)
- `lifestyle` (Everyday habits)
- `challenge` (Longer-term milestones)

### 3. Goal Metric
- `distance-km`
- `duration-minutes`
- `activity-count`
- `protein-grams`
- `hydration-liters`
- `sleep-hours`
- `healthy-actions`
- `consistency-days`
- `challenge-progress`
- `boolean-confirmation`

### 4. Goal Trust Level
- `verified` (Validated activity data from browser tracker)
- `partially-verified` (Structured scans verified via lightweight heuristic checks)
- `self-reported` (Manually logged by traveler)
- `simulated` (Mock datasets for demonstration)
- `missing` (No telemetry source available)

### 5. Goal Status
- `not-started`
- `in-progress`
- `completed`
- `still-growing` (Incomplete progress, framing positive motivation instead of failure)
- `paused`
- `unavailable`

### 6. Goal Source Type
- `activity`
- `food-entry`
- `hydration-log`
- `recovery-log`
- `habit-log`
- `challenge`
- `streak`
- `system`
- `manual-confirmation`

### 7. Goal Privacy
- `private` (Logs like food lists, sleep notes, hydration)
- `circle` (Streak accomplishments visible to Healthy Circle)
- `public` (Standard milestones)

---

## Behavior Engine Concepts

### Today's Journey
Aggregates the daily targets (pacing progress) and serves as the visual overview for today's pacing status. Today's progress is defined deterministically as `64%` in-progress.

### Healthy Day
Evaluated by completing at least 3 contributing actions. If a traveler focuses on rest or stretching, today is classified as a `Recovery Day` which fully qualifies as a Healthy Day. No "failure" or "broken streak" states exist.

### Consistency Streak
Streaks are calculated without using browser time to avoid timezone drift errors. Streaks are protected when:
- The traveler completes a Recovery Day (`recoveryProtected`).
- The traveler has a `Streak Freeze` available to prevent losing progress.

### Reward Preview Boundary
Previews estimated XP and HP potential rewards (`+180 XP`, `+60 HP`). Rewards are presentation-only and do not alter state balances directly on the client.

---

## Integrations & Compatibility

1. **Living Home:** Displays a featured summary card of Today's Journey containing walk, protein, and water progress.
2. **Journey:** Displays Today's Journey pacing indicators to highlight daily contributions.
3. **Health Pulse:** Confirms how verified actions and consistency patterns support pulse shifts.
4. **Nora Companion:** Analyzes current pacing parameters to offer encouraging, safety-conscious contextual briefs.
5. **Challenge Hub:** Embeds active cardio challenge progress (`7.2 / 10 km`).

---

## Simulation Status & Deferred Work
* **No Live Database:** Today's Journey logs, streak counters, and heatmaps operate on a deterministic simulator defined in [`data.ts`](file:///c:/dev/NutriVerse/src/features/behavior/data.ts).
* **Deferred Server Verification:** Awarding XP/HP, updating challenge scores, and resolving timezone-accurate streak freezes are deferred to subsequent backend development sprints.
