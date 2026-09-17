/**
 * Texture rendering helper to create high-resolution cached offscreen canvases
 * from procedural vector artwork and SVG specifications.
 */
export function createCachedCanvas(
  width: number,
  height: number,
  drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    drawFn(ctx, width, height);
  }
  return canvas;
}
