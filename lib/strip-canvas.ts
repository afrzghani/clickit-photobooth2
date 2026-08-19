/**
 * Strip Canvas Composer — ClickIt
 *
 * Output: 10×15 cm sheet @ 300 DPI = 1181×1772 px
 * Layout: 2 identical 5×15 cm strips side-by-side (2 columns × 3 rows = 6 photo slots)
 *
 * Coordinates fine-tuned for 3:2 photo windows matching standard 10x15cm frames:
 * Header: 350px (~2.96cm)
 * Photo Window: 485px × 325px (~3:2 aspect ratio)
 * Row Gap: 45px
 * Footer: 357px
 */

export interface StripOptions {
  photos: string[];          // 3 captured photo data URLs
  headerText?: string;
  hashtag?: string;
  socialHandle?: string;
  templateId?: string;       // preset ID or frame ID
  frameUrl?: string | null;  // PNG frame overlay image URL (uploaded by Admin)
  accentColor?: string;
}

// ── Dimensions (10x15cm @ 300DPI) ──────────────────────────────────
const DPI = 300;
const CM = (cm: number) => Math.round((cm / 2.54) * DPI);

export const SHEET_W = CM(10);  // 1181 px
export const SHEET_H = CM(15);  // 1772 px
export const STRIP_W = SHEET_W / 2; // 590.5 px (5 cm each)

// Precision 3:2 photo slot layout matching frame windows
const HEADER_H  = 350;  // 350 px top header offset
const FOOTER_H  = 357;  // 357 px bottom footer offset
const GAP_Y     = 45;   // 45 px vertical gap between photo rows

const PHOTO_H   = 325;  // 325 px height per photo (3:2 aspect ratio with 485px width)
const PHOTO_W   = 485;  // 485 px width per photo
const PAD_X_LEFT = 52;  // 52 px left padding for left strip
const PAD_X_RIGHT = 54; // 54 px left padding for right strip (ox + 54)

export async function composeStrip(opts: StripOptions): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = SHEET_W;
  canvas.height = SHEET_H;
  const ctx = canvas.getContext("2d")!;

  // 1. Load captured photos (3 shots)
  const images = await Promise.all(
    opts.photos.slice(0, 3).map((src) => loadImage(src).catch(() => null))
  );

  // 2. Clear canvas with white base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, SHEET_W, SHEET_H);

  // 3. Draw Photos UNDERNEATH overlay (Row 0, 1, 2 for both Left & Right columns)
  for (let row = 0; row < 3; row++) {
    const img = images[row];
    const y = HEADER_H + row * (PHOTO_H + GAP_Y);

    if (img) {
      // Left strip photo slot
      const leftX = PAD_X_LEFT;
      drawCroppedPhoto(ctx, img, leftX, y, PHOTO_W, PHOTO_H);

      // Right strip photo slot (identical photo)
      const rightX = STRIP_W + PAD_X_RIGHT;
      drawCroppedPhoto(ctx, img, rightX, y, PHOTO_W, PHOTO_H);
    } else {
      // Empty slot placeholder
      ctx.fillStyle = "#e0e0e0";
      ctx.fillRect(PAD_X_LEFT, y, PHOTO_W, PHOTO_H);
      ctx.fillRect(STRIP_W + PAD_X_RIGHT, y, PHOTO_W, PHOTO_H);
    }
  }

  // 4. Draw Frame Overlay (PNG Frame) if provided
  if (opts.frameUrl) {
    try {
      const frameImg = await loadImage(opts.frameUrl);
      ctx.drawImage(frameImg, 0, 0, SHEET_W, SHEET_H);
    } catch (e) {
      console.warn("Failed to load custom PNG frame overlay, using fallback procedural frame", e);
      drawProceduralFrame(ctx, opts);
    }
  } else {
    // Fallback procedural frame if no PNG frame URL is provided
    drawProceduralFrame(ctx, opts);
  }

  // 5. Subtle cut line indicator between 2 strips
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(STRIP_W, 0);
  ctx.lineTo(STRIP_W, SHEET_H);
  ctx.stroke();
  ctx.setLineDash([]);

  return canvas.toDataURL("image/jpeg", 0.95);
}

// ── Draw Procedural Default Frame ─────────────────────────────────────
function drawProceduralFrame(ctx: CanvasRenderingContext2D, opts: StripOptions) {
  const accent = opts.accentColor ?? "#ff3d8a";

  for (let side = 0; side < 2; side++) {
    const ox = side * STRIP_W;
    const padX = side === 0 ? PAD_X_LEFT : PAD_X_RIGHT;

    for (let row = 0; row < 3; row++) {
      const y = HEADER_H + row * (PHOTO_H + GAP_Y);
      const x = ox + padX;

      // Photo border/frame
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      roundRect(ctx, x, y, PHOTO_W, PHOTO_H, 12);
      ctx.stroke();
    }

    // Top Header Banner
    ctx.fillStyle = accent;
    ctx.fillRect(ox + padX, 40, PHOTO_W, HEADER_H - 80);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 36px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      (opts.headerText ?? "PHOTOBOOTH").toUpperCase(),
      ox + STRIP_W / 2,
      HEADER_H / 2
    );

    // Footer Text
    const footerY = SHEET_H - FOOTER_H / 2;
    ctx.fillStyle = "#6b3050";
    ctx.font = "600 22px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      opts.socialHandle ?? "@clickit.photobooth",
      ox + STRIP_W / 2,
      footerY
    );
  }
}

// ── Helper Functions ─────────────────────────────────────────────────
function drawCroppedPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;

  ctx.save();
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 10);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}
