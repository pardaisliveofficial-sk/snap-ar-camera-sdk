import { ArFilterAssetPackage } from "../types";
import { createCachedCanvas } from "../textureUtils";

let cachedMaskTexture: HTMLCanvasElement | null = null;

function renderVenetianMaskTexture(): HTMLCanvasElement {
  return createCachedCanvas(512, 340, (ctx, w, h) => {
    const cx = w / 2;
    const cy = h / 2 + 10;
    const eyeSpan = 135;
    const eyeCutoutW = 55;
    const eyeCutoutH = 34;

    // 1. Soft Ambient Drop Shadow under the mask for real 3D depth
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;

    // 2. Main Mask Silhouette: Venetian Filigree Winged Half-Mask
    const maskGrad = ctx.createLinearGradient(0, cy - 120, 0, cy + 120);
    maskGrad.addColorStop(0, "#0f172a");
    maskGrad.addColorStop(0.5, "#1e1b4b");
    maskGrad.addColorStop(1, "#311042");

    ctx.fillStyle = maskGrad;
    ctx.beginPath();
    // Top center forehead dip
    ctx.moveTo(cx, cy - 65);
    // Sweeping left wing over eyebrow and temple
    ctx.bezierCurveTo(cx - 70, cy - 115, cx - 180, cy - 110, cx - 240, cy - 50);
    ctx.bezierCurveTo(cx - 245, cy - 10, cx - 220, cy + 50, cx - 160, cy + 85);
    // Cheekbone curve under left eye to nose bridge
    ctx.bezierCurveTo(cx - 100, cy + 95, cx - 45, cy + 55, cx - 25, cy + 30);
    // Nose bridge notch
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx + 25, cy + 30);
    // Cheekbone curve under right eye to right temple
    ctx.bezierCurveTo(cx + 45, cy + 55, cx + 100, cy + 95, cx + 160, cy + 85);
    ctx.bezierCurveTo(cx + 220, cy + 50, cx + 245, cy - 10, cx + 240, cy - 50);
    ctx.bezierCurveTo(cx + 180, cy - 110, cx + 70, cy - 115, cx, cy - 65);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Cut out exact almond eye holes using 'destination-out' so real camera eyes and lashes show through!
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";

    const cutEye = (ex: number) => {
      ctx.beginPath();
      // Almond eye curve
      ctx.moveTo(ex - eyeCutoutW, cy);
      ctx.quadraticCurveTo(ex, cy - eyeCutoutH * 1.25, ex + eyeCutoutW, cy);
      ctx.quadraticCurveTo(ex, cy + eyeCutoutH * 1.2, ex - eyeCutoutW, cy);
      ctx.closePath();
      ctx.fill();
    };

    cutEye(cx - eyeSpan);
    cutEye(cx + eyeSpan);
    ctx.restore();

    // 4. Gold Leaf Filigree & Lace Damask Borders
    const goldGrad = ctx.createLinearGradient(0, cy - 100, w, cy + 100);
    goldGrad.addColorStop(0, "#fbbf24");
    goldGrad.addColorStop(0.3, "#fef08a");
    goldGrad.addColorStop(0.7, "#d97706");
    goldGrad.addColorStop(1, "#f59e0b");

    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 3.5;

    // Outer mask border
    ctx.beginPath();
    ctx.moveTo(cx, cy - 65);
    ctx.bezierCurveTo(cx - 70, cy - 115, cx - 180, cy - 110, cx - 240, cy - 50);
    ctx.bezierCurveTo(cx - 245, cy - 10, cx - 220, cy + 50, cx - 160, cy + 85);
    ctx.bezierCurveTo(cx - 100, cy + 95, cx - 45, cy + 55, cx - 25, cy + 30);
    ctx.lineTo(cx, cy + 18);
    ctx.lineTo(cx + 25, cy + 30);
    ctx.bezierCurveTo(cx + 45, cy + 55, cx + 100, cy + 95, cx + 160, cy + 85);
    ctx.bezierCurveTo(cx + 220, cy + 50, cx + 245, cy - 10, cx + 240, cy - 50);
    ctx.bezierCurveTo(cx + 180, cy - 110, cx + 70, cy - 115, cx, cy - 65);
    ctx.stroke();

    // Eye hole gold rims
    const rimEye = (ex: number) => {
      ctx.beginPath();
      ctx.moveTo(ex - eyeCutoutW, cy);
      ctx.quadraticCurveTo(ex, cy - eyeCutoutH * 1.25, ex + eyeCutoutW, cy);
      ctx.quadraticCurveTo(ex, cy + eyeCutoutH * 1.2, ex - eyeCutoutW, cy);
      ctx.closePath();
      ctx.stroke();
    };
    rimEye(cx - eyeSpan);
    rimEye(cx + eyeSpan);

    // Decorative Forehead Crest Medallion
    ctx.fillStyle = goldGrad;
    ctx.beginPath();
    ctx.arc(cx, cy - 45, 12, 0, Math.PI * 2);
    ctx.fill();

    // Central Ruby Jewel
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(cx, cy - 45, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.beginPath();
    ctx.arc(cx - 2, cy - 47, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

export const maskFilterAsset: ArFilterAssetPackage = {
  id: "mask",
  name: "Venetian Masquerade Filigree",
  description: "Intricate baroque midnight-indigo masquerade mask with embossed gold filigree and clear eye cutouts",
  category: "Face Art",
  layers: [
    {
      id: "mask_venetian",
      name: "Venetian Mask",
      anchor: "eyes_center",
      offset: [0, -0.05],
      size: [1.25, 0.82],
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedMaskTexture) cachedMaskTexture = renderVenetianMaskTexture();
        return cachedMaskTexture;
      },
    },
  ],
};
