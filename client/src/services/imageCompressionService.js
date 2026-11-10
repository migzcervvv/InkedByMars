/**
 * imageCompressionService.js
 *
 * Converts uploaded images to WebP and compresses them to stay within a
 * configurable byte limit. Zero external dependencies — uses only the
 * Canvas API and standard Web APIs.
 *
 * Compression strategy
 * ────────────────────
 * Phase 1 — Quality sweep   : Try decreasing WebP quality at full (clamped)
 *                             resolution. Reduces size with no visible change
 *                             in sharpness for moderate compression ratios.
 *
 * Phase 2 — Dimension sweep : If quality alone cannot reach the target, scale
 *                             the canvas down in progressive steps and repeat
 *                             the quality ladder at each level.
 *
 * Safeguard                 : If neither phase reaches the target (an
 *                             extraordinarily rare scenario), the smallest
 *                             result achieved is returned rather than throwing,
 *                             so callers always receive a usable image.
 */

// ─── Configuration ────────────────────────────────────────────────────────────

/** Maximum allowed output file size in bytes. */
// 540 kB becomes about 720 kB of base64 plus its prefix, below the API's
// 750,000-character per-image limit. Four references stay below the 8 MB body limit.
const MAX_OUTPUT_BYTES = 540000;

/** MIME type for all output images. */
const OUTPUT_MIME = "image/webp";

/**
 * Maximum canvas edge length (px).
 *
 * A 4096 × 4096 canvas at 4 bytes/px ≈ 64 MB of raw bitmap — a reasonable
 * ceiling that prevents excessive memory allocation for very high-resolution
 * source images (e.g. 20 MP phone shots) without meaningfully reducing quality
 * for typical web display sizes.
 */
const MAX_CANVAS_DIMENSION = 4096;

/**
 * MIME types the browser's native Image API can reliably decode.
 *
 * HEIC / HEIF are intentionally excluded — native browser decoding is absent
 * on most platforms without a third-party codec library.
 */
const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif", // Only the first frame is captured for animated GIFs.
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/svg+xml",
]);

/**
 * Phase 1 — WebP quality values to try at full (clamped) resolution.
 *
 * Starting at 0.92 (near-lossless for most images) and stepping down to 0.22
 * gives seven attempts before dimension reduction is triggered. Values below
 * ~0.20 produce noticeable blocking artefacts and are deliberately avoided.
 */
const QUALITY_STEPS = [0.92, 0.82, 0.72, 0.6, 0.48, 0.35, 0.22];

/**
 * Phase 2 — Fractional scale factors applied on top of the initial dimension
 * clamping. Each step roughly halves the pixel count of the previous level,
 * providing broad coverage without an excessive number of canvas allocations.
 */
const SCALE_STEPS = [0.85, 0.7, 0.55, 0.45, 0.35, 0.25];

// ─── Private utilities ────────────────────────────────────────────────────────

/**
 * Replaces (or appends) the filename extension.
 *
 * @param {string} filename
 * @param {string} ext - New extension without a leading dot.
 * @returns {string}
 */
const replaceExtension = (filename, ext) => {
  const dotIndex = filename.lastIndexOf(".");
  const base = dotIndex !== -1 ? filename.slice(0, dotIndex) : filename;
  return `${base}.${ext}`;
};

/**
 * Computes the uniform scale factor needed to bring the image's longest edge
 * within MAX_CANVAS_DIMENSION. Returns 1 if no clamping is needed (i.e. the
 * image is already small enough), ensuring source images are never upscaled.
 *
 * @param {HTMLImageElement} img
 * @returns {number} Scale factor in the range (0, 1].
 */
const getClampScale = (img) => {
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  return longest > MAX_CANVAS_DIMENSION ? MAX_CANVAS_DIMENSION / longest : 1;
};

/**
 * Loads a File into an HTMLImageElement using an object URL.
 *
 * Object URLs are far more memory-efficient than base64 for large source files
 * because the browser can stream the data directly from its internal blob store
 * rather than keeping a decoded copy in the JS heap. The URL is revoked
 * immediately after the image finishes loading.
 *
 * @param {File} file
 * @returns {Promise<HTMLImageElement>}
 */
const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl); // Release blob reference immediately.
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          `Unable to decode image "${file.name}". ` +
            "The file may be corrupt or contain a format the browser cannot handle.",
        ),
      );
    };

    img.src = objectUrl;
  });

/**
 * Creates an off-screen <canvas> and draws the image at the specified scale.
 *
 * `clampScale` accounts for MAX_CANVAS_DIMENSION and is computed once per
 * image. `extraScale` is the additional Phase 2 reduction factor (from
 * SCALE_STEPS). Dimensions are clamped to a minimum of 1 px to prevent
 * zero-size canvas errors on extremely small images.
 *
 * `imageSmoothingQuality = 'high'` selects a bicubic-like filter on supported
 * engines (Chromium, Firefox ≥ 93), which significantly reduces aliasing when
 * downsampling by large factors.
 *
 * @param {HTMLImageElement} img
 * @param {number} clampScale   - Pre-computed dimension-clamping factor (0, 1].
 * @param {number} [extraScale] - Additional scale reduction (0, 1]. Default 1.
 * @returns {HTMLCanvasElement}
 */
const drawToCanvas = (img, clampScale, extraScale = 1) => {
  const canvas = document.createElement("canvas");
  const totalScale = clampScale * extraScale;

  canvas.width = Math.max(1, Math.round(img.naturalWidth * totalScale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * totalScale));

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  return canvas;
};

/**
 * Encodes a canvas to a WebP Blob at the requested quality level.
 *
 * `canvas.toBlob` is preferred over `canvas.toDataURL` because it avoids
 * constructing a potentially very large base64 string in the JS heap — the
 * browser writes directly to a Blob backed by native memory.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} quality - Encoding quality in [0.0, 1.0].
 * @returns {Promise<Blob>}
 */
const encodeToBlob = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // toBlob returns null when the browser cannot encode the requested MIME type.
          reject(
            new Error(
              "canvas.toBlob() returned null. " +
                "WebP encoding is not supported in this browser. " +
                "Consider Safari < 14 or very old Chromium versions.",
            ),
          );
        }
      },
      OUTPUT_MIME,
      quality,
    );
  });

/**
 * Reads a Blob as a base64-encoded data URL via FileReader.
 *
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
const blobToDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(/** @type {string} */ (reader.result));
    reader.onerror = () =>
      reject(new Error("FileReader failed while converting Blob to data URL."));
    reader.readAsDataURL(blob);
  });

// ─── Compression engine ───────────────────────────────────────────────────────

/**
 * Two-phase compression engine.
 *
 * Phase 1 — Quality sweep
 *   The source image is drawn onto a single canvas at its clamped dimensions.
 *   That canvas is encoded repeatedly at decreasing quality values. Because
 *   `canvas.toBlob` is non-destructive, the canvas is allocated only once
 *   for this phase, keeping memory pressure low.
 *
 *   This phase handles the vast majority of real-world cases. A 12 MP JPEG
 *   shot on a modern phone typically compresses from ~5–8 MB to under 2 MB
 *   somewhere between quality 0.72 and 0.60.
 *
 * Phase 2 — Dimension sweep
 *   If quality reduction cannot reach the target (e.g. a highly complex image
 *   with extreme detail), the canvas is redrawn at progressively smaller
 *   dimensions and the quality ladder is repeated at each level. A new canvas
 *   is allocated per scale step; quality iterations within that step reuse it.
 *
 * Tracking `smallestBlob` across all attempts ensures we always have a
 * fallback to return in the safeguard path without an additional encode call.
 *
 * @param {HTMLImageElement} img
 * @returns {Promise<Blob>}
 */
const compressToTarget = async (img) => {
  const clampScale = getClampScale(img);
  let smallestBlob = null;

  // ── Phase 1: quality sweep at full clamped resolution ──────────────────────
  const fullCanvas = drawToCanvas(img, clampScale);

  for (const quality of QUALITY_STEPS) {
    const blob = await encodeToBlob(fullCanvas, quality);

    if (!smallestBlob || blob.size < smallestBlob.size) {
      smallestBlob = blob;
    }

    if (blob.size <= MAX_OUTPUT_BYTES) {
      return blob; // Target reached — stop immediately
    }
  }

  // ── Phase 2: dimension reduction + quality sweep ────────────────────────────
  for (const extraScale of SCALE_STEPS) {
    const scaledCanvas = drawToCanvas(img, clampScale, extraScale);

    for (const quality of QUALITY_STEPS) {
      const blob = await encodeToBlob(scaledCanvas, quality);

      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }

      if (blob.size <= MAX_OUTPUT_BYTES) {
        return blob; // Target reached
      }
    }
  }

  // ── Safeguard ───────────────────────────────────────────────────────────────
  // Reached only when the image exceeds 2 MB even at 22 % quality and 25 % of
  // its (already clamped) dimensions — essentially impossible for photographic
  // content, but theoretically possible for algorithmically generated noise images.
  console.warn(
    "[imageCompressionService] Could not compress image below 2 MB. " +
      `Returning smallest result: ${(smallestBlob.size / 1024 / 1024).toFixed(2)} MB. ` +
      "Consider reducing MAX_CANVAS_DIMENSION or adding a lower SCALE_STEPS entry.",
  );
  return smallestBlob;
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Processes a single image File: validates its type, converts it to WebP,
 * and compresses it to below MAX_OUTPUT_BYTES.
 *
 * Fast path: if the file is already WebP and within the size limit, the
 * canvas round-trip is skipped entirely. This preserves the original encoding
 * quality and avoids an unnecessary generation-loss decode/re-encode cycle.
 *
 * @param {File} file - An image File from an <input type="file"> or drag-drop.
 * @returns {Promise<{
 *   name:    string,   // Original filename with extension replaced by .webp
 *   size:    number,   // Output file size in bytes
 *   type:    string,   // Always 'image/webp'
 *   dataUrl: string,   // Base64 data URL ready for <img src> or state storage
 * }>}
 * @throws {Error} If the file type is unsupported or decoding fails.
 */
export const processImage = async (file) => {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error(`${file.name}: choose an image smaller than 20 MB.`);
  }
  // 1. Validate MIME type ─────────────────────────────────────────────────────
  if (!SUPPORTED_TYPES.has(file.type)) {
    throw new Error(
      `Unsupported file type: "${file.type || "(unknown)"}". ` +
        `Accepted types: ${[...SUPPORTED_TYPES].join(", ")}.`,
    );
  }

  // 2. Fast path: already valid WebP within the size limit ───────────────────
  if (file.type === "image/webp" && file.size <= MAX_OUTPUT_BYTES) {
    const dataUrl = await blobToDataUrl(file);
    if (dataUrl.length > 750000) throw new Error(`${file.name}: the prepared image is too large.`);
    return {
      name: replaceExtension(file.name, "webp"),
      size: file.size,
      type: OUTPUT_MIME,
      dataUrl,
    };
  }

  // 3. Load into an Image element for canvas drawing ─────────────────────────
  const img = await loadImageElement(file);

  // 4. Compress via two-phase engine ─────────────────────────────────────────
  const blob = await compressToTarget(img);

  // 5. Encode to data URL for state storage ──────────────────────────────────
  const dataUrl = await blobToDataUrl(blob);

  if (dataUrl.length > 750000) {
    throw new Error(`${file.name}: this image could not be made small enough. Choose a smaller image.`);
  }

  return {
    name: replaceExtension(file.name, "webp"),
    size: blob.size,
    type: OUTPUT_MIME,
    dataUrl,
  };
};

/**
 * Processes multiple image Files concurrently.
 *
 * Failures for individual files are surfaced as rejected entries in the
 * settled results — wrap with `Promise.allSettled` at the call site if you
 * want partial success rather than an all-or-nothing outcome.
 *
 * @param {File[]} files
 * @returns {Promise<Array<{ name: string, size: number, type: string, dataUrl: string }>>}
 */
export const processImages = (files) => Promise.all(files.map(processImage));
