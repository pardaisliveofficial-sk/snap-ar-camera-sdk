import { ArFilterAssetPackage } from "../types";
import { createCachedCanvas } from "../textureUtils";
import { FaceLandmarksData } from "../../types";

let cachedDogLeftEar: HTMLCanvasElement | null = null;
let cachedDogRightEar: HTMLCanvasElement | null = null;
let cachedDogNose: HTMLCanvasElement | null = null;
let cachedDogTongue: HTMLCanvasElement | null = null;

function renderDogEarTexture(isRight: boolean): HTMLCanvasElement {
  return createCachedCanvas(256, 320, (ctx, w, h) => {
    ctx.save();
    if (isRight) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }

    // Ear base shadow
    const shadowGrad = ctx.createRadialGradient(100, 40, 10, 100, 40, 70);
    shadowGrad.addColorStop(0, "rgba(74, 43, 23, 0.6)");
    shadowGrad.addColorStop(1, "rgba(74, 43, 23, 0.0)");
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(100, 40, 60, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Ear Body - Warm Golden-Honey Coat with Rich Shading
    const earGrad = ctx.createLinearGradient(40, 20, 160, 290);
    earGrad.addColorStop(0, "#854d0e");
    earGrad.addColorStop(0.35, "#b45309");
    earGrad.addColorStop(0.7, "#d97706");
    earGrad.addColorStop(1, "#92400e");

    ctx.fillStyle = earGrad;
    ctx.beginPath();
    // Ear root attached to head
    ctx.moveTo(80, 25);
    // Outer fold curving out and drooping down
    ctx.bezierCurveTo(40, 50, 25, 120, 30, 210);
    // Rounded floppy tip at bottom
    ctx.bezierCurveTo(35, 275, 95, 305, 140, 285);
    // Inner fold coming back up to head
    ctx.bezierCurveTo(180, 260, 175, 160, 155, 60);
    ctx.bezierCurveTo(150, 35, 110, 20, 80, 25);
    ctx.closePath();
    ctx.fill();

    // Inner fold overlap shadow giving 3D thickness
    const foldGrad = ctx.createLinearGradient(90, 80, 145, 230);
    foldGrad.addColorStop(0, "rgba(69, 26, 3, 0.45)");
    foldGrad.addColorStop(1, "rgba(69, 26, 3, 0.0)");
    ctx.fillStyle = foldGrad;
    ctx.beginPath();
    ctx.moveTo(110, 50);
    ctx.bezierCurveTo(145, 120, 150, 200, 125, 260);
    ctx.bezierCurveTo(140, 220, 145, 140, 130, 60);
    ctx.closePath();
    ctx.fill();

    // Delicate fur edge feathering
    ctx.strokeStyle = "rgba(254, 243, 199, 0.35)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.restore();
  });
}

function renderDogNoseMuzzleTexture(): HTMLCanvasElement {
  return createCachedCanvas(256, 180, (ctx, w, h) => {
    const cx = w / 2;
    const cy = 65;

    // Soft muzzle backing
    const muzzleGrad = ctx.createRadialGradient(cx, cy + 25, 10, cx, cy + 25, 75);
    muzzleGrad.addColorStop(0, "rgba(254, 243, 199, 0.9)");
    muzzleGrad.addColorStop(0.7, "rgba(253, 230, 138, 0.75)");
    muzzleGrad.addColorStop(1, "rgba(253, 230, 138, 0.0)");

    ctx.fillStyle = muzzleGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30, 75, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Freckle dots
    ctx.fillStyle = "#78350f";
    const dots = [
      { x: cx - 42, y: cy + 32, r: 2.5 },
      { x: cx - 28, y: cy + 40, r: 2.8 },
      { x: cx - 48, y: cy + 44, r: 2.2 },
      { x: cx + 42, y: cy + 32, r: 2.5 },
      { x: cx + 28, y: cy + 40, r: 2.8 },
      { x: cx + 48, y: cy + 44, r: 2.2 },
    ];
    for (const d of dots) {
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Realistic dog nose - moist black leather with textured surface
    const noseGrad = ctx.createLinearGradient(cx, cy - 20, cx, cy + 25);
    noseGrad.addColorStop(0, "#334155");
    noseGrad.addColorStop(0.3, "#0f172a");
    noseGrad.addColorStop(1, "#020617");

    ctx.fillStyle = noseGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy - 8);
    ctx.bezierCurveTo(cx - 36, cy - 22, cx + 36, cy - 22, cx + 36, cy - 8);
    ctx.bezierCurveTo(cx + 38, cy + 12, cx + 24, cy + 26, cx, cy + 28);
    ctx.bezierCurveTo(cx - 24, cy + 26, cx - 38, cy + 12, cx - 36, cy - 8);
    ctx.closePath();
    ctx.fill();

    // Nostril cavities
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.ellipse(cx - 14, cy + 8, 7, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 14, cy + 8, 7, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Wet specular glints on nose top and ridges
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.ellipse(cx - 8, cy - 10, 10, 4, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 12, cy - 9, 7, 3, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Philtrum vertical groove
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 28);
    ctx.lineTo(cx, cy + 50);
    ctx.stroke();
  });
}

function renderDogTongueTexture(): HTMLCanvasElement {
  return createCachedCanvas(160, 240, (ctx, w, h) => {
    const cx = w / 2;
    // Glossy pink tongue
    const tongueGrad = ctx.createLinearGradient(cx, 10, cx, 220);
    tongueGrad.addColorStop(0, "#f43f5e");
    tongueGrad.addColorStop(0.6, "#fb7185");
    tongueGrad.addColorStop(1, "#fda4af");

    ctx.fillStyle = tongueGrad;
    ctx.beginPath();
    ctx.moveTo(cx - 38, 20);
    ctx.bezierCurveTo(cx - 45, 80, cx - 40, 170, cx, 215);
    ctx.bezierCurveTo(cx + 40, 170, cx + 45, 80, cx + 38, 20);
    ctx.closePath();
    ctx.fill();

    // Center groove depression
    ctx.strokeStyle = "#be123c";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(cx, 30);
    ctx.lineTo(cx, 185);
    ctx.stroke();

    // Wet saliva specular highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.beginPath();
    ctx.ellipse(cx - 12, 100, 5, 22, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 10, 130, 4, 16, 0.1, 0, Math.PI * 2);
    ctx.fill();
  });
}

export const dogFilterAsset: ArFilterAssetPackage = {
  id: "dog",
  name: "Playful Golden Pup",
  description: "Floppy golden puppy ears, moist textured nose, and interactive responsive wagging tongue",
  category: "Animals",
  layers: [
    {
      id: "dog_left_ear",
      name: "Dog Left Ear",
      anchor: "forehead",
      offset: [-0.48, -0.32],
      size: [0.65, 0.85],
      rotationOffsetRad: -0.1,
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedDogLeftEar) cachedDogLeftEar = renderDogEarTexture(false);
        return cachedDogLeftEar;
      },
    },
    {
      id: "dog_right_ear",
      name: "Dog Right Ear",
      anchor: "forehead",
      offset: [0.48, -0.32],
      size: [0.65, 0.85],
      rotationOffsetRad: 0.1,
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedDogRightEar) cachedDogRightEar = renderDogEarTexture(true);
        return cachedDogRightEar;
      },
    },
    {
      id: "dog_nose",
      name: "Dog Nose & Muzzle",
      anchor: "nose_tip",
      offset: [0, 0.04],
      size: [0.48, 0.35],
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedDogNose) cachedDogNose = renderDogNoseMuzzleTexture();
        return cachedDogNose;
      },
    },
  ],
  customRenderPass: (ctx, w, h, lm: FaceLandmarksData) => {
    // Responsive Tongue: Appears when mouth opens or attaches near bottom lip
    const mx = lm.mouthCenter.x * w;
    const my = lm.mouthCenter.y * h;
    const headW = lm.headWidth * w;
    const roll = lm.rollAngleRad;

    // If mouth is open (> 0.12), roll out the tongue with playful scale
    const openAmount = lm.mouthOpenness;
    if (openAmount > 0.12) {
      if (!cachedDogTongue) cachedDogTongue = renderDogTongueTexture();

      ctx.save();
      ctx.translate(mx, my + headW * 0.05);
      ctx.rotate(roll);

      const tongueScale = Math.min(1.0, 0.6 + openAmount * 0.55);
      const tongueW = headW * 0.32 * tongueScale;
      const tongueH = headW * 0.48 * tongueScale;

      ctx.drawImage(cachedDogTongue, -tongueW / 2, 0, tongueW, tongueH);
      ctx.restore();
    }
  },
};
