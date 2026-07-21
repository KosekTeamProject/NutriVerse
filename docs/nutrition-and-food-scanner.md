# Nutrition and Food Scanner

The NutriVerse Food Scanner and AI Chat (Nora Conversation) provides travelers with a structured, supportive environment to log food and build balanced dietary patterns.

---

## 1. Scanner Foundation & Simulation

The upgraded food scanner preserves the core camera, upload, and manual entry interactions while resolving clinical safety risks:
* **Image Input Privacy:** Uploaded images are utilized for localized simulation analysis and are not transmitted to persistent server stores in the current MVP.
* **Deterministic Demo Mode:** A demo selector is provided, allowing travelers to test the scanner with exactly five canonical meals (`Balanced Breakfast`, `Grilled Chicken Rice Bowl`, `Vegetable Soup`, `Yogurt and Fruit`, and `Tempeh Plate`).
* **Estimated Limits:** All nutrition metrics are presented strictly as estimates, avoiding claims of laboratory-grade precision.

---

## 2. Nutrition Trust Levels

Logged meals declare a explicit trust badge:
- **`confirmed` (Confirmed):** The traveler confirmed the predicted food identity.
- **`estimated` (Estimated):** Values are approximate estimates based on scanner analysis.
- **`self-reported` (Self-Reported):** Manually inputted values entered by the traveler.
- **`simulated` (Simulated):** Deterministic mock logs for demonstration.
- **`missing` (Data Missing):** Nutrition values could not be calculated.

---

## 3. Medical & Diagnostic Safety

To ensure traveler well-being, the food logger and AI chat enforce strict health boundaries:
* **No Deficiencies:** Nora does not diagnose vitamin or macro deficiencies.
* **No Medical Recommendations:** Nora does not recommend medication, supplements, or medical treatment.
* **No Diet Shaming:** Food items are never categorized morally as "good" or "bad".
* **No Weight Loss Instructions:** Avoids rapid-weight-loss instructions or extreme calorie restrictions.
* **Supportive Wording:** Promotes overall consistency with the guideline: *“One meal does not define the Traveler’s overall wellness.”*

---

## 4. Downstream Integrations

* **Today's Journey:** Integrates with the `Protein Progress` target ($56 / 80\text{ g}$ current progress, 70% completed) and hydration logs ($1.1 / 2.0\text{ L}$ self-reported).
* **Health Pulse:** Evaluates macro consistency parameters from confirmed history logs rather than raw calorie scores.
* **Journey Details:** Saves meal logs privately to the traveler's personal timeline without exporting raw nutritional lists publicly.
* **Challenge Hub:** Links nutrition-focused challenges like `Protein Consistency` or `Hydration Rhythm` to verified logs.

---

## 5. Nora Conversation Chat

The secondary conversational AI block is rebranded as `Ask Nora`:
* **Disclaimers:** Displays boundaries prominently, explaining that critical decisions like Health Pulse, activity verification, rewards, and goal completions occur outside conversational chat.
* **Deterministic Fallback:** Features healthy lifestyle reminders and falls back to: *"I can help with everyday wellness guidance, but I cannot diagnose medical conditions or replace qualified professional advice."* when clinical keywords are detected.
