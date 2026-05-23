/**
 * voting.js — SignVision Prediction Voting & Debounce
 * =====================================================
 * Mirrors Python handle_history() logic exactly:
 *   - Sliding window of SMOOTH_WINDOW predictions
 *   - Commit when majority vote > VOTE_RATIO
 *   - Cooldown of COOLDOWN_FRAMES after each commit
 *
 * Keeps state isolated per use-case (translator, chat, etc.)
 */

import { SMOOTH_WINDOW, VOTE_RATIO, COOLDOWN_FRAMES } from './model.js';

/**
 * createVoter()
 * -------------
 * Factory function — returns a fresh voting instance.
 * Call once per page/feature that needs its own voting state.
 *
 * @returns {{ vote(label): string|null, reset(): void }}
 */
export function createVoter() {
  let history       = [];
  let cooldown      = 0;

  /**
   * vote(label)
   * -----------
   * Submit a new prediction. Returns the committed label if the
   * voting window has reached consensus, otherwise null.
   *
   * @param {string} label  Predicted class label (e.g. "A", "SPACE")
   * @returns {string|null}
   */
  function vote(label) {
    history.push(label);
    if (history.length > SMOOTH_WINDOW) history.shift();

    if (cooldown > 0) { cooldown--; return null; }
    if (history.length < SMOOTH_WINDOW) return null;

    // Count votes — mirrors Python Counter().most_common(1)
    const counts = {};
    history.forEach(l => counts[l] = (counts[l] || 0) + 1);
    const [topLabel, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    if (topCount > SMOOTH_WINDOW * VOTE_RATIO) {
      cooldown = COOLDOWN_FRAMES;
      history  = [];
      return topLabel;
    }

    return null;
  }

  /**
   * reset()
   * -------
   * Clear history and cooldown (e.g. when stopping detection).
   */
  function reset() {
    history  = [];
    cooldown = 0;
  }

  return { vote, reset };
}
