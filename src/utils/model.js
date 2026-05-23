/**
 * model.js — SignVision Real ML Inference Module
 * ================================================
 * Implements the full forward pass of asl_recognizer_model.h5
 * in pure JavaScript — no TensorFlow.js required.
 *
 * This is a direct port of the Python Keras model:
 *   Sequential: Dense(256,relu) → Dropout → Dense(128,relu) → Dropout → Dense(27,softmax)
 *
 * Dropout layers are training-only and are NOT applied during inference.
 *
 * Input:  42 floats  (21 hand landmarks × x,y, wrist-normalized)
 * Output: { label, confidence, timestamp }
 *
 * ── To update with a new model ────────────────────────────────
 *   1. Train your new model in Python
 *   2. Run: python3 scripts/extract_weights.py
 *   3. model_weights.js is auto-regenerated — no other changes needed
 */

import { MODEL_W1, MODEL_B1, MODEL_W2, MODEL_B2, MODEL_W3, MODEL_B3 } from './model_weights.js';

// ─── Class Labels ────────────────────────────────────────────
// Matches Python fallback: list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") + ["SPACE"]
// Index 0–25 = A–Z, Index 26 = SPACE
export const LABELS = [
  'A','B','C','D','E','F','G','H','I','J','K','L','M',
  'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
  'SPACE'
];

// ─── Inference Config ────────────────────────────────────────
// Mirrors Python constants exactly
export const CONFIDENCE_THRESHOLD = 0.65;
export const SMOOTH_WINDOW        = 8;
export const VOTE_RATIO           = 0.75;
export const COOLDOWN_FRAMES      = 15;
export const LANDMARK_ALPHA       = 0.7;  // landmark smoothing factor

// ─── Tiny Linear Algebra ─────────────────────────────────────

/**
 * matVec(W, x)
 * Multiply matrix W [in × out] by vector x [in] → result [out]
 * Keras stores kernel as [in, out], so W[i][j] = weight from input i to output j
 */
function matVec(W, x) {
  const out = new Float32Array(W[0].length);
  for (let j = 0; j < W[0].length; j++) {
    let s = 0;
    for (let i = 0; i < x.length; i++) s += W[i][j] * x[i];
    out[j] = s;
  }
  return out;
}

function addBias(v, b) { return v.map((x, i) => x + b[i]); }
function relu(v)        { return v.map(x => Math.max(0, x)); }
function softmax(v) {
  const max = Math.max(...v);
  const exp = v.map(x => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map(x => x / sum);
}

// ─── Forward Pass ─────────────────────────────────────────────

/**
 * forwardPass(input42)
 * --------------------
 * Runs the full neural network.
 * Dropout is skipped (inference mode).
 *
 * @param {number[]|Float32Array} input42  — 42 wrist-normalised landmark coords
 * @returns {Float32Array}                 — 27 softmax probabilities
 */
export function forwardPass(input42) {
  let x = relu(addBias(matVec(MODEL_W1, input42), MODEL_B1)); // → 256
  x     = relu(addBias(matVec(MODEL_W2, x),       MODEL_B2)); // → 128
  x     = softmax(addBias(matVec(MODEL_W3, x),    MODEL_B3)); // → 27
  return x;
}

// ─── Feature Extraction ──────────────────────────────────────

/**
 * extractFeatures(landmarks, handedness)
 * ----------------------------------------
 * Mirrors Python extract_features() exactly:
 *   - Subtracts wrist (landmark 0) from every point
 *   - Mirrors X axis for "Right" hand (so both hands produce consistent features)
 *
 * @param {number[]} landmarks   Flat array [x0,y0,x1,y1,...] (42 values, 0–1 normalised)
 * @param {string}   handedness  "Left" or "Right" (from MediaPipe)
 * @returns {number[]}           42 wrist-centred relative features
 */
export function extractFeatures(landmarks, handedness) {
  const wristX = landmarks[0];
  const wristY = landmarks[1];
  const feats  = [];

  for (let i = 0; i < landmarks.length; i += 2) {
    let dx = landmarks[i]     - wristX;
    let dy = landmarks[i + 1] - wristY;
    if (handedness === 'Right') dx = -dx; // mirror to match training data
    feats.push(dx, dy);
  }
  return feats;
}

// ─── Landmark Smoothing ──────────────────────────────────────

/**
 * smoothLandmarks(current, prev)
 * --------------------------------
 * Exponential moving average on landmark coords.
 * Mirrors Python smooth_landmarks(current, prev, alpha=0.7)
 *
 * @param {number[]} current  New frame landmarks (flat)
 * @param {number[]|null} prev  Previous smoothed landmarks
 * @returns {number[]}        Smoothed landmarks
 */
export function smoothLandmarks(current, prev) {
  if (!prev) return current.slice();
  return current.map((c, i) => LANDMARK_ALPHA * c + (1 - LANDMARK_ALPHA) * prev[i]);
}

// ─── Main Prediction API ─────────────────────────────────────

/**
 * predictSign(landmarks, handedness, prevLandmarks)
 * ---------------------------------------------------
 * High-level API: takes raw MediaPipe landmarks and runs the full pipeline.
 *
 * @param {Array}       landmarks      MediaPipe hand_landmarks (array of {x,y,z} objects)
 * @param {string}      handedness     "Left" or "Right"
 * @param {number[]|null} prevLandmarks  Previous smoothed coords for temporal smoothing
 *
 * @returns {{
 *   label:      string,    — predicted class (e.g. "A", "SPACE")
 *   confidence: number,    — softmax probability 0–1
 *   allProbs:   Float32Array, — all 27 class probabilities
 *   smoothedLandmarks: number[]  — for passing back as prevLandmarks next frame
 * }}
 */
export function predictSign(landmarks, handedness, prevLandmarks = null) {
  // 1. Flatten MediaPipe landmark objects → [x0,y0,x1,y1,...]
  const raw = landmarks.flatMap(lm => [lm.x, lm.y]);

  // 2. Temporal smoothing
  const smoothed = smoothLandmarks(raw, prevLandmarks);

  // 3. Wrist-normalise + handedness mirror
  const features = extractFeatures(smoothed, handedness);

  // 4. Neural network forward pass
  const probs = forwardPass(features);

  // 5. Pick argmax
  const maxIdx    = probs.indexOf(Math.max(...probs));
  const label     = LABELS[maxIdx];
  const confidence = probs[maxIdx];

  return { label, confidence, allProbs: probs, smoothedLandmarks: smoothed };
}
