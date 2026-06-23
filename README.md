# SignVision v7

Real-time American Sign Language (ASL) recognition in the browser.
Powered by a trained Keras neural network (run entirely client-side) and MediaPipe Hands.

---

## What's new in v7

- **Full mobile responsiveness** - Comprehensive responsive design across all pages and screen sizes (phones, tablets, laptops, desktops). Five breakpoints: 1100px, 960px, 768px, 640px, 390px. Hero text scales down cleanly at 24px on mobile with no overflow. Stats section uses a 3-column grid on small screens. Phone mockup moves below the stats row on mobile instead of being hidden.
- **Translator page mobile fix** - Camera panel and results panel stack vertically on tablets and phones. Camera controls wrap cleanly. Transcript action buttons flex to full width. Translation panel source and target stack vertically on mobile, with the arrow indicator rotating 90 degrees to show the flow correctly.
- **Hero entrance animations** - Smooth staggered fade-up animations for the badge, title, description, buttons, stats, and phone mockup when the home page loads. Uses `cubic-bezier(0.22, 1, 0.36, 1)` easing for a natural spring feel. Fully respects `prefers-reduced-motion`.
- **Global overflow fix** - `overflow-x: hidden` added to both `html` and `body` (body alone is not sufficient in mobile browsers). All elements capped with `max-width: 100%`.

---

## What's in v6

- **Google Translate engine** - Replaced the MyMemory API with Google Translate (`translate.googleapis.com/translate_a/single?client=gtx`). No API key required. Accurate for all languages including Indian scripts.
- **Indian Languages group** - Target language dropdown now has an "Indian Languages" optgroup at the top with 15 languages, each showing the native script (e.g. Hindi (हिन्दी), Tamil (தமிழ்), Bengali (বাংলা)). New additions: Assamese(অসমীয়া), Odia, Meitei/Manipuri, Sanskrit.
- **English-only source** - Translation source is now fixed to English. The source language dropdown and swap button were removed. A fixed "English" badge replaces the dropdown. A one-way arrow replaces the swap button.
- **"From Transcript" button preserved** - The paste-from-transcript button is retained in the translation panel.
- **50+ languages** - Upgraded from 40+ to 50+ languages across the Indian Languages and Other Languages groups.
- **TTS voice fallbacks** - Indian language TTS now falls back gracefully to Hindi (`hi-IN`) when the target language voice is not installed on the device, with a user-visible warning.
- **"Did you mean" fix** - The correction bar no longer triggers when the only change is capitalising the first letter. It now only appears when a real word correction is found.
- **SPACE overflow fix** - The modal and result display use CSS container queries + `clamp()` so "SPACE" never overflows on any screen size.
- **Learn section polish** - Consistent card heights, fluid letter labels, improved modal layout.
- **Vercel deployment** - Full configuration included (`vercel.json`). No backend required.
- **Bug fixes** - TTS warning bar preserves its SVG icon, app boot guard, safer null checks throughout.
- **Production metadata** - Meta description, theme-color, canonical URL in `<head>`.

---

## Running locally

```bash
# Option A - Node.js server (recommended)
npm install
npm start
# Open http://localhost:3000

# Option B - Python
python -m http.server 8080
# Open http://localhost:8080
```

## Project structure

```
sv_v7/
|- index.html              # Single-page app entry point
|- vercel.json             # Vercel deployment config
|- server.js               # Local dev server (Node/Express)
|- package.json
|- assets/
|  |- sv-logo.png
|  |- hand.png
|  |- ASL_Alphabet_Chart.jpg
|- src/
|  |- app.js               # Router + theme toggle
|  |- assets/styles/
|  |  |- main.css          # All styles + responsive + animations
|  |- pages/
|  |  |- translator.js     # Live recognition UI + translation panel
|  |  |- learn.js          # A-Z reference page
|  |- utils/
|     |- camera.js         # MediaPipe Hands + webcam
|     |- model.js          # Neural network forward pass
|     |- model_weights.js  # Exported Keras weights
|     |- dictionary.js     # Word validation + fuzzy suggestions
|     |- speech.js         # Web Speech API (TTS)
|     |- translate.js      # Google Translate + auto-correct + TTS voices
|     |- voting.js         # Temporal voting / debounce
|- models/
   |- asl_recognizer_model.h5   # Original Keras model (Python only)
```

---

## Regenerating model weights

If you retrain the model:

```bash
python scripts/extract_weights.py
```

This overwrites `src/utils/model_weights.js` - no other changes needed.
