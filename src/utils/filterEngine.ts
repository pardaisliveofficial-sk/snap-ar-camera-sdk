import { ARMaskId, BeautyParameters, FaceLandmarks } from "../types";

export class FilterEngine {
  private particles: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    life: number;
    maxLife: number;
    rot: number;
    vRot: number;
    type: "sparkle" | "petal" | "heart" | "bubble" | "matrix";
    symbol?: string;
  }> = [];

  private lastTime = performance.now();

  public render(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    width: number,
    height: number,
    beauty: BeautyParameters,
    maskId: ARMaskId,
    landmarks: FaceLandmarks,
    showBeforeAfterSplit: boolean = false,
    splitPosition: number = 0.5
  ) {
    if (!video || video.videoWidth === 0) {
      // Draw dark studio background placeholder
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, width, height);
      return;
    }

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context for raw side if before/after split is active
    if (showBeforeAfterSplit) {
      const splitX = width * splitPosition;

      // Draw Raw video on left side
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, height);
      ctx.clip();
      ctx.drawImage(video, 0, 0, width, height);

      // Raw Label
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(10, 10, 80, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("RAW CAM", 18, 27);
      ctx.restore();

      // Draw Enhanced side on right
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, width - splitX, height);
      ctx.clip();

      this.renderFilteredVideoFrame(ctx, video, width, height, beauty, maskId, landmarks, dt);

      // Enhanced Label
      ctx.fillStyle = "rgba(236, 72, 153, 0.8)";
      ctx.fillRect(splitX + 10, 10, 110, 26);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("ENHANCED AR", splitX + 18, 27);
      ctx.restore();

      // Split Divider Line
      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, height);
      ctx.stroke();

      // Split Handle Circle
      ctx.fillStyle = "#ec4899";
      ctx.beginPath();
      ctx.arc(splitX, height / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Render full enhanced frame
      this.renderFilteredVideoFrame(ctx, video, width, height, beauty, maskId, landmarks, dt);
    }
  }

  private renderFilteredVideoFrame(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    width: number,
    height: number,
    beauty: BeautyParameters,
    maskId: ARMaskId,
    landmarks: FaceLandmarks,
    dt: number
  ) {
    ctx.save();

    // 1. Build CSS Filter String for Video Base Layer
    let filters: string[] = [];

    // Brightness (80% to 150%)
    if (beauty.brightness !== 100) {
      filters.push(`brightness(${beauty.brightness}%)`);
    }
    // Contrast (80% to 150%)
    if (beauty.contrast !== 100) {
      filters.push(`contrast(${beauty.contrast}%)`);
    }
    // Saturation / Vibrance
    if (beauty.saturation !== 100) {
      filters.push(`saturate(${beauty.saturation}%)`);
    }
    // Sepia / Vintage Tone
    if (beauty.sepia > 0) {
      filters.push(`sepia(${beauty.sepia}%)`);
    }
    // Hue Rotate / Tint
    if (beauty.tint !== 0) {
      filters.push(`hue-rotate(${beauty.tint * 1.8}deg)`);
    }

    // Apply CSS Filter to Context
    if (filters.length > 0) {
      ctx.filter = filters.join(" ");
    }

    // Draw Base Video
    ctx.drawImage(video, 0, 0, width, height);
    ctx.filter = "none"; // reset filter for overlays

    // 2. Real-Time Skin Smoothing & Beauty Blur Effect
    if (beauty.skinSmoothing > 0 && landmarks.faceDetected) {
      this.applySkinSmoothing(ctx, width, height, landmarks, beauty.skinSmoothing);
    }

    // 3. Virtual Ring Light Fill Glow & Eye Catchlight
    if (beauty.virtualRingLight) {
      this.drawVirtualRingLight(ctx, width, height, beauty, landmarks);
    }

    // 4. Lip Tint & Teeth Brightening
    if (beauty.lipTint > 0 && landmarks.faceDetected) {
      this.drawLipTint(ctx, width, height, landmarks, beauty.lipTint, beauty.lipColor);
    }

    // 5. Eye Brightening & Enlargement Glow
    if (beauty.eyeBrightening > 0 && landmarks.faceDetected) {
      this.drawEyeHighlights(ctx, width, height, landmarks, beauty.eyeBrightening);
    }

    // 6. AR Mask Overlays (Puppy, Cat, Cyber, Golden Hour, Flowers, VHS, etc.)
    if (maskId !== "none") {
      this.renderARMask(ctx, width, height, maskId, landmarks, dt);
    }

    // 7. Vignette / Dark Edge Framing
    if (beauty.vignette > 0) {
      this.drawVignette(ctx, width, height, beauty.vignette);
    }

    ctx.restore();
  }

  private applySkinSmoothing(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: FaceLandmarks,
    smoothingAmount: number
  ) {
    ctx.save();
    const blurPx = (smoothingAmount / 100) * 8;
    const opacity = (smoothingAmount / 100) * 0.45;

    // Create Face Oval Region
    const fx = landmarks.noseTip.x * width;
    const fy = (landmarks.noseTip.y - 0.05) * height;
    const rx = (landmarks.headWidth * width) / 1.8;
    const ry = (landmarks.headHeight * height) / 1.8;

    ctx.beginPath();
    ctx.ellipse(fx, fy, Math.max(10, rx), Math.max(10, ry), 0, 0, Math.PI * 2);
    ctx.clip();

    // Soft Skin Smoothing Overlay
    ctx.filter = `blur(${blurPx}px) contrast(105%) brightness(103%)`;
    ctx.globalAlpha = opacity;
    ctx.drawImage(ctx.canvas, 0, 0, width, height);

    ctx.restore();
  }

  private drawVirtualRingLight(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    beauty: BeautyParameters,
    landmarks: FaceLandmarks
  ) {
    ctx.save();
    const intensity = (beauty.ringLightIntensity / 100) * 0.35;

    let glowColor = "255, 255, 255";
    if (beauty.ringLightColor === "warm") glowColor = "255, 210, 140";
    if (beauty.ringLightColor === "pink") glowColor = "255, 180, 220";
    if (beauty.ringLightColor === "cyan") glowColor = "140, 230, 255";

    // Frame Soft Softlight Outer Ring
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.2,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    grad.addColorStop(0, `rgba(${glowColor}, 0)`);
    grad.addColorStop(0.7, `rgba(${glowColor}, ${intensity * 0.5})`);
    grad.addColorStop(1, `rgba(${glowColor}, ${intensity})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Ring Light Pupil Catchlight Reflections in Eyes
    if (landmarks.faceDetected) {
      const lx = landmarks.leftEye.x * width;
      const ly = landmarks.leftEye.y * height;
      const rx = landmarks.rightEye.x * width;
      const ry = landmarks.rightEye.y * height;
      const eyeR = Math.max(3, (landmarks.headWidth * width) * 0.04);

      ctx.fillStyle = `rgba(${glowColor}, 0.95)`;
      ctx.shadowColor = `rgb(${glowColor})`;
      ctx.shadowBlur = 8;

      // Left eye ring catchlight
      ctx.beginPath();
      ctx.arc(lx - eyeR * 0.3, ly - eyeR * 0.3, eyeR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Right eye ring catchlight
      ctx.beginPath();
      ctx.arc(rx - eyeR * 0.3, ry - eyeR * 0.3, eyeR * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawLipTint(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: FaceLandmarks,
    intensity: number,
    colorHex: string
  ) {
    ctx.save();
    const mx = landmarks.mouthCenter.x * width;
    const my = landmarks.mouthCenter.y * height;
    const lipWidth = (landmarks.headWidth * width) * 0.32;
    const lipHeight = lipWidth * 0.45;

    ctx.globalAlpha = (intensity / 100) * 0.4;
    ctx.fillStyle = colorHex || "#ff4d6d";

    ctx.beginPath();
    ctx.ellipse(mx, my, lipWidth / 2, lipHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lip Gloss Highlight
    ctx.globalAlpha = (intensity / 100) * 0.6;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(mx, my - lipHeight * 0.15, lipWidth * 0.2, lipHeight * 0.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawEyeHighlights(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    landmarks: FaceLandmarks,
    amount: number
  ) {
    ctx.save();
    const alpha = (amount / 100) * 0.3;

    const lx = landmarks.leftEye.x * width;
    const ly = landmarks.leftEye.y * height;
    const rx = landmarks.rightEye.x * width;
    const ry = landmarks.rightEye.y * height;
    const r = (landmarks.headWidth * width) * 0.05;

    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(lx, ly, r, 0, Math.PI * 2);
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      Math.min(width, height) * 0.3,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.75
    );
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(1, `rgba(0, 0, 0, ${(amount / 100) * 0.85})`);

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // -------------------------------------------------------------
  // AR SNAPCHAT FILTERS & MASKS RENDERER
  // -------------------------------------------------------------
  public renderAROverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    maskId: ARMaskId,
    landmarks: FaceLandmarks,
    dt: number = 1 / 30
  ) {
    if (!landmarks.faceDetected || maskId === "none") return;
    this.renderARMask(ctx, width, height, maskId, landmarks, dt);
  }

  private renderARMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    maskId: ARMaskId,
    landmarks: FaceLandmarks,
    dt: number
  ) {
    const headX = landmarks.noseTip.x * width;
    const headY = landmarks.noseTip.y * height;
    const headW = landmarks.headWidth * width;
    const headH = landmarks.headHeight * height;

    const foreheadX = landmarks.forehead.x * width;
    const foreheadY = landmarks.forehead.y * height;

    switch (maskId) {
      case "cute_puppy":
        this.drawPuppyMask(ctx, headX, headY, foreheadX, foreheadY, headW, headH, landmarks);
        break;

      case "golden_hour":
        this.drawGoldenHourMask(ctx, width, height, headX, headY, headW, dt);
        break;

      case "kawaii_cat":
        this.drawKawaiiCatMask(ctx, headX, headY, foreheadX, foreheadY, headW, headH, landmarks);
        break;

      case "neon_cyber":
        this.drawNeonCyberMask(ctx, headX, headY, headW, headH, landmarks);
        break;

      case "flower_crown":
        this.drawFlowerCrownMask(ctx, width, height, foreheadX, foreheadY, headW, dt);
        break;

      case "angel_wings":
        this.drawAngelHaloMask(ctx, width, height, foreheadX, foreheadY, headW, dt);
        break;

      case "heart_aura":
        this.drawHeartAuraMask(ctx, width, height, headX, headY, headW, landmarks, dt);
        break;

      case "soft_glam":
        this.drawSoftGlamMask(ctx, width, height, headX, headY, headW, landmarks);
        break;

      case "vhs_retro":
        this.drawRetroVHSMask(ctx, width, height, dt);
        break;

      case "sparkle_halo":
        this.drawSparkleHaloMask(ctx, foreheadX, foreheadY, headW, dt);
        break;

      case "matrix_glitch":
        this.drawMatrixGlitchMask(ctx, width, height, dt);
        break;

      default:
        break;
    }
  }

  // 1. CUTE PUPPY SNAPCHAT FILTER
  private drawPuppyMask(
    ctx: CanvasRenderingContext2D,
    headX: number,
    headY: number,
    foreheadX: number,
    foreheadY: number,
    headW: number,
    _headH: number,
    landmarks: FaceLandmarks
  ) {
    ctx.save();

    const earW = headW * 0.45;
    const earH = earW * 1.6;

    // Flopping Brown Dog Ears
    // Left Ear
    ctx.fillStyle = "#8d5b32";
    ctx.beginPath();
    ctx.ellipse(foreheadX - earW * 1.1, foreheadY - earH * 0.1, earW * 0.5, earH * 0.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // Inner Pink
    ctx.fillStyle = "#e5989b";
    ctx.beginPath();
    ctx.ellipse(foreheadX - earW * 1.1, foreheadY - earH * 0.1, earW * 0.28, earH * 0.32, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Right Ear
    ctx.fillStyle = "#8d5b32";
    ctx.beginPath();
    ctx.ellipse(foreheadX + earW * 1.1, foreheadY - earH * 0.1, earW * 0.5, earH * 0.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Inner Pink
    ctx.fillStyle = "#e5989b";
    ctx.beginPath();
    ctx.ellipse(foreheadX + earW * 1.1, foreheadY - earH * 0.1, earW * 0.28, earH * 0.32, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Puppy Nose Button
    const noseX = landmarks.noseTip.x * (ctx.canvas.width || 800);
    const noseY = landmarks.noseTip.y * (ctx.canvas.height || 600);
    const noseR = earW * 0.35;

    ctx.fillStyle = "#2d1a0e";
    ctx.beginPath();
    ctx.ellipse(noseX, noseY, noseR, noseR * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose shine
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(noseX - noseR * 0.3, noseY - noseR * 0.2, noseR * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Interactive Tongue Popping Out
    const mouthX = landmarks.mouthCenter.x * (ctx.canvas.width || 800);
    const mouthY = landmarks.mouthCenter.y * (ctx.canvas.height || 600);

    ctx.fillStyle = "#ff758f";
    ctx.beginPath();
    ctx.ellipse(mouthX, mouthY + earW * 0.4, earW * 0.32, earW * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ff4d6d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouthX, mouthY + earW * 0.2);
    ctx.lineTo(mouthX, mouthY + earW * 0.6);
    ctx.stroke();

    ctx.restore();
  }

  // 2. GOLDEN HOUR / SUNSET GLOW SNAPCHAT FILTER
  private drawGoldenHourMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    headX: number,
    headY: number,
    _headW: number,
    dt: number
  ) {
    ctx.save();

    // Sun Lens Flare
    const grad = ctx.createRadialGradient(width * 0.85, height * 0.15, 10, width * 0.85, height * 0.15, width * 0.7);
    grad.addColorStop(0, "rgba(255, 230, 150, 0.4)");
    grad.addColorStop(0.3, "rgba(255, 170, 80, 0.25)");
    grad.addColorStop(1, "rgba(255, 120, 50, 0)");

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Warm Golden Bronze Overlay
    ctx.fillStyle = "rgba(255, 160, 60, 0.12)";
    ctx.fillRect(0, 0, width, height);

    // Floating Golden Sparkles Particle Engine
    this.updateAndDrawParticles(ctx, width, height, headX, headY, dt, "sparkle", "#ffd166");

    ctx.restore();
  }

  // 3. KAWAII CAT SNAPCHAT FILTER
  private drawKawaiiCatMask(
    ctx: CanvasRenderingContext2D,
    _headX: number,
    _headY: number,
    foreheadX: number,
    foreheadY: number,
    headW: number,
    _headH: number,
    landmarks: FaceLandmarks
  ) {
    ctx.save();
    const earW = headW * 0.45;

    // Cat Ear Triangles (Left)
    ctx.fillStyle = "#ffb3c6";
    ctx.beginPath();
    ctx.moveTo(foreheadX - earW * 1.2, foreheadY + earW * 0.2);
    ctx.lineTo(foreheadX - earW * 0.7, foreheadY - earW * 1.3);
    ctx.lineTo(foreheadX - earW * 0.2, foreheadY + earW * 0.2);
    ctx.closePath();
    ctx.fill();

    // Left Inner Pink
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(foreheadX - earW * 1.05, foreheadY + earW * 0.1);
    ctx.lineTo(foreheadX - earW * 0.7, foreheadY - earW * 0.95);
    ctx.lineTo(foreheadX - earW * 0.35, foreheadY + earW * 0.1);
    ctx.closePath();
    ctx.fill();

    // Cat Ear Triangles (Right)
    ctx.fillStyle = "#ffb3c6";
    ctx.beginPath();
    ctx.moveTo(foreheadX + earW * 0.2, foreheadY + earW * 0.2);
    ctx.lineTo(foreheadX + earW * 0.7, foreheadY - earW * 1.3);
    ctx.lineTo(foreheadX + earW * 1.2, foreheadY + earW * 0.2);
    ctx.closePath();
    ctx.fill();

    // Right Inner Pink
    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.moveTo(foreheadX + earW * 0.35, foreheadY + earW * 0.1);
    ctx.lineTo(foreheadX + earW * 0.7, foreheadY - earW * 0.95);
    ctx.lineTo(foreheadX + earW * 1.05, foreheadY + earW * 0.1);
    ctx.closePath();
    ctx.fill();

    // Cat Nose
    const noseX = landmarks.noseTip.x * (ctx.canvas.width || 800);
    const noseY = landmarks.noseTip.y * (ctx.canvas.height || 600);

    ctx.fillStyle = "#ff4d6d";
    ctx.beginPath();
    ctx.ellipse(noseX, noseY, earW * 0.15, earW * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cheek Whiskers
    const cheekLX = landmarks.leftCheek.x * (ctx.canvas.width || 800);
    const cheekLY = landmarks.leftCheek.y * (ctx.canvas.height || 600);
    const cheekRX = landmarks.rightCheek.x * (ctx.canvas.width || 800);
    const cheekRY = landmarks.rightCheek.y * (ctx.canvas.height || 600);

    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2.5;

    // Left Whiskers
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cheekLX, cheekLY + i * 8);
      ctx.lineTo(cheekLX - earW * 0.9, cheekLY + i * 16);
      ctx.stroke();
    }

    // Right Whiskers
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(cheekRX, cheekRY + i * 8);
      ctx.lineTo(cheekRX + earW * 0.9, cheekRY + i * 16);
      ctx.stroke();
    }

    ctx.restore();
  }

  // 4. NEON CYBERPUNK VISOR SNAPCHAT FILTER
  private drawNeonCyberMask(
    ctx: CanvasRenderingContext2D,
    _headX: number,
    _headY: number,
    headW: number,
    _headH: number,
    landmarks: FaceLandmarks
  ) {
    ctx.save();

    const eyeLX = landmarks.leftEye.x * (ctx.canvas.width || 800);
    const eyeLY = landmarks.leftEye.y * (ctx.canvas.height || 600);
    const eyeRX = landmarks.rightEye.x * (ctx.canvas.width || 800);
    const eyeRY = landmarks.rightEye.y * (ctx.canvas.height || 600);

    const eyeCenterX = (eyeLX + eyeRX) / 2;
    const eyeCenterY = (eyeLY + eyeRY) / 2;
    const visorW = headW * 1.1;
    const visorH = visorW * 0.38;

    // Visor Shield Outer Glow
    ctx.shadowColor = "#00f0ff";
    ctx.shadowBlur = 15;
    ctx.fillStyle = "rgba(0, 240, 255, 0.25)";
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.roundRect(
      eyeCenterX - visorW / 2,
      eyeCenterY - visorH / 2,
      visorW,
      visorH,
      [12, 12, 24, 24]
    );
    ctx.fill();
    ctx.stroke();

    // Cyber HUD Lines
    ctx.shadowColor = "#ff007f";
    ctx.strokeStyle = "#ff007f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(eyeCenterX - visorW * 0.4, eyeCenterY);
    ctx.lineTo(eyeCenterX + visorW * 0.4, eyeCenterY);
    ctx.stroke();

    // HUD Text Overlay
    ctx.fillStyle = "#00f0ff";
    ctx.font = "bold 11px monospace";
    ctx.fillText("CYBER::SYS_ONLINE 60FPS", eyeCenterX - visorW * 0.4, eyeCenterY - visorH * 0.2);

    ctx.restore();
  }

  // 5. DAISY FLOWER CROWN SNAPCHAT FILTER
  private drawFlowerCrownMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    foreheadX: number,
    foreheadY: number,
    headW: number,
    dt: number
  ) {
    ctx.save();

    const crownR = headW * 0.65;
    const numFlowers = 7;

    for (let i = 0; i < numFlowers; i++) {
      const angle = (i / (numFlowers - 1)) * Math.PI - Math.PI;
      const fx = foreheadX + Math.cos(angle) * crownR;
      const fy = foreheadY - Math.sin(angle) * crownR * 0.3 - 10;

      // Draw Petals
      ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#ffc6ff";
      for (let p = 0; p < 8; p++) {
        const pAngle = (p / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(
          fx + Math.cos(pAngle) * 10,
          fy + Math.sin(pAngle) * 10,
          7,
          4,
          pAngle,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Flower Center
      ctx.fillStyle = "#ffd166";
      ctx.beginPath();
      ctx.arc(fx, fy, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Falling Flower Petals Particle Engine
    this.updateAndDrawParticles(ctx, width, height, foreheadX, foreheadY, dt, "petal", "#ffc6ff");

    ctx.restore();
  }

  // 6. ANGEL HALO & SPARKLE SNAPCHAT FILTER
  private drawAngelHaloMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    foreheadX: number,
    foreheadY: number,
    headW: number,
    dt: number
  ) {
    ctx.save();

    const haloX = foreheadX;
    const haloY = foreheadY - headW * 0.55;
    const haloW = headW * 0.6;
    const haloH = haloW * 0.22;

    // Glowing Golden Halo Oval
    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#fff3b0";
    ctx.lineWidth = 6;

    ctx.beginPath();
    ctx.ellipse(haloX, haloY, haloW, haloH, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner White Glow
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Falling Angel Dust Sparkles
    this.updateAndDrawParticles(ctx, width, height, haloX, haloY, dt, "sparkle", "#fff3b0");

    ctx.restore();
  }

  // 7. HEART AURA SNAPCHAT FILTER
  private drawHeartAuraMask(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    headX: number,
    headY: number,
    _headW: number,
    _landmarks: FaceLandmarks,
    dt: number
  ) {
    ctx.save();
    this.updateAndDrawParticles(ctx, width, height, headX, headY, dt, "heart", "#ff4d6d");
    ctx.restore();
  }

  // 8. SOFT GLAM K-BEAUTY SNAPCHAT FILTER
  private drawSoftGlamMask(
    ctx: CanvasRenderingContext2D,
    _width: number,
    _height: number,
    _headX: number,
    _headY: number,
    headW: number,
    landmarks: FaceLandmarks
  ) {
    ctx.save();

    const cheekLX = landmarks.leftCheek.x * (ctx.canvas.width || 800);
    const cheekLY = landmarks.leftCheek.y * (ctx.canvas.height || 600);
    const cheekRX = landmarks.rightCheek.x * (ctx.canvas.width || 800);
    const cheekRY = landmarks.rightCheek.y * (ctx.canvas.height || 600);

    const blushR = headW * 0.22;

    // Rosy Blush on Left Cheek
    const gradL = ctx.createRadialGradient(cheekLX, cheekLY, 0, cheekLX, cheekLY, blushR);
    gradL.addColorStop(0, "rgba(255, 117, 143, 0.45)");
    gradL.addColorStop(1, "rgba(255, 117, 143, 0)");
    ctx.fillStyle = gradL;
    ctx.beginPath();
    ctx.arc(cheekLX, cheekLY, blushR, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Blush on Right Cheek
    const gradR = ctx.createRadialGradient(cheekRX, cheekRY, 0, cheekRX, cheekRY, blushR);
    gradR.addColorStop(0, "rgba(255, 117, 143, 0.45)");
    gradR.addColorStop(1, "rgba(255, 117, 143, 0)");
    ctx.fillStyle = gradR;
    ctx.beginPath();
    ctx.arc(cheekRX, cheekRY, blushR, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 9. RETRO 90s VHS SNAPCHAT FILTER
  private drawRetroVHSMask(ctx: CanvasRenderingContext2D, width: number, height: number, _dt: number) {
    ctx.save();

    // Scanlines
    ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    // VHS Timestamp HUD
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px monospace";
    ctx.shadowColor = "#000000";
    ctx.shadowBlur = 4;

    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).toUpperCase();

    ctx.fillText("PLAY ⏺ 00:04:22", 20, height - 40);
    ctx.fillText(dateStr, 20, height - 20);

    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(140, height - 45, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 10. SPARKLE HALO
  private drawSparkleHaloMask(
    ctx: CanvasRenderingContext2D,
    foreheadX: number,
    foreheadY: number,
    headW: number,
    dt: number
  ) {
    ctx.save();
    this.updateAndDrawParticles(
      ctx,
      ctx.canvas.width,
      ctx.canvas.height,
      foreheadX,
      foreheadY - headW * 0.4,
      dt,
      "sparkle",
      "#00f0ff"
    );
    ctx.restore();
  }

  // 11. MATRIX GLITCH FILTER
  private drawMatrixGlitchMask(ctx: CanvasRenderingContext2D, width: number, height: number, dt: number) {
    ctx.save();
    this.updateAndDrawParticles(ctx, width, height, width / 2, 0, dt, "matrix", "#00ff66");
    ctx.restore();
  }

  // PARTICLE SYSTEM FOR LIVE DYNAMIC PARTICLES
  private updateAndDrawParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    originX: number,
    originY: number,
    dt: number,
    type: "sparkle" | "petal" | "heart" | "bubble" | "matrix",
    color: string
  ) {
    // Spawn new particles
    if (this.particles.length < 35 && Math.random() < 0.6) {
      this.particles.push({
        x: originX + (Math.random() - 0.5) * (type === "matrix" ? width : 180),
        y: type === "matrix" ? 0 : originY + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 40,
        vy: type === "heart" ? -Math.random() * 60 - 20 : Math.random() * 50 + 20,
        size: Math.random() * 12 + 6,
        color,
        life: 0,
        maxLife: Math.random() * 2 + 1.5,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 3,
        type,
        symbol: type === "matrix" ? String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96)) : undefined,
      });
    }

    // Update & Draw
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vRot * dt;

      const alpha = 1 - p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.type === "sparkle") {
        // Draw 4-point Diamond Star
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.3, -p.size * 0.3);
        ctx.lineTo(p.size, 0);
        ctx.lineTo(p.size * 0.3, p.size * 0.3);
        ctx.moveTo(0, p.size);
        ctx.lineTo(-p.size * 0.3, p.size * 0.3);
        ctx.lineTo(-p.size, 0);
        ctx.lineTo(-p.size * 0.3, -p.size * 0.3);
        ctx.fill();
      } else if (p.type === "heart") {
        // Heart shape
        ctx.beginPath();
        ctx.arc(-p.size * 0.3, 0, p.size * 0.4, Math.PI, 0, false);
        ctx.arc(p.size * 0.3, 0, p.size * 0.4, Math.PI, 0, false);
        ctx.lineTo(0, p.size * 0.8);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === "matrix" && p.symbol) {
        ctx.font = `${Math.floor(p.size * 1.5)}px monospace`;
        ctx.fillText(p.symbol, 0, 0);
      } else {
        // Petal / Circle
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}
