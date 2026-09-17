import { ArFilterAssetPackage } from "../types";
import { createCachedCanvas } from "../textureUtils";

let cachedCrownTexture: HTMLCanvasElement | null = null;

function renderImperialCrownTexture(): HTMLCanvasElement {
  return createCachedCanvas(512, 340, (ctx, w, h) => {
    const cx = w / 2;
    const baseWidth = 380;
    const baseY = 270;

    // 1. Velvet Cap Interior (Imperial Deep Purple-Crimson Cushion)
    const velvetGrad = ctx.createRadialGradient(cx, baseY - 60, 20, cx, baseY - 60, 180);
    velvetGrad.addColorStop(0, "#831843");
    velvetGrad.addColorStop(0.6, "#500724");
    velvetGrad.addColorStop(1, "#260312");

    ctx.fillStyle = velvetGrad;
    ctx.beginPath();
    ctx.moveTo(cx - baseWidth * 0.44, baseY - 15);
    ctx.bezierCurveTo(cx - baseWidth * 0.45, baseY - 180, cx + baseWidth * 0.45, baseY - 180, cx + baseWidth * 0.44, baseY - 15);
    ctx.closePath();
    ctx.fill();

    // 2. Crown Base Circlet Band
    const bandGrad = ctx.createLinearGradient(cx - baseWidth / 2, baseY, cx + baseWidth / 2, baseY);
    bandGrad.addColorStop(0, "#ca8a04");
    bandGrad.addColorStop(0.2, "#fde047");
    bandGrad.addColorStop(0.5, "#ffffff");
    bandGrad.addColorStop(0.8, "#facc15");
    bandGrad.addColorStop(1, "#a16207");

    ctx.fillStyle = bandGrad;
    ctx.beginPath();
    ctx.roundRect(cx - baseWidth * 0.48, baseY - 30, baseWidth * 0.96, 36, 10);
    ctx.fill();

    ctx.strokeStyle = "#854d0e";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Band Pearls & Gems
    const gemColors = ["#ef4444", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6", "#ef4444"];
    const gemCount = gemColors.length;
    for (let i = 0; i < gemCount; i++) {
      const gx = cx - baseWidth * 0.4 + (i / (gemCount - 1)) * (baseWidth * 0.8);
      const gy = baseY - 12;

      // Gem Shadow & Bezel
      ctx.fillStyle = "#713f12";
      ctx.beginPath();
      ctx.arc(gx, gy, 11, 0, Math.PI * 2);
      ctx.fill();

      // Faceted Gem
      const gGrad = ctx.createRadialGradient(gx - 3, gy - 3, 1, gx, gy, 9);
      gGrad.addColorStop(0, "#ffffff");
      gGrad.addColorStop(0.4, gemColors[i]);
      gGrad.addColorStop(1, "#000000");

      ctx.fillStyle = gGrad;
      ctx.beginPath();
      ctx.arc(gx, gy, 8.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Ornate Gold Filigree Arches and Spikes
    const drawSpike = (x: number, height: number, width: number, isCenter: boolean) => {
      const spikeGrad = ctx.createLinearGradient(x - width / 2, baseY - 30, x + width / 2, baseY - height);
      spikeGrad.addColorStop(0, "#d97706");
      spikeGrad.addColorStop(0.4, "#fde047");
      spikeGrad.addColorStop(0.7, "#ffffff");
      spikeGrad.addColorStop(1, "#b45309");

      ctx.fillStyle = spikeGrad;
      ctx.beginPath();
      ctx.moveTo(x - width / 2, baseY - 28);
      // Sweeping gothic arch to spear point
      ctx.bezierCurveTo(x - width * 0.4, baseY - height * 0.5, x - width * 0.2, baseY - height * 0.85, x, baseY - height);
      ctx.bezierCurveTo(x + width * 0.2, baseY - height * 0.85, x + width * 0.4, baseY - height * 0.5, x + width / 2, baseY - 28);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "#854d0e";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Top Orb / Cross on Peak
      const orbY = baseY - height;
      const orbGrad = ctx.createRadialGradient(x - 3, orbY - 3, 2, x, orbY, 14);
      orbGrad.addColorStop(0, "#ffffff");
      orbGrad.addColorStop(0.5, isCenter ? "#ef4444" : "#3b82f6");
      orbGrad.addColorStop(1, "#7f1d1d");

      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(x, orbY, isCenter ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();

      // Specular twinkle star
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 7, orbY);
      ctx.lineTo(x + 7, orbY);
      ctx.moveTo(x, orbY - 7);
      ctx.lineTo(x, orbY + 7);
      ctx.stroke();
    };

    // Outer secondary spikes
    drawSpike(cx - baseWidth * 0.36, 120, 50, false);
    drawSpike(cx + baseWidth * 0.36, 120, 50, false);

    // Mid spikes
    drawSpike(cx - baseWidth * 0.2, 175, 60, false);
    drawSpike(cx + baseWidth * 0.2, 175, 60, false);

    // Grand Imperial Center Spire
    drawSpike(cx, 225, 75, true);

    // Front Pearl Arch Strand
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.moveTo(cx - baseWidth * 0.4, baseY - 35);
    ctx.quadraticCurveTo(cx, baseY - 70, cx + baseWidth * 0.4, baseY - 35);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

export const crownFilterAsset: ArFilterAssetPackage = {
  id: "crown",
  name: "Imperial Royal Crown",
  description: "Handcrafted golden filigree monarch crown studded with faceted rubies, sapphires, and specular sparkles",
  category: "Fashion",
  layers: [
    {
      id: "crown_body",
      name: "Royal Crown",
      anchor: "head_top",
      offset: [0, -0.48],
      size: [1.1, 0.72],
      followRoll: true,
      followPitch: true,
      followYaw: true,
      getTexture: () => {
        if (!cachedCrownTexture) cachedCrownTexture = renderImperialCrownTexture();
        return cachedCrownTexture;
      },
    },
  ],
};
