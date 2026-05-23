/**
 * server.js — SignVision v6 Dev Server
 * =====================================
 * For local development:  npm start  →  http://localhost:3000
 *
 * For production deployment use Vercel (see README).
 * ES Modules + MediaPipe require an HTTP origin — never open index.html directly.
 */
const express = require('express');
const path    = require('path');
const app     = express();
const PORT    = process.env.PORT || 3000;

// Serve all static files with correct MIME types
app.use(express.static(path.join(__dirname), {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js'))  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css; charset=utf-8');
    if (filePath.endsWith('.mjs')) res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  }
}));

// SPA fallback — all unknown routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n◈ SignVision v6  →  http://localhost:${PORT}\n`);
});
