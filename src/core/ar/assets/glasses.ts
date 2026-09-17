import { ArFilterAssetPackage } from "../types";
import { createCachedCanvas } from "../textureUtils";

let cachedGlassesTexture: HTMLCanvasElement | null = null;

function renderDesignerGlassesTexture(): HTMLCanvasElement {
  return createCachedCanvas(512, 220, (ctx, w, h) => {
    const cy = h / 2 + 5;
    const eyeSpan = 135;
    const lensR = 64;

    const leftLensX = w / 2 - eyeSpan;
    const rightLensX = w / 2 + eyeSpan;

    // 1. Semi-transparent gradient tinted lenses (allows real eyes to show through beautifully!)
    const drawLens = (cx: number) => {
      // Soft amber-rose tinted glass
      const glassGrad = ctx.createLinearGradient(cx - lensR, cy - lensR, cx + lensR, cy + lensR);
      glassGrad.addColorStop(0, "rgba(244, 114, 182, 0.22)");
      glassGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.18)");
      glassGrad.addColorStop(1, "rgba(59, 130, 246, 0.24)");

      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      // Aviator teardrop shape
      ctx.moveTo(cx - lensR * 0.85, cy - lensR * 0.7);
      ctx.quadraticCurveTo(cx, cy - lensR * 0.9, cx + lensR * 0.85, cy - lensR * 0.7);
      ctx.quadraticCurveTo(cx + lensR * 1.05, cy + lensR * 0.3, cx + lensR * 0.65, cy + lensR * 0.95);
      ctx.quadraticCurveTo(cx, cy + lensR * 1.1, cx - lensR * 0.65, cy + lensR * 0.95);
      ctx.quadraticCurveTo(cx - lensR * 1.05, cy + lensR * 0.3, cx - lensR * 0.85, cy - lensR * 0.7);
      ctx.closePath();
      ctx.fill();

      // Diagonal Glare / Glass Specular Flare
      const glareGrad = ctx.createLinearGradient(cx - lensR, cy - lensR, cx + lensR * 0.5, cy + lensR * 0.5);
      glareGrad.addColorStop(0, "rgba(255, 255, 255, 0.0)");
      glareGrad.addColorStop(0.35, "rgba(255, 255, 255, 0.0)");
      glareGrad.addColorStop(0.48, "rgba(255, 255, 255, 0.45)");
      glareGrad.addColorStop(0.52, "rgba(255, 255, 255, 0.45)");
      glareGrad.addColorStop(0.65, "rgba(255, 255, 255, 0.0)");
      glareGrad.addColorStop(1, "rgba(255, 255, 255, 0.0)");

      ctx.fillStyle = glareGrad;
      ctx.fill();

      // Secondary subtle curved rim reflection
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, lensR * 0.82, -Math.PI * 0.85, -Math.PI * 0.25);
      ctx.stroke();
    };

    drawLens(leftLensX);
    drawLens(rightLensX);

    // 2. Premium Metallic Frame & Rims (Polished Rose Gold / Titanium)
    const drawFrameRim = (cx: number) => {
      const frameGrad = ctx.createLinearGradient(cx - lensR, cy - lensR, cx + lensR, cy + lensR);
      frameGrad.addColorStop(0, "#fbbf24");
      frameGrad.addColorStop(0.3, "#fef08a");
      frameGrad.addColorStop(0.7, "#d97706");
      frameGrad.addColorStop(1, "#b45309");

      ctx.strokeStyle = frameGrad;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(cx - lensR * 0.85, cy - lensR * 0.7);
      ctx.quadraticCurveTo(cx, cy - lensR * 0.9, cx + lensR * 0.85, cy - lensR * 0.7);
      ctx.quadraticCurveTo(cx + lensR * 1.05, cy + lensR * 0.3, cx + lensR * 0.65, cy + lensR * 0.95);
      ctx.quadraticCurveTo(cx, cy + lensR * 1.1, cx - lensR * 0.65, cy + lensR * 0.95);
      ctx.quadraticCurveTo(cx - lensR * 1.05, cy + lensR * 0.3, cx - lensR * 0.85, cy - lensR * 0.7);
      ctx.closePath();
      ctx.stroke();

      // Outer bezel shine
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx - lensR * 0.3, cy - lensR * 0.65, lensR * 0.5, -Math.PI * 0.8, -Math.PI * 0.3);
      ctx.stroke();
    };

    drawFrameRim(leftLensX);
    drawFrameRim(rightLensX);

    // 3. Nose Bridge Piece (Double Aviator Bar)
    const bridgeGrad = ctx.createLinearGradient(leftLensX + lensR, cy, rightLensX - lensR, cy);
    bridgeGrad.addColorStop(0, "#d97706");
    bridgeGrad.addColorStop(0.5, "#fef08a");
    bridgeGrad.addColorStop(1, "#d97706");

    ctx.strokeStyle = bridgeGrad;
    ctx.lineWidth = 3.5;
    // Lower bridge
    ctx.beginPath();
    ctx.moveTo(leftLensX + lensR * 0.82, cy - 8);
    ctx.quadraticCurveTo(w / 2, cy - 18, rightLensX - lensR * 0.82, cy - 8);
    ctx.stroke();

    // Upper top sweat bar
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(leftLensX + lensR * 0.75, cy - lensR * 0.72);
    ctx.quadraticCurveTo(w / 2, cy - lensR * 0.85, rightLensX - lensR * 0.75, cy - lensR * 0.72);
    ctx.stroke();

    // 4. Side Temple Hinges
    ctx.fillStyle = "#b45309";
    ctx.fillRect(leftLensX - lensR * 1.08, cy - 12, 10, 8);
    ctx.fillRect(rightLensX + lensR * 0.98, cy - 12, 10, 8);
  });
}

export const glassesFilterAsset: ArFilterAssetPackage = {
  id: "glasses",
  name: "Designer Aviator Sunglasses",
  description: "Polished rose-gold metallic aviator frames with translucent tinted lenses and diagonal glass glare",
  category: "Fashion",
  layers: [
    {
      id: "glasses_frame",
      name: "Aviator Glasses",
      anchor: "eyes_center",
      offset: [0, 0],
      size: [1.15, 0.52],
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedGlassesTexture) cachedGlassesTexture = renderDesignerGlassesTexture();
        return cachedGlassesTexture;
      },
    },
  ],
};
