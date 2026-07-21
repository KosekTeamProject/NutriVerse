# Nora Companion

The Nora Companion is an AI-inspired wellness guide within NutriVerse, designed to provide contextual reflections, morning briefs, and weekly reports.

## Purpose

To provide a calm, encouraging presence that helps travelers navigate their daily wellness habits. Unlike generic chatbots, Nora does not support infinite conversational prompts or raw chat loops. Instead, it interprets structured wellness summaries, maps consistency metrics, and offers exactly one actionable next step.

## Domain & Taxonomies

### 1. Insight Types
- `morning-brief` (Daily featured advice)
- `activity-reflection` (Reflecting on workout logs)
- `nutrition-insight` (Interpreting macronutrient consistency)
- `recovery-insight` (Supporting restoration habits)
- `consistency-insight` (Streak patterns)
- `journey-reflection` (Journey milestone meanings)
- `health-pulse-interpretation` (Explaining score swings)
- `challenge-guidance` (Milestone prompts)
- `weekly-letter` (Cycle summaries)
- `safety-reminder` (Cautious workout suggestions)
- `general-guidance` (Encouragement)

### 2. Priority & Tone
Nora uses clear priorities (`low`, `normal`, `high`, `safety`) and maintains a calm, reflective, and encouraging tone. Under no circumstances does Nora use competitive or punitive language.

## Privacy & Data Minimization
Nora operates on aggregated progress summaries. Full raw logs (e.g. precise food logs, auth IDs, coordinates) are strictly isolated and never sent to any model.

## Integrations

1. **Living Home:** Displays the featured Morning Brief using `CompanionCard` in the hero layout, and embeds the Weekly Letter preview link in the Reflection section.
2. **Health Pulse (`/health-pulse`):** Displays a compact interpretation card below detailed score charts.
3. **Journey Timeline & Detail:** Displays contextual reflections inline to ground activities in daily habit consistency.
4. **Aktivitas (`/aktivitas`):** Displays activity reflections beneath GPS trackers.
5. **Challenge Hub (`/challenge`):** Displays challenge guidance to encourage progress without pressure.
6. **Weekly Letter (`/companion/weekly-letter`):** Renders a structured report of highlights and next steps.
7. **Companion Hub (`/companion`):** Serves as Nora's central feed, organizing insights by category.

## Safety & Medical Boundaries
Nora is strictly a wellness guide:
- **No medical advice:** Nora does not diagnose, prescribe medication, or offer treatment suggestions.
- **Dedicated Safety Note:** High-priority safety warnings ("Progress should never come before safety") are visually highlighted with informational styling.
- **No Game/Reward Actions:** Nora cannot verify activities, mark challenges complete, or award XP or HP.

## Simulation Status & Real AI status
- **Zero Live API Keys:** In the current MVP, Nora runs on deterministic simulation datasets defined in [`data.ts`](file:///c:/dev/NutriVerse/src/features/companion/data.ts). No live Gemini integrations or prompt wrappers are initialized.
- **Deferred Persistence:** Memory logs, dismissing alerts, and backend persistence will be configured in subsequent sprints.
