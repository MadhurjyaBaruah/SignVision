/**
 * translator.js — SignVision v6
 * Live Translator · Transcript UX · Translation Panel · TTS with fallback warning
 */

import { startCamera, stopCamera, captureSnapshot, drawHandSkeleton } from '../utils/camera.js';
import { predictSign, CONFIDENCE_THRESHOLD }   from '../utils/model.js';
import { createVoter }                          from '../utils/voting.js';
import { speak }                                from '../utils/speech.js';
import { autoCorrect, suggestCorrection, translateText, speakText, initVoices } from '../utils/translate.js';
import { isValidWord, getFuzzySuggestions, getCurrentWord } from '../utils/dictionary.js';

// ─── Module State ─────────────────────────────────────────────
let prevLandmarks   = null;
let voter           = createVoter();
let transcript      = [];        // array of single chars + ' '
let selectedIndex   = -1;        // chip index selected for deletion
let frameCount      = 0;
let fpsTimer        = null;
let validationTimer = null;
let correctionTimer = null;

// ─── Init ──────────────────────────────────────────────────────
export function initTranslatorPage() {

  // Pre-warm TTS voices as early as possible
  initVoices();

  // ── DOM refs ──────────────────────────────────────────────
  const video             = document.getElementById('videoFeed');
  const overlayCanvas     = document.getElementById('overlayCanvas');
  const ctx               = overlayCanvas.getContext('2d');
  const btnStart          = document.getElementById('btnStartDetection');
  const btnStop           = document.getElementById('btnStop');
  const cameraIdle        = document.getElementById('cameraIdle');
  const cameraOverlayInfo = document.getElementById('cameraOverlayInfo');
  const loadingOverlay    = document.getElementById('loadingOverlay');
  const loadingMsg        = document.getElementById('loadingMsg');
  const resultDisplay     = document.getElementById('resultDisplay');
  const resultStatus      = document.getElementById('resultStatus');
  const confidenceWrap    = document.getElementById('confidenceWrap');
  const confidenceFill    = document.getElementById('confidenceFill');
  const confidenceValue   = document.getElementById('confidenceValue');
  const transcriptBody    = document.getElementById('transcriptBody');
  const fpsBadge          = document.getElementById('fpsBadge');
  const noHandMsg         = document.getElementById('noHandMsg');
  const suggestionBox     = document.getElementById('suggestionBox');
  const ttsWarningBar     = document.getElementById('ttsWarningBar');

  // ── Canvas resize ──
  function resizeCanvas() {
    overlayCanvas.width  = video.offsetWidth;
    overlayCanvas.height = video.offsetHeight;
  }
  window.addEventListener('resize', resizeCanvas);

  function confColor(c) {
    return c >= 0.85 ? '#00ff88' : c >= 0.65 ? '#00e5ff' : '#ffb830';
  }

  // ════════════════════════════════════════════════════════════
  //  TTS WARNING BAR
  // ════════════════════════════════════════════════════════════
  const ttsWarningMsg = document.getElementById('ttsWarningMsg');
  function showTtsWarning(msg) {
    if (!ttsWarningBar) return;
    if (ttsWarningMsg) ttsWarningMsg.textContent = msg;
    else ttsWarningBar.textContent = msg;
    ttsWarningBar.style.display = 'flex';
    clearTimeout(ttsWarningBar._timer);
    ttsWarningBar._timer = setTimeout(() => {
      ttsWarningBar.style.display = 'none';
    }, 6000);
  }

  // ════════════════════════════════════════════════════════════
  //  TRANSCRIPT UX — click-to-select → click-again-to-delete
  // ════════════════════════════════════════════════════════════

  function syncChipIndices() {
    transcriptBody.querySelectorAll('.transcript-word').forEach((el, i) => {
      el.dataset.idx = i;
    });
  }

  function clearSelection() {
    selectedIndex = -1;
    transcriptBody.querySelectorAll('.transcript-word.selected').forEach(el => {
      el.classList.remove('selected');
      el.title = '';
    });
  }

  function deleteAtIndex(idx) {
    if (idx < 0 || idx >= transcript.length) return;
    transcript.splice(idx, 1);
    selectedIndex = -1;
    rebuildTranscriptDOM();
    updateWordValidation();
  }

  function backspaceOne() {
    if (transcript.length === 0) return;
    // If a chip is selected, delete that specific one
    if (selectedIndex >= 0) {
      deleteAtIndex(selectedIndex);
      return;
    }
    transcript.pop();
    rebuildTranscriptDOM();
    updateWordValidation();
  }

  function deleteLastWord() {
    if (transcript.length === 0) return;
    clearSelection();
    if (transcript[transcript.length - 1] === ' ') transcript.pop();
    while (transcript.length > 0 && transcript[transcript.length - 1] !== ' ') {
      transcript.pop();
    }
    rebuildTranscriptDOM();
    updateWordValidation();
  }

  function makechip(ch, idx) {
    const chip = document.createElement('span');
    chip.className   = 'transcript-word';
    chip.textContent = ch === ' ' ? '␣' : ch;
    chip.dataset.idx = idx;

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const i = parseInt(chip.dataset.idx, 10);
      if (selectedIndex === i) {
        // Second click → delete
        deleteAtIndex(i);
      } else {
        clearSelection();
        selectedIndex = i;
        chip.classList.add('selected');
        chip.title = 'Click again to delete this letter';
      }
    });
    return chip;
  }

  function rebuildTranscriptDOM() {
    transcriptBody.innerHTML = '';
    if (transcript.length === 0) {
      transcriptBody.innerHTML = '<p class="transcript-empty">Recognized signs will appear here…</p>';
      return;
    }
    transcript.forEach((ch, idx) => {
      transcriptBody.appendChild(makechip(ch, idx));
    });
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
  }

  function addToTranscript(label) {
    const ch = label === 'SPACE' ? ' ' : label;
    transcript.push(ch);
    clearSelection();

    const empty = transcriptBody.querySelector('.transcript-empty');
    if (empty) empty.remove();

    const chip = makechip(ch, transcript.length - 1);
    transcriptBody.appendChild(chip);
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
    syncChipIndices();

    resultDisplay.classList.add('pop');
    setTimeout(() => resultDisplay.classList.remove('pop'), 150);

    updateWordValidation();
  }

  // Click outside chips → clear selection
  transcriptBody.addEventListener('click', e => {
    if (!e.target.closest('.transcript-word')) clearSelection();
  });

  // Keyboard: Backspace/Delete
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { clearSelection(); return; }
    // Only intercept backspace if a chip is actually selected
    if ((e.key === 'Backspace' || e.key === 'Delete') && selectedIndex >= 0) {
      e.preventDefault();
      deleteAtIndex(selectedIndex);
    }
  });

  // ── Transcript controls ──
  document.getElementById('btnBackspace').addEventListener('click', () => backspaceOne());
  document.getElementById('btnDeleteWord').addEventListener('click', () => deleteLastWord());
  document.getElementById('btnClearTranscript').addEventListener('click', () => {
    transcript = [];
    selectedIndex = -1;
    voter.reset();
    prevLandmarks = null;
    hideSuggestions();
    clearWordUnderlines();
    rebuildTranscriptDOM();
  });
  document.getElementById('btnSpeakTranscript').addEventListener('click', () => {
    if (transcript.length) speak(transcript.join(''));
  });
  document.getElementById('btnCopyTranscript').addEventListener('click', () => {
    const btn = document.getElementById('btnCopyTranscript');
    navigator.clipboard.writeText(transcript.join('')).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
      setTimeout(() => { btn.innerHTML = orig; }, 2000);
    });
  });

  // ════════════════════════════════════════════════════════════
  //  WORD VALIDATION & DICTIONARY SUGGESTIONS
  // ════════════════════════════════════════════════════════════

  function updateWordValidation() {
    clearTimeout(validationTimer);
    validationTimer = setTimeout(() => {
      clearWordUnderlines();
      const currentWord = getCurrentWord(transcript);
      if (!currentWord || currentWord.length < 2) { hideSuggestions(); return; }
      if (isValidWord(currentWord)) { hideSuggestions(); return; }
      markInvalidWord(currentWord.length);
      const suggestions = getFuzzySuggestions(currentWord, 4);
      if (suggestions.length > 0) showSuggestions(suggestions, currentWord);
      else hideSuggestions();
    }, 350);
  }

  function markInvalidWord(wordLen) {
    const chips = Array.from(transcriptBody.querySelectorAll('.transcript-word'));
    let rem = wordLen;
    for (let i = chips.length - 1; i >= 0 && rem > 0; i--) {
      if (chips[i].textContent === '␣') break;
      chips[i].classList.add('word-invalid');
      rem--;
    }
  }

  function clearWordUnderlines() {
    transcriptBody.querySelectorAll('.word-invalid').forEach(c => c.classList.remove('word-invalid'));
  }

  function showSuggestions(suggestions, original) {
    suggestionBox.innerHTML = `
      <span class="sugg-label">Did you mean:</span>
      ${suggestions.map(s => `<button class="sugg-chip" data-word="${s}">${s}</button>`).join('')}
      <button class="sugg-dismiss" title="Dismiss">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>`;
    suggestionBox.classList.add('visible');
    suggestionBox.querySelectorAll('.sugg-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        replaceCurrentWord(btn.dataset.word);
        hideSuggestions();
        clearWordUnderlines();
      });
    });
    suggestionBox.querySelector('.sugg-dismiss').addEventListener('click', hideSuggestions);
  }

  function hideSuggestions() { suggestionBox.classList.remove('visible'); }

  function replaceCurrentWord(replacement) {
    while (transcript.length > 0 && transcript[transcript.length - 1] !== ' ') transcript.pop();
    replacement.toUpperCase().split('').forEach(ch => transcript.push(ch));
    rebuildTranscriptDOM();
  }

  // ════════════════════════════════════════════════════════════
  //  MEDIAPIPE + MODEL
  // ════════════════════════════════════════════════════════════

  function onHandResults(results) {
    frameCount++;
    resizeCanvas();
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

    if (!results.multiHandLandmarks?.length) {
      noHandMsg.style.display      = 'block';
      resultDisplay.innerHTML      = '<span class="result-placeholder">—</span>';
      confidenceWrap.style.display = 'none';
      resultStatus.textContent     = 'No hand detected';
      resultStatus.className       = 'result-status';
      prevLandmarks = null;
      return;
    }

    noHandMsg.style.display = 'none';
    const landmarks  = results.multiHandLandmarks[0];
    const handedness = results.multiHandedness[0].label;

    const { label, confidence, smoothedLandmarks } = predictSign(landmarks, handedness, prevLandmarks);
    prevLandmarks = smoothedLandmarks;

    const color = confColor(confidence);
    drawHandSkeleton(ctx, landmarks, overlayCanvas.width, overlayCanvas.height, color);

    // ── FIX: show "SPACE" without overflow ──
    resultDisplay.textContent = label === 'SPACE' ? 'SPACE' : label;
    resultDisplay.style.color = confidence >= CONFIDENCE_THRESHOLD ? color : 'var(--text-4)';

    confidenceWrap.style.display = 'block';
    const pct = Math.round(confidence * 100);
    confidenceValue.textContent  = `${pct}%${confidence < CONFIDENCE_THRESHOLD ? ' (low)' : ''}`;
    confidenceFill.style.width   = `${pct}%`;

    if (confidence >= CONFIDENCE_THRESHOLD) {
      resultStatus.textContent = 'Detecting';
      resultStatus.className   = 'result-status active';
      const committed = voter.vote(label);
      if (committed) addToTranscript(committed);
    } else {
      resultStatus.textContent = 'Low confidence';
      resultStatus.className   = 'result-status';
    }
  }

  btnStart.addEventListener('click', async () => {
    btnStart.disabled      = true;
    loadingMsg.textContent = 'Initializing MediaPipe Hands…';
    loadingOverlay.style.display = 'flex';
    try {
      await startCamera(video, onHandResults);
      loadingOverlay.style.display    = 'none';
      cameraIdle.style.display        = 'none';
      cameraOverlayInfo.style.display = 'flex';
      btnStop.disabled = false;
      resultStatus.textContent = 'Ready — show your hand';
      resultStatus.className   = 'result-status active';
      fpsTimer = setInterval(() => { fpsBadge.textContent = `${frameCount} fps`; frameCount = 0; }, 1000);
    } catch (err) {
      loadingOverlay.style.display = 'none';
      btnStart.disabled = false;
      alert('Could not start camera.\n\n• Use a local web server (not file://)\n• Allow camera permissions\n\nError: ' + err.message);
    }
  });

  btnStop.addEventListener('click', () => {
    stopCamera();
    clearInterval(fpsTimer);
    voter.reset();
    prevLandmarks = null;
    hideSuggestions();
    clearWordUnderlines();
    clearSelection();
    cameraIdle.style.display        = 'flex';
    cameraOverlayInfo.style.display = 'none';
    noHandMsg.style.display         = 'none';
    btnStart.disabled = false;
    btnStop.disabled  = true;
    ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    resultDisplay.innerHTML      = '<span class="result-placeholder">—</span>';
    confidenceWrap.style.display = 'none';
    resultStatus.textContent     = 'Inactive';
    resultStatus.className       = 'result-status';
  });

  document.getElementById('btnSnapshot').addEventListener('click', () => {
    if (!video.srcObject) return;
    const a    = document.createElement('a');
    a.href     = captureSnapshot(video);
    a.download = `signvision-${Date.now()}.png`;
    a.click();
  });

  // ════════════════════════════════════════════════════════════
  //  TRANSLATION PANEL
  // ════════════════════════════════════════════════════════════

  const translateInput     = document.getElementById('translateInput');
  const translateOutput    = document.getElementById('translateOutput');
  const translateCharCount = document.getElementById('translateCharCount');
  const translateLoading   = document.getElementById('translateLoading');
  const correctionBar      = document.getElementById('correctionBar');
  const correctionSuggEl   = document.getElementById('correctionSuggestion');
  const sourceLang         = document.getElementById('sourceLang');
  const targetLang         = document.getElementById('targetLang');
  let currentTranslation   = '';

  // Char counter + "Did you mean?" detection
  translateInput.addEventListener('input', () => {
    const len = Math.min(translateInput.value.length, 5000);
    if (translateInput.value.length > 5000) translateInput.value = translateInput.value.slice(0, 5000);
    translateCharCount.textContent = len;

    clearTimeout(correctionTimer);
    correctionTimer = setTimeout(() => {
      const sugg = suggestCorrection(translateInput.value);
      if (sugg && sugg !== translateInput.value) {
        correctionSuggEl.textContent = sugg;
        correctionBar.style.display  = 'flex';
      } else {
        correctionBar.style.display = 'none';
      }
    }, 600);
  });

  correctionSuggEl.addEventListener('click', () => {
    translateInput.value = correctionSuggEl.textContent;
    translateCharCount.textContent = translateInput.value.length;
    correctionBar.style.display = 'none';
    translateInput.focus();
  });

  document.getElementById('btnPasteTranscript').addEventListener('click', () => {
    if (transcript.length === 0) {
      const ph = translateInput.placeholder;
      translateInput.placeholder = 'No transcript yet — start detection first';
      setTimeout(() => { translateInput.placeholder = ph; }, 2500);
      return;
    }
    const raw = transcript.join('');
    const { corrected } = autoCorrect(raw);
    translateInput.value           = corrected;
    translateCharCount.textContent = corrected.length;
    correctionBar.style.display    = 'none';
    translateInput.focus();
  });

  document.getElementById('btnAutoCorrect').addEventListener('click', () => {
    const { corrected, changed } = autoCorrect(translateInput.value);
    if (changed) {
      translateInput.value           = corrected;
      translateCharCount.textContent = corrected.length;
      correctionBar.style.display    = 'none';
      const btn = document.getElementById('btnAutoCorrect');
      btn.classList.add('active-tool');
      setTimeout(() => btn.classList.remove('active-tool'), 1400);
    }
  });

  document.getElementById('btnClearInput').addEventListener('click', () => {
    translateInput.value           = '';
    translateCharCount.textContent = '0';
    correctionBar.style.display    = 'none';
    translateOutput.innerHTML      = '<span class="translate-output-placeholder">Translation will appear here…</span>';
    currentTranslation             = '';
  });

  // Speak source text
  document.getElementById('btnSpeakSource').addEventListener('click', () => {
    const text = translateInput.value.trim();
    if (!text) return;
    const lang = sourceLang.value === 'auto' ? 'en' : sourceLang.value;
    speakText(text, lang, showTtsWarning);
  });

  // Swap languages
  document.getElementById('btnSwapLangs').addEventListener('click', () => {
    const srcVal = sourceLang.value;
    const tgtVal = targetLang.value;
    if (srcVal === 'auto') return;
    const srcOpts = [...sourceLang.options].map(o => o.value);
    const tgtOpts = [...targetLang.options].map(o => o.value);
    if (srcOpts.includes(tgtVal) && tgtOpts.includes(srcVal)) {
      sourceLang.value = tgtVal;
      targetLang.value = srcVal;
      if (currentTranslation) {
        const oldInput       = translateInput.value;
        translateInput.value = currentTranslation;
        translateCharCount.textContent = currentTranslation.length;
        translateOutput.textContent    = oldInput;
        currentTranslation             = oldInput;
      }
    }
  });

  // Translate
  async function doTranslate() {
    const text = translateInput.value.trim();
    if (!text) {
      translateOutput.innerHTML = '<span class="translate-output-placeholder">Enter some text first…</span>';
      return;
    }
    const src = sourceLang.value === 'auto' ? 'en' : sourceLang.value;
    const tgt = targetLang.value;
    if (src === tgt) { translateOutput.textContent = text; currentTranslation = text; return; }

    translateLoading.style.display = 'flex';
    translateOutput.style.opacity  = '0.3';
    try {
      const { translation } = await translateText(text, src, tgt);
      currentTranslation            = translation;
      translateOutput.textContent   = translation;
      translateOutput.style.opacity = '0';
      requestAnimationFrame(() => {
        translateOutput.style.transition = 'opacity 0.4s';
        translateOutput.style.opacity    = '1';
      });
    } catch (err) {
      translateOutput.innerHTML     = `<span class="translate-output-placeholder" style="color:var(--red)">${err.message}</span>`;
      currentTranslation            = '';
    } finally {
      translateLoading.style.display = 'none';
      translateOutput.style.opacity  = '1';
    }
  }

  document.getElementById('btnTranslate').addEventListener('click', doTranslate);
  translateInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doTranslate(); }
  });

  // Copy translation
  document.getElementById('btnCopyTranslation').addEventListener('click', () => {
    if (!currentTranslation) return;
    const btn = document.getElementById('btnCopyTranslation');
    navigator.clipboard.writeText(currentTranslation).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
      btn.classList.add('active-tool');
      setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('active-tool'); }, 2000);
    });
  });

  // Speak translation — with TTS warning for unsupported languages
  document.getElementById('btnSpeakTranslation').addEventListener('click', () => {
    if (!currentTranslation) return;
    speakText(currentTranslation, targetLang.value, showTtsWarning);
  });
}
