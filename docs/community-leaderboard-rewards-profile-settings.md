# Community, Leaderboard, Rewards, Profile, and Settings Upgrades

This document outlines the refactoring, alignment, and integration of the existing social, competitive, reward, identity, and preference features under the unified NutriVerse system.

---

## 1. Healthy Circle (Community)

The existing Community route (`/komunitas`) is upgraded to a health-focused **Healthy Circle** experience:
* **Positioning:** Visually shifted from a general-purpose social feed to a supportive circle for sharing verified landmarks, consistency highlights, and active recovery reflections.
* **Safe Shared Content:** Shared milestones display general consistency alerts (e.g., `"Fathan Mubarak completed a 7-day consistency streak"`) and exclude raw coordinates, specific nutrition logs, or health score evaluations.
* **Encouragement System:** Visual reactions are labeled as `"Beri Semangat"` (Encourage) or `"Komentar Dukungan"` (Supportive Comments).
* **Privacy:** A prominent privacy card detailing traveler autonomy and share limits is rendered on the sidebar.

---

## 2. Consistency Leaderboard

The competitive ranking route (`/leaderboard`) is repositioned to reduce game-first gamification pressure:
* **Metrics:** Highlights consistency streaks (consecutive days) and verified GPS physical distances rather than raw gamified values.
* **Traveler Highlight:** Fathan Mubarak is set as the active traveler (`you: true`) with realistic, non-dominant positions across different scope tabs.
* **Safety Banner:** Prominently details the `Fair and Supportive Ranking` parameters.

---

## 3. Simulated Rewards Store

The Rewards Catalogue (`/reward`) showcases digital and partnership incentives without implying real-world financial fulfillment:
* **Simulated Balance:** Labeled clearly as `Demo HP Balance (Simulated)`, showing $3,280\text{ HP}$ available in local memory.
* **Simulation Boundaries:** Purchase actions are styled as `Simulate Redemption` or `Preview Redemption` and decrement local balances without communicating with a billing server.

---

## 4. Personal Profile & settings

### Personal Profile (`/profil`)
* **Identity:** Displays Fathan Mubarak, Journey Day 148, Radiant Division II.
* **Metric Integration:** Connects with the canonical Health Pulse score (78, Flourishing), consistency streak (7 days), active challenge, and verified activity count.
* **Privacy summary:** Renders current visibility guidelines and logs private macros as strictly hidden.

### Settings Panel (`/pengaturan`)
Organizes settings preferences into:
1. **Profil & Target:** Edits names, bio text, and daily wellness targets.
2. **Appearance:** Controls light/dark themes, preserving local theme integrations.
3. **Privacy Settings:** Toggles profile visibility, pulse score sharing, and exercise visibility.
4. **Nora Companion:** Controls Morning Brief, insights cards, and safety checks.
5. **Latihan & Lokasi:** Outlines location consent guidelines.
6. **Demo & Simulasi:** Configures simulated locations and mock datasets.
7. **Data Control:** Allows clearing browser local storage.
