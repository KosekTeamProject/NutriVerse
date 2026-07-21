# Living Home

The Living Home acts as the personalized, health-first entry portal for Travelers when navigating to the `/dashboard` route in NutriVerse. It rejects typical gamified HUD or admin dashboard aesthetics in favor of a clean, calm, and reflective interface.

## Purpose

To orient the user at the start of their daily health journey, presenting:
- Personalized AI coaching recommendations (via Nora).
- Comprehensive daily consistency summaries.
- Reflective wellness pulse tracking indicators.

## Canonical Demo Profile

The home screen showcases a single canonical, deterministic profile loaded from [`demo-data.ts`](file:///c:/dev/NutriVerse/src/features/demo/demo-data.ts):
- **Traveler Name:** Fathan
- **Journey Day:** 148
- **Streak Status:** 7-day consistency streak
- **Health Pulse:** 78.0 (Flourishing status, delta +1.2 relative to 76.8)
- **Today's Journey Progress:** 64% complete
- **Main activity:** Morning Walk (1.4 km)
- **Primary challenge:** Light Cardio Journey (7.2 / 10 km)

## Home Sections

1. **Header:** Displays traveler's greeting, Journey Day count, and active streak index.
2. **Nora Morning Brief:** Conversational coaching suggestion based on logged details, pointing the user directly to the activity tracker (`/aktivitas`).
3. **Health Pulse Card:** Custom circular gauge outlining a 5-dimension breakdown:
   - *Activity* (84%)
   - *Nutrition* (72%)
   - *Recovery* (68%)
   - *Consistency* (86%)
   - *Lifestyle* (70%)
4. **Today’s Journey Card:** Progression metric showcasing daily goals and their verification attributes (`Verified`, `Partially Verified`, `Self-Reported`, `Completed`).
5. **Recent Journey Card:** Detail log outlining the traveler's last completed physical segment and its impact on the Health Pulse change score.
6. **Weekly Reflection Card:** Summarized reflection of the user's weekly patterns.
7. **Active Challenge Card:** Status widget representing the primary challenge details, potential rewards, and progress meters.

## Non-Medical & Reward Boundaries

- **Disclaimer:** The Health Pulse card features a clear footer: *"A wellness guide, not a medical diagnosis."* to avoid medical claim risks.
- **Reward Claiming:** The home dashboard does not allow users to claim rewards or toggle completion checkboxes. Potential rewards are marked as *"Potential reward after verified completion"* to indicate server-trust requirements.

## Legacy Route Compatibility

All pre-existing app routes are preserved:
- [`/scan`](file:///c:/dev/NutriVerse/src/app/(app)/scan/page.tsx)
- [`/aktivitas`](file:///c:/dev/NutriVerse/src/app/(app)/aktivitas/page.tsx)
- [`/challenge`](file:///c:/dev/NutriVerse/src/app/(app)/challenge/page.tsx)
- [`/leaderboard`](file:///c:/dev/NutriVerse/src/app/(app)/leaderboard/page.tsx)
- [`/komunitas`](file:///c:/dev/NutriVerse/src/app/(app)/komunitas/page.tsx)
- [`/reward`](file:///c:/dev/NutriVerse/src/app/(app)/reward/page.tsx)
- [`/profil`](file:///c:/dev/NutriVerse/src/app/(app)/profil/page.tsx)
- [`/pengaturan`](file:///c:/dev/NutriVerse/src/app/(app)/pengaturan/page.tsx)
- [`/onboarding`](file:///c:/dev/NutriVerse/src/app/(app)/onboarding/page.tsx)

## Deferred Features
- **Prisma & Supabase Database:** Authentication, secure data writing, and session checks are bypassed using mock context.
- **AI Integrations:** Live Gemini prompt completions are mocked using static response trees.
