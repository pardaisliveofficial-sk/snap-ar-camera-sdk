import { ArFilterAssetPackage } from "../types";
import { createCachedCanvas } from "../textureUtils";
import { FaceLandmarksData } from "../../types";

let cachedElephantLeftEar: HTMLCanvasElement | null = null;
let cachedElephantRightEar: HTMLCanvasElement | null = null;
let cachedTrunkTusks: HTMLCanvasElement | null = null;

function renderElephantEarTexture(isRight: boolean): HTMLCanvasElement {
  return createCachedCanvas(320, 360, (ctx, w, h) => {
    ctx.save();
    if (isRight) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    // Outer Ear Slate-Gray Leathery Body
    const outerGrad = ctx.createRadialGradient(220, 160, 20, 180, 180, 170);
    outerGrad.addColorStop(0, "#475569");
    outerGrad.addColorStop(0.6, "#334155");
    outerGrad.addColorStop(1, "#1e293b");

    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.moveTo(260, 60);
    // Flared upper lobe
    ctx.bezierCurveTo(200, 20, 80, 30, 40, 100);
    // Scalloped outer edge with natural folds
    ctx.bezierCurveTo(20, 160, 30, 240, 80, 300);
    // Lower lobe
    ctx.bezierCurveTo(140, 350, 220, 330, 270, 280);
    // Base attachment
    ctx.bezierCurveTo(260, 220, 250, 140, 260, 60);
    ctx.closePath();
    ctx.fill();

    // Inner Ear Warm Pink Undertone
    const innerGrad = ctx.createRadialGradient(180, 160, 10, 180, 160, 110);
    innerGrad.addColorStop(0, "rgba(251, 113, 133, 0.4)");
    innerGrad.addColorStop(0.7, "rgba(251, 113, 133, 0.15)");
    innerGrad.addColorStop(1, "rgba(251, 113, 133, 0.0)");

    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.ellipse(170, 170, 95, 115, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Natural skin fold lines & wrinkles
    ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const wrinkles = [
      { sx: 80, sy: 120, cx: 140, cy: 140, ex: 220, ey: 110 },
      { sx: 70, sy: 180, cx: 130, cy: 190, ex: 210, ey: 170 },
      { sx: 90, sy: 240, cx: 150, cy: 245, ex: 230, ey: 220 },
      { sx: 120, sy: 280, cx: 170, cy: 280, ex: 240, ey: 260 },
    ];
    for (const wr of wrinkles) {
      ctx.beginPath();
      ctx.moveTo(wr.sx, wr.sy);
      ctx.quadraticCurveTo(wr.cx, wr.cy, wr.ex, wr.ey);
      ctx.stroke();
    }

    // Delicate highlight on outer edge
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(255, 65);
    ctx.bezierCurveTo(200, 24, 85, 34, 45, 102);
    ctx.bezierCurveTo(25, 162, 35, 242, 85, 302);
    ctx.stroke();

    ctx.restore();
  });
}

function renderElephantTrunkAndTusksTexture(): HTMLCanvasElement {
  return createCachedCanvas(280, 420, (ctx, w, h) => {
    const cx = w / 2;

    // 1. Polished Ivory Tusks flanking the trunk
    const tuskGradL = ctx.createLinearGradient(cx - 70, 140, cx - 110, 260);
    tuskGradL.addColorStop(0, "#fef3c7");
    tuskGradL.addColorStop(0.5, "#ffffff");
    tuskGradL.addColorStop(1, "#d97706");

    // Left Tusk
    ctx.fillStyle = tuskGradL;
    ctx.beginPath();
    ctx.moveTo(cx - 30, 130);
    ctx.bezierCurveTo(cx - 55, 140, cx - 85, 190, cx - 95, 240);
    ctx.bezierCurveTo(cx - 98, 255, cx - 85, 250, cx - 75, 230);
    ctx.bezierCurveTo(cx - 55, 190, cx - 40, 150, cx - 25, 135);
    ctx.closePath();
    ctx.fill();

    // Right Tusk
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.fillStyle = tuskGradL;
    ctx.beginPath();
    ctx.moveTo(cx - 30, 130);
    ctx.bezierCurveTo(cx - 55, 140, cx - 85, 190, cx - 95, 240);
    ctx.bezierCurveTo(cx - 98, 255, cx - 85, 250, cx - 75, 230);
    ctx.bezierCurveTo(cx - 55, 190, cx - 40, 150, cx - 25, 135);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Elephant Trunk Body
    const trunkGrad = ctx.createLinearGradient(cx - 40, 20, cx + 40, 380);
    trunkGrad.addColorStop(0, "#475569");
    trunkGrad.addColorStop(0.5, "#334155");
    trunkGrad.addColorStop(1, "#1e293b");

    ctx.fillStyle = trunkGrad;
    ctx.beginPath();
    // Top attached to nose bridge
    ctx.moveTo(cx - 42, 20);
    // Left side curving down and sweeping slightly left then curled right
    ctx.bezierCurveTo(cx - 38, 100, cx - 45, 190, cx - 35, 270);
    ctx.bezierCurveTo(cx - 28, 330, cx - 15, 380, cx + 15, 395);
    // Trunk tip nostrils
    ctx.bezierCurveTo(cx + 35, 400, cx + 42, 380, cx + 32, 360);
    // Right side coming back up
    ctx.bezierCurveTo(cx + 18, 340, cx + 10, 290, cx + 22, 220);
    ctx.bezierCurveTo(cx + 35, 150, cx + 40, 80, cx + 42, 20);
    ctx.closePath();
    ctx.fill();

    // Horizontal segmented ring creases on trunk
    ctx.strokeStyle = "rgba(15, 23, 42, 0.55)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    for (let y = 50; y <= 350; y += 24) {
      const segWidth = 36 * (1.0 - (y - 50) / 450);
      ctx.beginPath();
      ctx.moveTo(cx - segWidth, y);
      ctx.quadraticCurveTo(cx, y + 6, cx + segWidth, y);
      ctx.stroke();

      // Crease highlight
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx - segWidth + 2, y + 2);
      ctx.quadraticCurveTo(cx, y + 8, cx + segWidth - 2, y + 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(15, 23, 42, 0.55)";
      ctx.lineWidth = 3;
    }

    // Nostril holes at trunk tip
    ctx.fillStyle = "#020617";
    ctx.beginPath();
    ctx.ellipse(cx + 25, 375, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 32, 378, 4, 3, 0.3, 0, Math.PI * 2);
    ctx.fill();
  });
}

export const elephantFilterAsset: ArFilterAssetPackage = {
  id: "elephant",
  name: "Safari Elephant",
  description: "Majestic leathery elephant ears, polished ivory tusks, and flexible segmented curved trunk",
  category: "Animals",
  layers: [
    {
      id: "elephant_left_ear",
      name: "Elephant Left Ear",
      anchor: "forehead",
      offset: [-0.68, -0.38],
      size: [0.95, 1.05],
      rotationOffsetRad: -0.08,
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedElephantLeftEar) cachedElephantLeftEar = renderElephantEarTexture(false);
        return cachedElephantLeftEar;
      },
    },
    {
      id: "elephant_right_ear",
      name: "Elephant Right Ear",
      anchor: "forehead",
      offset: [0.68, -0.38],
      size: [0.95, 1.05],
      rotationOffsetRad: 0.08,
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedElephantRightEar) cachedElephantRightEar = renderElephantEarTexture(true);
        return cachedElephantRightEar;
      },
    },
    {
      id: "elephant_trunk",
      name: "Trunk & Tusks",
      anchor: "nose_tip",
      offset: [0, 0.28],
      size: [0.72, 1.05],
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedTrunkTusks) cachedTrunkTusks = renderElephantTrunkAndTusksTexture();
        return cachedTrunkTusks;
      },
    },
  ],
};
