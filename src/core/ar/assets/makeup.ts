import { ArFilterAssetPackage } from "../types";
import { FaceLandmarksData } from "../../types";

export const makeupFilterAsset: ArFilterAssetPackage = {
  id: "makeup",
  name: "Red-Carpet Glamour Makeup",
  description: "Precision winged liquid eyeliner, airbrushed peach blush, satin rose lip tint, and champagne cheekbone highlighter",
  category: "Beauty",
  layers: [],
  customRenderPass: (ctx, w, h, lm: FaceLandmarksData) => {
    const headW = lm.headWidth * w;
    const headH = lm.headHeight * h;
    const roll = lm.rollAngleRad;

    const lx = lm.leftEye.x * w;
    const ly = lm.leftEye.y * h;
    const rx = lm.rightEye.x * w;
    const ry = lm.rightEye.y * h;
    const eyeSpan = Math.hypot(rx - lx, ry - ly);

    // 1. Airbrushed Radiant Peach-Rose Blush on Cheek Apples
    ctx.save();
    ctx.globalCompositeOperation = "soft-light";

    const drawCheekBlush = (cx: number, cy: number, radius: number) => {
      const blushGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      blushGrad.addColorStop(0, "rgba(244, 63, 94, 0.65)");
      blushGrad.addColorStop(0.5, "rgba(251, 113, 133, 0.35)");
      blushGrad.addColorStop(0.85, "rgba(253, 164, 175, 0.12)");
      blushGrad.addColorStop(1, "rgba(253, 164, 175, 0.0)");

      ctx.fillStyle = blushGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius * 1.1, radius * 0.75, roll, 0, Math.PI * 2);
      ctx.fill();
    };

    const cheekL_x = lm.leftCheek.x * w * 0.65 + lx * 0.35;
    const cheekL_y = lm.leftCheek.y * h * 0.7 + ly * 0.3 + headH * 0.05;
    const cheekR_x = lm.rightCheek.x * w * 0.65 + rx * 0.35;
    const cheekR_y = lm.rightCheek.y * h * 0.7 + ry * 0.3 + headH * 0.05;
    const blushR = headW * 0.22;

    drawCheekBlush(cheekL_x, cheekL_y, blushR);
    drawCheekBlush(cheekR_x, cheekR_y, blushR);
    ctx.restore();

    // 2. Champagne Pearl Highlighter on Cheekbone Crests and Nose Bridge
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    const drawHighlighter = (hx: number, hy: number, radius: number) => {
      const glowGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, radius);
      glowGrad.addColorStop(0, "rgba(255, 247, 237, 0.55)");
      glowGrad.addColorStop(0.5, "rgba(254, 215, 170, 0.25)");
      glowGrad.addColorStop(1, "rgba(254, 215, 170, 0.0)");

      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    // Cheekbone high crests (slightly above and outer to blush)
    drawHighlighter(cheekL_x - headW * 0.04, cheekL_y - headH * 0.08, headW * 0.12);
    drawHighlighter(cheekR_x + headW * 0.04, cheekR_y - headH * 0.08, headW * 0.12);
    // Nose bridge button highlight
    drawHighlighter(lm.noseTip.x * w, lm.noseTip.y * h - headH * 0.05, headW * 0.06);
    ctx.restore();

    // 3. Precision Winged Eyeliner & Lashes
    ctx.save();
    ctx.strokeStyle = "#09090b"; // Carbon black liquid liner
    ctx.fillStyle = "#09090b";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const drawEyeMakeup = (eyeCenterX: number, eyeCenterY: number, isRight: boolean) => {
      const dir = isRight ? 1 : -1;
      const eyeR = eyeSpan * 0.24;

      ctx.save();
      ctx.translate(eyeCenterX, eyeCenterY);
      ctx.rotate(roll);

      // Upper Lash Line Sweep
      ctx.beginPath();
      ctx.lineWidth = 3.2;
      ctx.moveTo(-eyeR * dir, 2);
      // Curve over upper eyelid
      ctx.quadraticCurveTo(0, -eyeR * 0.7, eyeR * dir, 0);
      ctx.stroke();

      // Winged Eyeliner Flick extending up & out
      ctx.beginPath();
      ctx.moveTo(eyeR * dir * 0.85, -eyeR * 0.25);
      const wingTipX = eyeR * dir * 1.55;
      const wingTipY = -eyeR * 0.85;
      ctx.quadraticCurveTo(eyeR * dir * 1.2, -eyeR * 0.45, wingTipX, wingTipY);
      ctx.quadraticCurveTo(eyeR * dir * 1.25, -eyeR * 0.15, eyeR * dir, 0);
      ctx.closePath();
      ctx.fill();

      // Wispy Outer Lashes
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 4; i++) {
        const lashBaseX = eyeR * dir * (0.6 + i * 0.18);
        const lashBaseY = -eyeR * (0.3 + i * 0.1);
        const lashTipX = lashBaseX + (dir * 12 + i * dir * 3);
        const lashTipY = lashBaseY - (10 + i * 3);

        ctx.beginPath();
        ctx.moveTo(lashBaseX, lashBaseY);
        ctx.quadraticCurveTo(lashBaseX + dir * 6, lashBaseY - 6, lashTipX, lashTipY);
        ctx.stroke();
      }

      ctx.restore();
    };

    drawEyeMakeup(lx, ly, false);
    drawEyeMakeup(rx, ry, true);
    ctx.restore();

    // 4. Satin Velvet Lip Tint with Dimensional Contouring and Specular Shine
    ctx.save();
    const mx = lm.mouthCenter.x * w;
    const my = lm.mouthCenter.y * h;
    const mouthW = headW * 0.38;
    const mouthH = headH * 0.16;

    ctx.translate(mx, my);
    ctx.rotate(roll);

    // Lip stain base gradient (Lush Mulberry Rose)
    const lipGrad = ctx.createRadialGradient(0, 0, mouthW * 0.1, 0, 0, mouthW * 0.55);
    lipGrad.addColorStop(0, "rgba(225, 29, 72, 0.75)");
    lipGrad.addColorStop(0.6, "rgba(190, 18, 60, 0.65)");
    lipGrad.addColorStop(1, "rgba(159, 18, 57, 0.0)");

    ctx.fillStyle = lipGrad;
    // Upper Lip
    ctx.beginPath();
    ctx.moveTo(-mouthW * 0.5, 0);
    ctx.bezierCurveTo(-mouthW * 0.25, -mouthH * 0.9, -mouthW * 0.1, -mouthH * 0.85, 0, -mouthH * 0.45);
    ctx.bezierCurveTo(mouthW * 0.1, -mouthH * 0.85, mouthW * 0.25, -mouthH * 0.9, mouthW * 0.5, 0);
    ctx.bezierCurveTo(mouthW * 0.25, -mouthH * 0.15, -mouthW * 0.25, -mouthH * 0.15, -mouthW * 0.5, 0);
    ctx.closePath();
    ctx.fill();

    // Lower Lip
    ctx.beginPath();
    ctx.moveTo(-mouthW * 0.48, 0);
    ctx.bezierCurveTo(-mouthW * 0.3, mouthH * 1.1, mouthW * 0.3, mouthH * 1.1, mouthW * 0.48, 0);
    ctx.bezierCurveTo(mouthW * 0.25, mouthH * 0.2, -mouthW * 0.25, mouthH * 0.2, -mouthW * 0.48, 0);
    ctx.closePath();
    ctx.fill();

    // Glossy Specular Highlight on Center of Lower Lip
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    ctx.ellipse(0, mouthH * 0.42, mouthW * 0.14, mouthH * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },
};
