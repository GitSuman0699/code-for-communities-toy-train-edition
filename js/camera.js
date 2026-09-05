/**
 * camera.js — Camera Capture Module
 *
 * Handles camera access via getUserMedia, photo capture,
 * and image compression for storage in IndexedDB.
 */

let _stream = null;

/**
 * Start the camera and attach to a video element.
 * @param {HTMLVideoElement} videoEl - The video element to stream to
 * @returns {Promise<MediaStream>}
 */
async function startCamera(videoEl) {
  try {
    // Prefer back camera for inspection photos
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 960 },
      },
      audio: false,
    };

    _stream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = _stream;
    await videoEl.play();

    return _stream;
  } catch (error) {
    console.error('[Camera] Failed to start:', error);
    throw error;
  }
}

/**
 * Capture a photo from the video stream.
 * @param {HTMLVideoElement} videoEl - The video element currently streaming
 * @param {HTMLCanvasElement} canvasEl - A canvas element for rendering
 * @param {Object} options - { quality: 0.8, maxWidth: 1024 }
 * @returns {string} Base64-encoded JPEG data URL
 */
function capturePhoto(videoEl, canvasEl, options = {}) {
  const { quality = 0.8, maxWidth = 1024 } = options;

  const videoWidth = videoEl.videoWidth;
  const videoHeight = videoEl.videoHeight;

  // Scale down if needed
  let width = videoWidth;
  let height = videoHeight;

  if (width > maxWidth) {
    const ratio = maxWidth / width;
    width = maxWidth;
    height = Math.round(height * ratio);
  }

  canvasEl.width = width;
  canvasEl.height = height;

  const ctx = canvasEl.getContext('2d');
  ctx.drawImage(videoEl, 0, 0, width, height);

  // Return as JPEG data URL (smaller than PNG)
  return canvasEl.toDataURL('image/jpeg', quality);
}

/**
 * Stop the camera stream and release resources.
 */
function stopCamera() {
  if (_stream) {
    _stream.getTracks().forEach((track) => track.stop());
    _stream = null;
  }
}

/**
 * Check if the camera is currently active.
 * @returns {boolean}
 */
function isCameraActive() {
  return _stream !== null && _stream.active;
}

/**
 * Convert a data URL to a Blob for more efficient storage.
 * @param {string} dataUrl
 * @returns {Blob}
 */
function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const binary = atob(parts[1]);
  const array = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }

  return new Blob([array], { type: mime });
}

/**
 * Compress an existing image (from file input fallback).
 * @param {File} file - The image file
 * @param {Object} options - { quality: 0.8, maxWidth: 1024 }
 * @returns {Promise<string>} Base64-encoded data URL
 */
function compressImage(file, options = {}) {
  const { quality = 0.8, maxWidth = 1024 } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a realistic simulated camera capture for quick field testing / desktop testing.
 * @param {string} hazardType
 * @returns {string} Base64 JPEG data URL
 */
function createSamplePhoto(hazardType = 'slip') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  // Background - Mountain slope
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 200);
  skyGrad.addColorStop(0, '#64748b');
  skyGrad.addColorStop(1, '#94a3b8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 640, 480);

  // Mountain ridge
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(0, 180);
  ctx.lineTo(200, 120);
  ctx.lineTo(450, 190);
  ctx.lineTo(640, 130);
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.fill();

  // Hillside terrain & greenery
  ctx.fillStyle = '#1e3a1e';
  ctx.beginPath();
  ctx.moveTo(0, 240);
  ctx.quadraticCurveTo(320, 210, 640, 260);
  ctx.lineTo(640, 480);
  ctx.lineTo(0, 480);
  ctx.fill();

  // Railway track bed (ballast)
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(100, 480);
  ctx.lineTo(260, 280);
  ctx.lineTo(380, 280);
  ctx.lineTo(540, 480);
  ctx.fill();

  // Sleepers & Rails
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const y = 290 + t * 180;
    const w = 110 + t * 240;
    const x = 320 - w / 2;
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, w, 6 + t * 6);
  }

  // Steel Rails
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(275, 280);
  ctx.lineTo(160, 480);
  ctx.moveTo(365, 280);
  ctx.lineTo(480, 480);
  ctx.stroke();

  // Hazard overlay based on type
  if (hazardType === 'slip' || hazardType === 'other') {
    // Mud / landslide debris
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.ellipse(330, 360, 140, 60, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(360, 370, 70, 35, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (hazardType === 'rockfall') {
    // Large fallen rock/boulder
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(280, 320);
    ctx.lineTo(360, 310);
    ctx.lineTo(410, 370);
    ctx.lineTo(350, 420);
    ctx.lineTo(260, 390);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 3;
    ctx.stroke();
  } else if (hazardType === 'drain') {
    // Flooded water
    ctx.fillStyle = 'rgba(30, 64, 175, 0.7)';
    ctx.fillRect(180, 340, 280, 80);
    ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
    ctx.fillRect(200, 350, 240, 15);
  } else if (hazardType === 'wall') {
    // Broken retaining wall
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(80, 260, 140, 180);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(130, 260);
    ctx.lineTo(150, 330);
    ctx.lineTo(140, 440);
    ctx.stroke();
  }

  // Camera field overlay & timestamp
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(10, 10, 340, 34);
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 13px monospace';
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  ctx.fillText(`DHR PATROL CAM · ${now}`, 20, 32);

  return canvas.toDataURL('image/jpeg', 0.85);
}

// Export
window.Camera = {
  startCamera,
  capturePhoto,
  stopCamera,
  isCameraActive,
  dataUrlToBlob,
  compressImage,
  createSamplePhoto,
};
