# Companion Display-Name Personalization

This document explains the Companion display-name customization system in NutriVerse.

## 1. System Identity vs. Display Name
- **Product Identity**: `Companion` remains the authoritative product system identity.
- **Default Display Name**: `Nora` is the default display name.
- **Customization Scope**: Travelers can set a personalized display name (2–24 characters) during onboarding or in Settings.

## 2. Shared Name Hook & Storage
- Managed by `useCompanionName()` reading/writing `localStorage` key `nv-companion-name-v1`.
- Server-side rendering always falls back gracefully to `"Nora"` to eliminate hydration mismatches.
- `sanitizeCompanionDisplayName()` trims whitespace, collapses spaces, strips HTML/control characters, and enforces length bounds.

## 3. Application-Wide Synchronization
The resolved display name is synchronized across all UI surfaces:
- Dashboard Morning Brief
- Companion Hub & Typing Chat (`{name} sedang mengetik`, `Percakapan dengan {name}`)
- Today's Journey guidance
- Health Pulse interpretation
- Food Scanner CTA (`Tanyakan hasil ini kepada {name}`)
- Settings Panel (inline editor + "Kembalikan ke Nora" action)
- Onboarding name field

## 4. Safety & Boundary Integrity
- Changing the display name does **not** change AI boundaries or system rules.
- The Companion never diagnoses medical conditions, calculates Health Pulse, verifies GPS, or awards XP/HP.
