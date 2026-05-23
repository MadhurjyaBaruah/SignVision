/**
 * camera.js — SignVision Camera & MediaPipe Hands Module
 * =======================================================
 * Manages webcam access and MediaPipe Hands lifecycle.
 * Decoupled from model and UI layers.
 *
 * Uses the global `Hands` and `Camera` objects from MediaPipe CDN scripts
 * loaded in index.html:
 *   @mediapipe/hands
 *   @mediapipe/camera_utils
 */

// ─── State ───────────────────────────────────────────────────
let handsInstance  = null;
let cameraInstance = null;
let isRunning      = false;

// ─── MediaPipe Hands Setup ───────────────────────────────────

/**
 * startCamera(videoElement, onResults)
 * --------------------------------------
 * Initialises MediaPipe Hands and attaches the webcam to the given
 * <video> element. Calls onResults(results) for every processed frame.
 *
 * Matches Python MediaPipe config:
 *   static_image_mode=False, max_num_hands=1,
 *   model_complexity=1, min_detection_confidence=0.5,
 *   min_tracking_confidence=0.8
 *
 * @param {HTMLVideoElement} videoElement
 * @param {function} onResults  Called with MediaPipe Hands results each frame
 */
export async function startCamera(videoElement, onResults) {
  // Initialise MediaPipe Hands
  handsInstance = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
  });

  handsInstance.setOptions({
    maxNumHands:            1,
    modelComplexity:        1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence:  0.8,
  });

  handsInstance.onResults(onResults);

  // Start camera via MediaPipe Camera utils
  cameraInstance = new Camera(videoElement, {
    onFrame: async () => {
      if (isRunning && handsInstance) {
        await handsInstance.send({ image: videoElement });
      }
    },
    width: 1280,
    height: 720,
  });

  await cameraInstance.start();
  isRunning = true;
  console.log('[SignVision Camera] MediaPipe Hands + camera started.');
}

/**
 * stopCamera()
 * ------------
 * Stops the camera stream and closes MediaPipe Hands.
 */
export function stopCamera() {
  isRunning = false;

  if (cameraInstance) {
    cameraInstance.stop();
    cameraInstance = null;
  }
  if (handsInstance) {
    handsInstance.close();
    handsInstance = null;
  }

  console.log('[SignVision Camera] Stopped.');
}

/**
 * isCameraRunning()
 */
export function isCameraRunning() {
  return isRunning;
}

// ─── Snapshot Utility ─────────────────────────────────────────

/**
 * captureSnapshot(videoElement)
 * ------------------------------
 * Returns a base64 PNG of the current video frame.
 *
 * @param {HTMLVideoElement} videoElement
 * @returns {string} data URL
 */
export function captureSnapshot(videoElement) {
  const canvas = document.createElement('canvas');
  canvas.width  = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  canvas.getContext('2d').drawImage(videoElement, 0, 0);
  return canvas.toDataURL('image/png');
}

// ─── Canvas Skeleton Drawing ──────────────────────────────────

/**
 * drawHandSkeleton(ctx, landmarks, canvasW, canvasH, color)
 * ----------------------------------------------------------
 * Draws MediaPipe hand landmark connections and dots on a canvas.
 * Video is CSS-mirrored (transform:scaleX(-1)), so we flip x = 1 - lm.x
 * to keep the skeleton aligned with the visible hand.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array}  landmarks   MediaPipe landmarks array [{x,y,z}, ...]
 * @param {number} canvasW
 * @param {number} canvasH
 * @param {string} color       CSS colour string
 */
export function drawHandSkeleton(ctx, landmarks, canvasW, canvasH, color = '#00e5ff') {
  const CONNECTIONS = [
    [0,1],[1,2],[2,3],[3,4],         // thumb
    [0,5],[5,6],[6,7],[7,8],         // index
    [0,9],[9,10],[10,11],[11,12],    // middle
    [0,13],[13,14],[14,15],[15,16],  // ring
    [0,17],[17,18],[18,19],[19,20],  // pinky
    [5,9],[9,13],[13,17]             // palm
  ];

  // Mirror x because video is CSS-mirrored
  const pts = landmarks.map(lm => ({
    x: (1 - lm.x) * canvasW,
    y: lm.y * canvasH
  }));

  ctx.strokeStyle = color;
  ctx.lineWidth   = 2;
  ctx.lineCap     = 'round';

  CONNECTIONS.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(pts[a].x, pts[a].y);
    ctx.lineTo(pts[b].x, pts[b].y);
    ctx.stroke();
  });

  pts.forEach((p, i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = i === 0 ? '#ffffff' : color;
    ctx.fill();
  });
}
