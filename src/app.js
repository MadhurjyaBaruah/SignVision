/**
 * app.js — SignVision v6
 * Router · Dark/Light theme toggle · Hero demo
 */

import { initTranslatorPage } from './pages/translator.js';
import { initLearnPage }      from './pages/learn.js';

const PAGES       = ['home', 'translator', 'learn'];
const initialized = new Set();

// ─── Router ──────────────────────────────────────────────────
export function navigateTo(pageId) {
  if (!PAGES.includes(pageId)) return;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${pageId}`)?.classList.add('active');

  document.querySelectorAll('.nav-link, .mobile-link').forEach(a =>
    a.classList.toggle('active', a.dataset.page === pageId));

  document.getElementById('mobileMenu')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (!initialized.has(pageId)) {
    initialized.add(pageId);
    switch (pageId) {
      case 'translator': initTranslatorPage(); break;
      case 'learn':      initLearnPage();      break;
    }
  }
}

// ─── Dark / Light Mode ───────────────────────────────────────
function initThemeToggle() {
  const html = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  if (!btn) return;

  const saved = localStorage.getItem('sv-theme');
  if (saved) html.setAttribute('data-theme', saved);

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') || 'dark';
    const next    = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('sv-theme', next);
  });
}

// ─── Hero Demo Rotation ──────────────────────────────────────
function startHeroDemo() {
  const words = ['Hello', 'Thank You', 'I Love You', 'Yes', 'Help', 'Good'];
  const el    = document.getElementById('heroDemo');
  if (!el) return;
  let i = 0;
  el.style.transition = 'opacity 0.35s, transform 0.35s';
  setInterval(() => {
    el.style.opacity   = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      i = (i + 1) % words.length;
      el.textContent     = words[i];
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    }, 350);
  }, 2600);
}

// ─── Global click delegation ─────────────────────────────────
document.addEventListener('click', e => {
  const el = e.target.closest('[data-page]');
  if (el) { e.preventDefault(); navigateTo(el.dataset.page); }
});

document.getElementById('hamburger')?.addEventListener('click', () =>
  document.getElementById('mobileMenu')?.classList.toggle('open'));

// ─── Boot ─────────────────────────────────────────────────────
// Use DOMContentLoaded to be safe even when script loads early
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

function boot() {
  initThemeToggle();
  navigateTo('home');
  startHeroDemo();
}
