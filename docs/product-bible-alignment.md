# NutriVerse Bible Alignment & Rationalization Report

This document summarizes the alignment, feature rationalization, and system boundaries implemented for NutriVerse in accordance with the authoritative Product Bible Book.

## 1. Feature Rationalization & Consolidation
- **Nora Chat Relocation**: Nora Chat is completely removed from the Food Scanner (`/scan`). All conversational Nora interactions are consolidated into a single typing chat inside `/companion`.
- **Contextual Nora Cards**: Preserved contextual Nora insight cards across Dashboard, Today's Journey, Health Pulse, Journey, Food Scanner, and Activity.
- **Scanner Secondary Action**: Added `Tanyakan hasil ini kepada Nora` linking to `/companion?analysis=...` to pass safe contextual references without exposing private health data in the URL.
- **Daily Challenge Selection**: System automatically selects 3 primary daily challenges deterministically; optional challenges are kept secondary.
- **Community & Leaderboard Scope**: Leaderboard rankings are labeled as `Data peringkat demonstrasi`. Healthy Circle is kept safe with encouragement actions and privacy minimization.
- **Reward Store Boundaries**: Digital demo rewards (badges, frames) remain redeemable; partner vouchers and merchandise items are explicitly marked with `Requires Partner Integration`.

## 2. Health Pulse 5 Weighted Dimensions
- **Dimension Weights**:
  1. Nutrition — 30%
  2. Activity — 25%
  3. Sleep — 20%
  4. Hydration — 15%
  5. Weight Management — 10%
- **Consistency Indicator**: `Consistency` is removed from the 5 weighted dimensions and presented as `Indikator Konsistensi` with 7-day pattern trends.
- **Score Overlap Fix**: Replaced absolute percentage transforms with flex/grid centering inside the score ring, enforcing a single visible score (`78.0`) with `tabular-nums`.
- **Weight Privacy**: Weight Management remains private by default and is never exposed in public Leaderboard or Healthy Circle views.

## 3. Conversational Nora in Companion (`/companion`)
- **Interactive Typing Chat**: Added `Percakapan dengan Nora` with message history, Traveler/Nora alignment, quick prompt suggestions, and a multiline `<textarea>` (Enter to send, Shift+Enter for new line).
- **Indicator & Accessibility**: Added `Nora sedang mengetik` with 3 dots that pause on `prefers-reduced-motion: reduce`, paired with `aria-live="polite"`.
- **Safety Boundaries**: Added medical advice fallback: *"Aku dapat membantu dengan panduan kebugaran sehari-hari, tetapi tidak dapat mendiagnosis kondisi medis atau menggantikan tenaga kesehatan profesional."*
- **MVP Disclosure**: Clear contextual disclosure stating that responses use structured contextual data for demonstration purposes.

## 4. GPS Verification Wording & Balance Transparency
- **Browser GPS Demarcation**: Labeled browser GPS logs as `Demo Validation Passed` / `Eligible after server validation`.
- **Server Verification Notice**: Displayed clear supporting text: *"Aktivitas ini memenuhi pemeriksaan demonstrasi saat ini. Verifikasi produksi memerlukan pemrosesan server."*
- **Topbar XP/HP Balances**: Distinctly marked topbar balances with `Demo` labels.

## 5. Indonesian Product Language Unification
- Standardized UI copy across all pages to Indonesian while preserving core branded terms (`NutriVerse`, `Journey`, `Health Pulse`, `Nora Companion`, `Healthy Circle`, `Health Story`, `Progress XP`, `HP`).
