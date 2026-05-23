/**
 * speech.js — SignVision Speech I/O Module
 * =========================================
 * Wraps the Web Speech API (SpeechRecognition + SpeechSynthesis).
 */

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;

export function startListening(onResult, onError) {
  if (!SpeechRecognition) {
    onError && onError(new Error('SpeechRecognition not supported in this browser.'));
    return;
  }
  recognizer = new SpeechRecognition();
  recognizer.continuous     = true;
  recognizer.interimResults = true;
  recognizer.lang           = 'en-US';

  recognizer.onresult = (event) => {
    let interim = '', final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) final += t;
      else interim += t;
    }
    if (final)   onResult(final.trim(), true);
    else if (interim) onResult(interim.trim(), false);
  };

  recognizer.onerror = (e) => { onError && onError(e); };
  recognizer.start();
}

export function stopListening() {
  if (recognizer) { recognizer.stop(); recognizer = null; }
}

export function isListeningSupported() {
  return !!SpeechRecognition;
}

export function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
