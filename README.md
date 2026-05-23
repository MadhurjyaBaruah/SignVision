# SignVision v6

Real-time American Sign Language (ASL) recognition in the browser.
Powered by a trained Keras neural network (run entirely client-side) and MediaPipe Hands.

---

## What's in v6

- **SPACE overflow fix** — The modal and result display now use CSS container queries + `clamp()` so "SPACE" never overflows on any screen size.
- **Learn section polish** — Consistent card heights, fluid letter labels, improved modal layout, better mobile grid.
- **Vercel deployment** — Full configuration included (`vercel.json`). No backend required.
- **Bug fixes** — TTS warning bar preserves its SVG icon, app boot guard, safer null checks throughout.
- **Production metadata** — Meta description, theme-color, canonical URL in `<head>`.

---

## Running locally

```bash
# Option A — Node.js server (recommended)
npm install
npm start
# Open http://localhost:3000

# Option B — Python
python -m http.server 8080
# Open http://localhost:8080
```

> **Important:** Always serve over HTTP, not `file://`.  
> ES Modules and MediaPipe require an HTTP origin.

---

## Deploying to Vercel (free, ~2 minutes)

Vercel hosts static sites for free and serves `.js` modules with the correct
`Content-Type`, which fixes the model + MediaPipe issues that GitHub Pages has.

### Step 1 — Install Vercel CLI (one-time)

```bash
npm install -g vercel
```

### Step 2 — Deploy

```bash
cd sv_v6
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? *(your account)*
- Link to existing project? **N**
- Project name: **signvision** (or anything you like)
- In which directory is your code located? **.** (current directory)
- Want to modify settings? **N**

Vercel will print a URL like `https://signvision-xxxx.vercel.app` — that's your live site.

### Step 3 — Redeploy after changes

```bash
vercel --prod
```

### Alternative: Deploy via GitHub

1. Push `sv_v6` to a GitHub repo.
2. Go to [vercel.com](https://vercel.com), click **Add New Project**.
3. Import the repo. Leave all settings as default and click **Deploy**.

---

## Why GitHub Pages doesn't work

GitHub Pages serves `.js` files as `text/plain` on some paths, which causes browsers
to reject ES Module imports. It also has no way to set custom headers for `Content-Type`.
Vercel always serves `.js` as `application/javascript`, so modules and MediaPipe load correctly.

---

## Project structure

```
sv_v6/
├── index.html              # Single-page app entry point
├── vercel.json             # Vercel deployment config
├── server.js               # Local dev server (Node/Express)
├── package.json
├── assets/
│   ├── sv-logo.png
│   ├── hand.png
│   └── ASL_Alphabet_Chart.jpg
├── src/
│   ├── app.js              # Router + theme toggle
│   ├── assets/styles/
│   │   └── main.css
│   ├── pages/
│   │   ├── translator.js   # Live recognition UI
│   │   └── learn.js        # A–Z reference page
│   └── utils/
│       ├── camera.js       # MediaPipe Hands + webcam
│       ├── model.js        # Neural network forward pass
│       ├── model_weights.js# Exported Keras weights (auto-generated)
│       ├── dictionary.js   # Word validation + fuzzy suggestions
│       ├── speech.js       # Web Speech API (TTS)
│       ├── translate.js    # MyMemory API + auto-correct
│       └── voting.js       # Temporal voting / debounce
└── models/
    └── asl_recognizer_model.h5   # Original Keras model (Python only)
```

---

## Regenerating model weights

If you retrain the model:

```bash
python scripts/extract_weights.py
```

This overwrites `src/utils/model_weights.js` — no other changes needed.
