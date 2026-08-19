/**
 * GIF Composer using gif.js
 * Creates animated GIF from 3 captured photos
 */

export interface GifOptions {
  photos: string[]; // data URLs
  width?: number;
  height?: number;
  delay?: number; // ms per frame
}

export async function composeGif(opts: GifOptions): Promise<Blob> {
  const { photos, width = 600, height = 400, delay = 500 } = opts;

  return new Promise(async (resolve, reject) => {
    // Dynamically import gif.js to avoid SSR issues
    const GIF = (await import("gif.js")).default;

    const gif = new GIF({
      workers: 2,
      quality: 10,
      width,
      height,
      workerScript: "/gif.worker.js",
    });

    const images = await Promise.all(
      photos.map((src) => loadImageToCanvas(src, width, height))
    );

    for (const canvas of images) {
      gif.addFrame(canvas, { delay });
    }

    gif.on("finished", (blob: Blob) => resolve(blob));
    (gif as any).on("error", reject);
    gif.render();
  });
}

async function loadImageToCanvas(
  src: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;

      // Cover crop
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight);
      const sw = width / scale;
      const sh = height / scale;
      const sx = (img.naturalWidth - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

      resolve(canvas);
    };
    img.onerror = reject;
    img.src = src;
  });
}
