import { ArFilterAssetPackage, FilterLayer } from "../types";
import { createCachedCanvas } from "../textureUtils";
import { FaceLandmarksData } from "../../types";

let cachedLeftEar: HTMLCanvasElement | null = null;
let cachedRightEar: HTMLCanvasElement | null = null;
let cachedNoseMuzzle: HTMLCanvasElement | null = null;

function renderCatEarTexture(isRight: boolean): HTMLCanvasElement {
  return createCachedCanvas(256, 256, (ctx, w, h) => {
    ctx.save();
    if (isRight) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    // Outer Ear Shadow & Fur Body
    const outerGrad = ctx.createLinearGradient(60, 240, 140, 20);
    outerGrad.addColorStop(0, "#1e2430");
    outerGrad.addColorStop(0.5, "#2d3748");
    outerGrad.addColorStop(1, "#181d26");

    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(35, 240);
    // Outer curve up to pointed curved tip
    ctx.bezierCurveTo(40, 160, 80, 70, 145, 20);
    // Tip rounded slightly
    ctx.bezierCurveTo(152, 22, 158, 28, 155, 38);
    // Inner curve down to base
    ctx.bezierCurveTo(145, 90, 190, 180, 215, 240);
    ctx.closePath();
    ctx.fill();

    // Fur edge highlights on outer ear
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner Ear Depth Cavity
    const innerGrad = ctx.createLinearGradient(80, 220, 140, 60);
    innerGrad.addColorStop(0, "#f472b6");
    innerGrad.addColorStop(0.6, "#fda4af");
    innerGrad.addColorStop(1, "#ffe4e6");

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.moveTo(65, 225);
    ctx.bezierCurveTo(75, 160, 105, 90, 145, 50);
    ctx.bezierCurveTo(148, 85, 170, 165, 185, 225);
    ctx.closePath();
    ctx.fill();

    // Inner ear ambient shadow
    const shadowGrad = ctx.createRadialGradient(145, 140, 10, 145, 140, 80);
    shadowGrad.addColorStop(0, "rgba(219, 39, 119, 0.4)");
    shadowGrad.addColorStop(1, "rgba(219, 39, 119, 0.0)");
    ctx.fillStyle = shadowGrad;
    ctx.fill();

    // Fluffy white inner fur tufts
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const hairs = [
      { sx: 75, sy: 220, ex: 110, ey: 160 },
      { sx: 85, sy: 210, ex: 125, ey: 145 },
      { sx: 95, sy: 200, ex: 135, ey: 135 },
      { sx: 165, sy: 215, ex: 120, ey: 155 },
      { sx: 155, sy: 205, ex: 115, ey: 140 },
    ];

    for (const h of hairs) {
      ctx.beginPath();
      ctx.moveTo(h.sx, h.sy);
      ctx.quadraticCurveTo((h.sx + h.ex) / 2 + 8, (h.sy + h.ey) / 2, h.ex, h.ey);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function renderCatNoseMuzzleTexture(): HTMLCanvasElement {
  return createCachedCanvas(256, 180, (ctx, w, h) => {
    const cx = w / 2;
    const cy = 60;

    // Whisker pads / soft muzzle
    const muzzleGrad = ctx.createRadialGradient(cx, cy + 30, 10, cx, cy + 30, 80);
    muzzleGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
    muzzleGrad.addColorStop(0.7, "rgba(255, 241, 242, 0.75)");
    muzzleGrad.addColorStop(1, "rgba(255, 241, 242, 0.0)");

    ctx.fillStyle = muzzleGrad;
    // Left muzzle pad
    ctx.beginPath();
    ctx.ellipse(cx - 32, cy + 35, 38, 26, -0.1, 0, Math.PI * 2);
    ctx.fill();
    // Right muzzle pad
    ctx.beginPath();
    ctx.ellipse(cx + 32, cy + 35, 38, 26, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Whisker freckle dots
    ctx.fillStyle = "#94a3b8";
    const dots = [
      { x: cx - 45, y: cy + 30, r: 2.2 },
      { x: cx - 30, y: cy + 28, r: 2.5 },
      { x: cx - 40, y: cy + 42, r: 2.0 },
      { x: cx - 25, y: cy + 40, r: 2.2 },
      { x: cx + 45, y: cy + 30, r: 2.2 },
      { x: cx + 30, y: cy + 28, r: 2.5 },
      { x: cx + 40, y: cy + 42, r: 2.0 },
      { x: cx + 25, y: cy + 40, r: 2.2 },
    ];
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Realistic cat nose (heart/inverted triangle with leather grain and shine)
    const noseGrad = ctx.createLinearGradient(cx, cy - 15, cx, cy + 25);
    noseGrad.addColorStop(0, "#fb7185");
    noseGrad.addColorStop(0.6, "#f43f5e");
    noseGrad.addColorStop(1, "#be123c");

    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 24);
    ctx.bezierCurveTo(cx - 18, cy + 18, cx - 24, cy + 2, cx - 24, cy - 8);
    ctx.bezierCurveTo(cx - 24, cy - 16, cx - 12, cy - 18, cx, cy - 10);
    ctx.bezierCurveTo(cx + 12, cy - 18, cx + 24, cy - 16, cx + 24, cy - 8);
    ctx.bezierCurveTo(cx + 24, cy + 2, cx + 18, cy + 18, cx, cy + 24);
    ctx.closePath();
    ctx.fill();

    // Nostril slits
    ctx.fillStyle = "#881337";
    ctx.beginPath();
    ctx.ellipse(cx - 9, cy + 10, 4, 2, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 9, cy + 10, 4, 2, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Soft specular highlight on nose top
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Philtrum vertical groove
    ctx.strokeStyle = "#be123c";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 24);
    ctx.lineTo(cx, cy + 42);
    ctx.stroke();
  });
}

export const catFilterAsset: ArFilterAssetPackage = {
  id: "cat",
  name: "Realistic Feline",
  description: "Dimensional furry cat ears, textured pink nose leather, and elegant whiskered muzzle",
  category: "Animals",
  layers: [
    {
      id: "cat_left_ear",
      name: "Cat Left Ear",
      anchor: "forehead",
      offset: [-0.28, -0.22],
      size: [0.52, 0.52],
      rotationOffsetRad: -0.12,
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedLeftEar) cachedLeftEar = renderCatEarTexture(false);
        return cachedLeftEar;
      },
    },
    {
      id: "cat_right_ear",
      name: "Cat Right Ear",
      anchor: "forehead",
      offset: [0.28, -0.22],
      size: [0.52, 0.52],
      rotationOffsetRad: 0.12,
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedRightEar) cachedRightEar = renderCatEarTexture(true);
        return cachedRightEar;
      },
    },
    {
      id: "cat_muzzle",
      name: "Cat Muzzle & Nose",
      anchor: "nose_tip",
      offset: [0, 0.04],
      size: [0.46, 0.32],
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedNoseMuzzle) cachedNoseMuzzle = renderCatNoseMuzzleTexture();
        return cachedNoseMuzzle;
      },
    },
  ],
  customRenderPass: (ctx, w, h, lm: FaceLandmarksData) => {
    // Render high-precision flexible whiskers attached to muzzle and cheeks
    const nx = lm.noseTip.x * w;
    const ny = lm.noseTip.y * h;
    const headW = lm.headWidth * w;
    const roll = lm.rollAngleRad;
    const whiskerLen = headW * 0.58;

    ctx.save();
    ctx.translate(nx, ny + headW * 0.04);
    ctx.rotate(roll);

    const drawWhisker = (startX: number, startY: number, angleDeg: number, len: number, isRight: boolean) => {
      const dir = isRight ? 1 : -1;
      const rad = (angleDeg * Math.PI) / 180;
      const endX = startX + Math.cos(rad) * len * dir;
      const endY = startY + Math.sin(rad) * len;
      const ctrlX = startX + Math.cos(rad) * len * 0.45 * dir;
      const ctrlY = startY + Math.sin(rad) * len * 0.25 - 6;

      const grad = ctx.createLinearGradient(startX, startY, endX, endY);
      grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      grad.addColorStop(0.7, "rgba(255, 255, 255, 0.85)");
      grad.addColorStop(1, "rgba(255, 255, 255, 0.1)");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
      ctx.stroke();
    };

    // Left Whiskers (3 curving strands)
    const baseLX = -headW * 0.12;
    drawWhisker(baseLX, -4, -12, whiskerLen, false);
    drawWhisker(baseLX, 4, 3, whiskerLen * 1.05, false);
    drawWhisker(baseLX, 12, 18, whiskerLen * 0.95, false);

    // Right Whiskers (3 curving strands)
    const baseRX = headW * 0.12;
    drawWhisker(baseRX, -4, -12, whiskerLen, true);
    drawWhisker(baseRX, 4, 3, whiskerLen * 1.05, true);
    drawWhisker(baseRX, 12, 18, whiskerLen * 0.95, true);

    ctx.restore();
  },
};
