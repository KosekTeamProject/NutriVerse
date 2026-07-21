# Health Story Caption Personalization

This document details the caption personalization feature added to NutriVerse Health Story previews and exports.

## 1. Caption Modes
- **Gunakan Template (`template`)**: Default mode using the standardized Indonesian product caption `"Tindakan kecil mulai menjadi bagian dari Journey-mu."`
- **Tulis Caption (`custom`)**: Traveler can write a short custom caption (up to 180 characters) with a live character counter and export overflow warnings.
- **Tanpa Caption (`none`)**: Exports the Health Story image without any quote or caption box.

## 2. Share-Draft Isolation & Privacy
- Caption customization is strictly a share-draft presentation value.
- Editing or clearing a caption **never** modifies the canonical `JourneyRecord` (`reflection`, `meaning`, `summary`).
- Captions pass through HTML/control-character sanitization and length bounds.
- Captions are saved per `journeyId` in `localStorage` under `nv-health-story-caption-drafts-v1`.

## 3. Export & Canvas Rendering
- Live preview immediately synchronizes changes between **Square (1:1 / 1080×1080px)** and **Vertical (9:16 / 1080×1920px)** card previews.
- Controls, character counters, and editor inputs never appear inside the generated PNG canvas or exported blob.
- Web Share integration passes the generated PNG file directly to native share targets.
