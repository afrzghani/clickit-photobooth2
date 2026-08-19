/**
 * Glam Booth — High-End Studio Skin Smoothing & Radiant Beauty Filter
 * Applies noticeable skin smoothing, brightness boost, and studio glow
 * both on live camera feed and captured photo output.
 */

let faceLandmarker: unknown = null;
let isInitialized = false;

export async function initGlamBooth(): Promise<void> {
  if (isInitialized) return;
  try {
    const { FaceLandmarker, FilesetResolver } = await import(
      "@mediapipe/tasks-vision"
    );
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU",
      },
      outputFaceBlendshapes: false,
      runningMode: "IMAGE",
      numFaces: 1,
    });
    isInitialized = true;
  } catch {
    // fallback gracefully if mediapipe WASM fails to load
    isInitialized = true;
  }
}

export async function applyGlamEffect(
  sourceCanvas: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const output = document.createElement("canvas");
  output.width = sourceCanvas.width;
  output.height = sourceCanvas.height;
  const ctx = output.getContext("2d")!;
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;

  // Layer 1: Base photo with contrast, brightness & saturation boost
  ctx.save();
  ctx.filter = "contrast(107%) brightness(109%) saturate(115%)";
  ctx.drawImage(sourceCanvas, 0, 0, w, h);
  ctx.restore();

  // Layer 2: Silky Skin Smoothing Overlay (Blurred soft-light blend)
  const blurCanvas = document.createElement("canvas");
  blurCanvas.width = w;
  blurCanvas.height = h;
  const blurCtx = blurCanvas.getContext("2d")!;
  blurCtx.filter = "blur(4px) brightness(106%)";
  blurCtx.drawImage(sourceCanvas, 0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.45; // 45% skin smoothing blur intensity
  ctx.drawImage(blurCanvas, 0, 0, w, h);
  ctx.restore();

  // Layer 3: Warm Studio Lighting Radiance Overlay
  ctx.save();
  const radGrad = ctx.createRadialGradient(
    w / 2, h / 3, w * 0.1,
    w / 2, h / 2, w * 0.8
  );
  radGrad.addColorStop(0, "rgba(255, 238, 225, 0.12)");
  radGrad.addColorStop(1, "rgba(255, 220, 235, 0.04)");
  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  return output;
}

export function destroyGlamBooth(): void {
  faceLandmarker = null;
  isInitialized = false;
}
