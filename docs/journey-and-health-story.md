# Journey and Health Story

This documentation outlines the design and implementation details of the Journey history log and Health Story visual sharing feature in NutriVerse.

## Journey Purpose
The Journey is designed to capture a private, reflective history of a traveler's healthy habits, active workouts, nutritional achievements, and recovery reflections. It reinforces positive behaviors through a chronological, calm timeline of safe wellness metrics, separating private medical logs from shareable metrics.

## Canonical Journey Data
Loaded from a centralized registry at [`data.ts`](file:///c:/dev/NutriVerse/src/features/journey/data.ts), the dataset contains 8 deterministic records for traveler **Fathan** (Day 148):
1. **Morning Walk** (`journey-morning-walk`): A public, verified cardio workout that acts as the primary activity log.
2. **Protein Progress** (`journey-protein-progress`): A circle-visible nutrition log.
3. **Light Recovery** (`journey-light-recovery`): A private, self-reported stretching session.
4. **Seven-Day Consistency** (`journey-seven-day-consistency`): A circle-visible habit streak log.
5. **Light Cardio Journey Progress** (`journey-cardio-challenge-progress`): A public challenge milestone.
6. **Health Pulse Improvement** (`journey-pulse-improvement`): A public score milestone tracking the progression of Fathan's pulse from 76.8 to 78.0 (+1.2).
7. **Personal Reflection** (`journey-personal-reflection`): A private reflection on hydration obstacles.
8. **Hydration Progress** (`journey-hydration-progress`): A private log of daily water intake.

## Core Taxonomy

### 1. Categories
- `activity` (Cardio & Mobility)
- `nutrition` (Nutrition & Eating)
- `recovery` (Recovery & Sleep)
- `consistency` (Consistency Streak)
- `challenge` (Active Challenge)
- `health-pulse` (Health Pulse)
- `reflection` (Personal Reflection)
- `lifestyle` (Healthy Habit)

### 2. Trust Levels
- `verified` (automatic sensor validation)
- `partially-verified` (verified inputs or matching logic checks)
- `self-reported` (manual logs)
- `simulated` (simulated test scenarios)
- `unverified` (unverified records)

### 3. Visibility
- `private`: Visible only to the traveler.
- `circle`: Shared within the Healthy Circle using safe wellness aggregations.
- `public`: Safe for generating public Health Story assets.

## Privacy & Share Eligibility Rules
To protect user privacy:
- Private logs (e.g. Personal Reflection, Light Recovery, Hydration Progress) are blocked from public sharing.
- Safe display helpers filter out raw inputs (like exact sleep durations, private reflections, and latitude/longitude GPS files) to export only high-level milestones.
- Blocking rules are validated programmatically at the component layer before any visual previews are enabled or export controls are clicked.

## UI Presentation
- **Timeline Overview (`/journey`):** A chronological path displaying milestones, categories, and metrics. Features category filtering without search queries.
- **Detail Route (`/journey/[journeyId]`):** Deep dive into a specific milestone showing reflections, trust badges, privacy notices, and the Health Story creator on eligible paths. Invalid IDs render `notFound()`.

## Health Story Experience
Eligible public milestones display a **Health Story Preview** section allowing users to choose between two aspect ratios:
* **Square Format (1:1):** Tailored for standard 1080x1080px image sharing.
* **Vertical Format (9:16):** Tailored for standard 1080x1920px vertical story formats.

### Zero-Dependency PNG Export
To avoid installing heavy export packages, the client component [`HealthStoryActions.tsx`](file:///c:/dev/NutriVerse/src/features/journey/components/HealthStoryActions.tsx) uses the HTML5 Canvas 2D API to render the card offscreen.
* Draws background color gradients and overlay visual glows.
* Renders text labels (category tags, title, summary, metric parameters, date, and traveler initials) dynamically.
* Converts the canvas image to a PNG Blob.

### Web Share Capability & Fallbacks
When sharing is triggered:
1. **Web Share API (`navigator.share`):** Inspects browser native sharing capabilities for PNG files. If supported, triggers the browser share sheet.
2. **Aborted Shares:** Gracefully clears loading states without displaying errors if the user cancels.
3. **Safe Download Fallback:** If the browser lacks native file sharing, the component programmatically creates a temporary `<a>` element to trigger a local download of the PNG (named using the formatted and sanitized title: `nutriverse-[title]-story.png`).

## Mock & MVP Limitations
- **Simulated Storage:** Data writes and privacy visibility flags are client-managed in React state and do not persist across page loads.
- **Deferred Server Privacy:** Full server-side authorization filters and database RLS enforcement will be implemented during Phase 3 database integration.
