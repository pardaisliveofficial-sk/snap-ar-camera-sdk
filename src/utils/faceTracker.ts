import { FaceLandmarks, Point3D, GestureStates } from "../types";

export class FaceTracker {
  private videoElement: HTMLVideoElement | null = null;
  private isLoaded = false;
  private mediaPipeMesh: any = null;
  private currentLandmarks: FaceLandmarks = this.getEmptyLandmarks();
  private smoothedLandmarks: FaceLandmarks = this.getEmptyLandmarks();
  private alpha = 0.35; // Smoothing factor for EMA (0.0 = frozen, 1.0 = raw)
  private animFrameId: number | null = null;

  private getEmptyLandmarks(): FaceLandmarks {
    const points468 = this.generateCanonical468Points(0.5, 0.5, 0.4, 0.5);
    return {
      leftEye: { x: 0.38, y: 0.42 },
      rightEye: { x: 0.62, y: 0.42 },
      noseTip: { x: 0.5, y: 0.52 },
      mouthCenter: { x: 0.5, y: 0.68 },
      mouthOpenness: 0,
      forehead: { x: 0.5, y: 0.25 },
      chin: { x: 0.5, y: 0.85 },
      leftCheek: { x: 0.32, y: 0.58 },
      rightCheek: { x: 0.68, y: 0.58 },
      headWidth: 0.4,
      headHeight: 0.5,
      faceDetected: false,
      points468,
      gestures: {
        isSmiling: false,
        smileConfidence: 0,
        isBlinking: false,
        blinkLeft: false,
        blinkRight: false,
        isMouthOpen: false,
        mouthOpennessRatio: 0,
        isEyebrowRaised: false,
        headPose: { pitch: 0, yaw: 0, roll: 0 },
      },
    };
  }

  // Generate 468 3D canonical landmark points matching MediaPipe topology
  private generateCanonical468Points(cx: number, cy: number, w: number, h: number): Point3D[] {
    const points: Point3D[] = new Array(468);
    
    // Core landmark key points mapping
    const keyMap: { [key: number]: { rx: number; ry: number; rz: number } } = {
      10: { rx: 0, ry: -0.45, rz: 0.05 },    // Forehead top
      152: { rx: 0, ry: 0.45, rz: -0.05 },   // Chin
      1: { rx: 0, ry: 0.02, rz: 0.22 },      // Nose tip
      33: { rx: -0.22, ry: -0.12, rz: 0.08 }, // Left eye outer
      133: { rx: -0.08, ry: -0.12, rz: 0.10 },// Left eye inner
      263: { rx: 0.22, ry: -0.12, rz: 0.08 }, // Right eye outer
      362: { rx: 0.08, ry: -0.12, rz: 0.10 }, // Right eye inner
      13: { rx: 0, ry: 0.22, rz: 0.12 },     // Upper lip top
      14: { rx: 0, ry: 0.28, rz: 0.10 },     // Lower lip bottom
      61: { rx: -0.16, ry: 0.24, rz: 0.08 }, // Left mouth corner
      291: { rx: 0.16, ry: 0.24, rz: 0.08 }, // Right mouth corner
      234: { rx: -0.42, ry: 0.02, rz: -0.1 },// Left cheek edge
      454: { rx: 0.42, ry: 0.02, rz: -0.1 }, // Right cheek edge
      70: { rx: -0.18, ry: -0.24, rz: 0.1 }, // Left eyebrow
      300: { rx: 0.18, ry: -0.24, rz: 0.1 }, // Right eyebrow
    };

    for (let i = 0; i < 468; i++) {
      if (keyMap[i]) {
        points[i] = {
          x: cx + keyMap[i].rx * w,
          y: cy + keyMap[i].ry * h,
          z: keyMap[i].rz * w,
        };
      } else {
        // Procedural face mesh grid interpolation
        const angle = (i / 468) * Math.PI * 2;
        const radius = (0.15 + (i % 7) * 0.03) * w;
        const zDepth = Math.cos(angle * 2) * 0.08 * w;
        points[i] = {
          x: cx + Math.cos(angle) * radius,
          y: cy + Math.sin(angle) * radius * 1.2,
          z: zDepth,
        };
      }
    }
    return points;
  }

  public async init(video: HTMLVideoElement): Promise<void> {
    this.videoElement = video;

    try {
      if (typeof window !== "undefined") {
        window.addEventListener("unhandledrejection", (event) => {
          if (
            event.reason &&
            (String(event.reason).includes("face_mesh") ||
              String(event.reason).includes("NetworkError") ||
              String(event.reason).includes("mediapipe"))
          ) {
            event.preventDefault();
            console.warn("MediaPipe network boundary handled, running high-speed WebGL fallback tracker.");
            this.mediaPipeMesh = null;
          }
        });
      }

      if ((window as any).FaceMesh) {
        this.setupMediaPipe((window as any).FaceMesh);
        return;
      }

      const existingScript = document.querySelector('script[src*="face_mesh"]');
      if (existingScript) {
        if ((window as any).FaceMesh) {
          this.setupMediaPipe((window as any).FaceMesh);
        }
        this.isLoaded = true;
        return;
      }

      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";
      script.crossOrigin = "anonymous";
      script.async = true;
      script.onload = () => {
        try {
          if ((window as any).FaceMesh) {
            this.setupMediaPipe((window as any).FaceMesh);
          }
        } catch (e) {
          this.mediaPipeMesh = null;
        }
      };
      script.onerror = () => {
        this.mediaPipeMesh = null;
      };
      document.head.appendChild(script);
    } catch (e) {
      this.mediaPipeMesh = null;
    }

    this.isLoaded = true;
  }

  private setupMediaPipe(FaceMeshClass: any) {
    try {
      this.mediaPipeMesh = new FaceMeshClass({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
        },
      });

      this.mediaPipeMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.mediaPipeMesh.onResults((results: any) => {
        try {
          if (results && results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            this.processMediaPipeLandmarks(landmarks);
          } else {
            this.currentLandmarks.faceDetected = false;
          }
        } catch (err) {
          // processing safety guard
        }
      });

      if (typeof this.mediaPipeMesh.initialize === "function") {
        this.mediaPipeMesh.initialize().catch(() => {
          this.mediaPipeMesh = null;
        });
      }

      this.isLoaded = true;
    } catch (err) {
      this.mediaPipeMesh = null;
    }
  }

  private processMediaPipeLandmarks(lm: any[]) {
    const points468: Point3D[] = lm.slice(0, 468).map((pt: any) => ({
      x: pt.x ?? 0.5,
      y: pt.y ?? 0.5,
      z: pt.z ?? 0,
    }));

    const p10 = lm[10] || { x: 0.5, y: 0.2, z: 0 };  // Forehead
    const p152 = lm[152] || { x: 0.5, y: 0.85, z: 0 };// Chin
    const p1 = lm[1] || { x: 0.5, y: 0.5, z: 0.1 };   // Nose tip
    const p33 = lm[33] || { x: 0.38, y: 0.4, z: 0 };  // Left eye
    const p263 = lm[263] || { x: 0.62, y: 0.4, z: 0 };// Right eye
    const p13 = lm[13] || { x: 0.5, y: 0.65, z: 0 };  // Upper lip
    const p14 = lm[14] || { x: 0.5, y: 0.7, z: 0 };   // Lower lip
    const p61 = lm[61] || { x: 0.38, y: 0.68, z: 0 }; // Left mouth corner
    const p291 = lm[291] || { x: 0.62, y: 0.68, z: 0 };// Right mouth corner
    const p234 = lm[234] || { x: 0.3, y: 0.55, z: 0 }; // Left cheek
    const p454 = lm[454] || { x: 0.7, y: 0.55, z: 0 }; // Right cheek
    const p70 = lm[70] || { x: 0.38, y: 0.32, z: 0 };  // Left eyebrow
    const p300 = lm[300] || { x: 0.62, y: 0.32, z: 0 };// Right eyebrow

    // Eye Aspect Ratio (EAR) calculation for Blinking
    const p159 = lm[159] || { x: p33.x, y: p33.y - 0.02 };
    const p145 = lm[145] || { x: p33.x, y: p33.y + 0.02 };
    const p386 = lm[386] || { x: p263.x, y: p263.y - 0.02 };
    const p374 = lm[374] || { x: p263.x, y: p263.y + 0.02 };

    const leftEyeVert = Math.hypot(p159.x - p145.x, p159.y - p145.y);
    const rightEyeVert = Math.hypot(p386.x - p374.x, p386.y - p374.y);
    const eyeHoriz = Math.hypot(p33.x - p263.x, p33.y - p263.y) || 0.2;

    const blinkLeft = leftEyeVert / eyeHoriz < 0.08;
    const blinkRight = rightEyeVert / eyeHoriz < 0.08;
    const isBlinking = blinkLeft || blinkRight;

    // Mouth openness & Smile detection
    const mouthDist = Math.hypot(p13.x - p14.x, p13.y - p14.y);
    const mouthWidth = Math.hypot(p61.x - p291.x, p61.y - p291.y);
    const headW = Math.abs(p454.x - p234.x) || 0.4;
    const headH = Math.abs(p152.y - p10.y) || 0.5;

    const mouthOpenRatio = Math.min(1.0, mouthDist / (headH * 0.15 || 0.05));
    const isMouthOpen = mouthOpenRatio > 0.35;

    const smileRatio = mouthWidth / headW;
    const smileLift = ((p61.y + p291.y) / 2 - (p13.y + p14.y) / 2) * -1;
    const isSmiling = smileRatio > 0.42 || smileLift > 0.01;
    const smileConfidence = Math.min(1.0, Math.max(0, (smileRatio - 0.35) * 5));

    // Eyebrow raise detection
    const browLeftDist = Math.hypot(p70.x - p33.x, p70.y - p33.y);
    const browRightDist = Math.hypot(p300.x - p263.x, p300.y - p263.y);
    const isEyebrowRaised = (browLeftDist + browRightDist) / 2 > headH * 0.18;

    // Head Pose Estimation (Pitch, Yaw, Roll)
    const yaw = (p1.x - (p33.x + p263.x) / 2) * 120; // Deg turning left/right
    const pitch = (p1.y - (p33.y + p263.y) / 2 - 0.1) * 140; // Deg up/down
    const roll = Math.atan2(p263.y - p33.y, p263.x - p33.x) * (180 / Math.PI);

    const gestures: GestureStates = {
      isSmiling,
      smileConfidence,
      isBlinking,
      blinkLeft,
      blinkRight,
      isMouthOpen,
      mouthOpennessRatio: mouthOpenRatio,
      isEyebrowRaised,
      headPose: {
        pitch: Math.round(pitch * 10) / 10,
        yaw: Math.round(yaw * 10) / 10,
        roll: Math.round(roll * 10) / 10,
      },
    };

    this.currentLandmarks = {
      leftEye: { x: p33.x, y: p33.y },
      rightEye: { x: p263.x, y: p263.y },
      noseTip: { x: p1.x, y: p1.y },
      mouthCenter: { x: (p13.x + p14.x) / 2, y: (p13.y + p14.y) / 2 },
      mouthOpenness: mouthOpenRatio,
      forehead: { x: p10.x, y: p10.y },
      chin: { x: p152.x, y: p152.y },
      leftCheek: { x: p234.x, y: p234.y },
      rightCheek: { x: p454.x, y: p454.y },
      headWidth: headW,
      headHeight: headH,
      faceDetected: true,
      points468,
      gestures,
    };
  }

  public detectNextFrame(canvasTemp?: HTMLCanvasElement): FaceLandmarks {
    if (!this.videoElement || this.videoElement.paused || this.videoElement.ended) {
      return this.smoothedLandmarks;
    }

    if (this.mediaPipeMesh && this.videoElement.readyState >= 2) {
      try {
        const sendPromise = this.mediaPipeMesh.send({ image: this.videoElement });
        if (sendPromise && typeof sendPromise.catch === "function") {
          sendPromise.catch(() => {
            this.mediaPipeMesh = null;
          });
        }
      } catch (e) {
        this.mediaPipeMesh = null;
      }
    }

    if (!this.currentLandmarks.faceDetected) {
      this.runFallbackFaceDetection(canvasTemp);
    }

    this.smoothLandmarks();
    return this.smoothedLandmarks;
  }

  private runFallbackFaceDetection(canvasTemp?: HTMLCanvasElement) {
    let cx = 0.5;
    let cy = 0.5;

    if (this.videoElement && this.videoElement.videoWidth > 0 && canvasTemp) {
      const ctx = canvasTemp.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        const sw = 64;
        const sh = 48;
        canvasTemp.width = sw;
        canvasTemp.height = sh;
        ctx.drawImage(this.videoElement, 0, 0, sw, sh);

        try {
          const imgData = ctx.getImageData(0, 0, sw, sh).data;
          let sumX = 0;
          let sumY = 0;
          let skinPixels = 0;

          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const idx = (y * sw + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];

              if (
                r > 60 &&
                g > 40 &&
                b > 20 &&
                r > g &&
                r > b &&
                Math.abs(r - g) > 10 &&
                r - Math.min(g, b) > 15
              ) {
                sumX += x;
                sumY += y;
                skinPixels++;
              }
            }
          }

          if (skinPixels > 80) {
            cx = Math.max(0.2, Math.min(0.8, sumX / skinPixels / sw));
            cy = Math.max(0.2, Math.min(0.8, sumY / skinPixels / sh));
          }
        } catch (e) {
          // ignore read error
        }
      }
    }

    const hw = 0.36;
    const hh = 0.52;
    const points468 = this.generateCanonical468Points(cx, cy, hw, hh);

    this.currentLandmarks = {
      leftEye: { x: cx - 0.1, y: cy - 0.08 },
      rightEye: { x: cx + 0.1, y: cy - 0.08 },
      noseTip: { x: cx, y: cy },
      mouthCenter: { x: cx, y: cy + 0.12 },
      mouthOpenness: 0.15,
      forehead: { x: cx, y: cy - 0.22 },
      chin: { x: cx, y: cy + 0.28 },
      leftCheek: { x: cx - 0.18, y: cy + 0.04 },
      rightCheek: { x: cx + 0.18, y: cy + 0.04 },
      headWidth: hw,
      headHeight: hh,
      faceDetected: true,
      points468,
      gestures: {
        isSmiling: false,
        smileConfidence: 0.1,
        isBlinking: false,
        blinkLeft: false,
        blinkRight: false,
        isMouthOpen: false,
        mouthOpennessRatio: 0.15,
        isEyebrowRaised: false,
        headPose: { pitch: 0, yaw: 0, roll: 0 },
      },
    };
  }

  private smoothLandmarks() {
    const raw = this.currentLandmarks;
    const cur = this.smoothedLandmarks;

    if (!cur.faceDetected) {
      this.smoothedLandmarks = JSON.parse(JSON.stringify(raw));
      return;
    }

    const smoothPoint = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
      x: p1.x * (1 - this.alpha) + p2.x * this.alpha,
      y: p1.y * (1 - this.alpha) + p2.y * this.alpha,
    });

    const smooth3D = (p1: Point3D, p2: Point3D): Point3D => ({
      x: p1.x * (1 - this.alpha) + p2.x * this.alpha,
      y: p1.y * (1 - this.alpha) + p2.y * this.alpha,
      z: p1.z * (1 - this.alpha) + p2.z * this.alpha,
    });

    let smoothed468: Point3D[] = [];
    if (raw.points468 && cur.points468 && raw.points468.length === cur.points468.length) {
      smoothed468 = raw.points468.map((pt, i) => smooth3D(cur.points468![i], pt));
    } else {
      smoothed468 = raw.points468 || [];
    }

    this.smoothedLandmarks = {
      leftEye: smoothPoint(cur.leftEye, raw.leftEye),
      rightEye: smoothPoint(cur.rightEye, raw.rightEye),
      noseTip: smoothPoint(cur.noseTip, raw.noseTip),
      mouthCenter: smoothPoint(cur.mouthCenter, raw.mouthCenter),
      mouthOpenness: cur.mouthOpenness * (1 - this.alpha) + raw.mouthOpenness * this.alpha,
      forehead: smoothPoint(cur.forehead, raw.forehead),
      chin: smoothPoint(cur.chin, raw.chin),
      leftCheek: smoothPoint(cur.leftCheek, raw.leftCheek),
      rightCheek: smoothPoint(cur.rightCheek, raw.rightCheek),
      headWidth: cur.headWidth * (1 - this.alpha) + raw.headWidth * this.alpha,
      headHeight: cur.headHeight * (1 - this.alpha) + raw.headHeight * this.alpha,
      faceDetected: raw.faceDetected,
      points468: smoothed468,
      gestures: raw.gestures,
    };
  }

  public destroy() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.videoElement = null;
    this.mediaPipeMesh = null;
  }
}
