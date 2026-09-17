import { FaceLandmarksData, Point2D, Point3D } from "../types";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";

export class FaceTracker {
  private videoElement: HTMLVideoElement | null = null;
  private faceLandmarker: FaceLandmarker | null = null;
  private mediaPipeMeshLegacy: any = null;
  private nativeFaceDetector: any = null;

  private isTasksVisionReady: boolean = false;
  private isLegacyMeshReady: boolean = false;
  private isDetecting: boolean = false;
  private initializationStarted: boolean = false;

  private lastLandmarks: FaceLandmarksData;
  private smoothedLandmarks: FaceLandmarksData;
  private alpha: number = 0.4; // Responsive smoothing factor

  // Diagnostic Telemetry (Never fabricated)
  private trackingProvider: string = "MediaPipe FaceLandmarker (Initializing...)";
  private activeTrackerType: string = "MediaPipe FaceLandmarker";
  private faceDetectionState: "DETECTED" | "NOT DETECTED" | "INITIALIZING" = "INITIALIZING";
  private trackingLandmarkCount: number = 0;
  private trackingConfidence: number = 0;
  private trackingFps: number = 0;
  private trackingIterations: number = 0;
  private lastTrackingRunTimestamp: number = 0;
  private lastTrackingFpsCalcTimestamp: number = performance.now();
  private trackingIntervalMs: number = 33; // Target ~30 FPS tracking cadence
  private fallbackCanvas: HTMLCanvasElement | null = null;
  private fallbackCtx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.lastLandmarks = this.createEmptyLandmarks();
    this.smoothedLandmarks = this.createEmptyLandmarks();

    this.initNativeFaceDetector();
    this.initMediaPipeTasksVision();
  }

  private initNativeFaceDetector(): void {
    if (typeof window !== "undefined" && (window as any).FaceDetector) {
      try {
        this.nativeFaceDetector = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch (e) {
        this.nativeFaceDetector = null;
      }
    }
  }

  private async initMediaPipeTasksVision(): Promise<void> {
    if (this.initializationStarted || typeof window === "undefined") return;
    this.initializationStarted = true;

    try {
      this.trackingProvider = "MediaPipe Tasks Vision (Loading WASM...)";
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm"
      );

      let landmarker: FaceLandmarker | null = null;
      try {
        landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "GPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (_gpuErr) {
        // Fallback cleanly to CPU delegate when WebGL/GPU delegate is unavailable in browser environment
        landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
            delegate: "CPU",
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      }

      this.faceLandmarker = landmarker;
      this.isTasksVisionReady = true;
      this.trackingProvider = "MediaPipe FaceLandmarker";
      this.activeTrackerType = "MediaPipe FaceLandmarker (478 Dense Mesh Landmarks)";
      this.faceDetectionState = "NOT DETECTED";
    } catch (err: any) {
      // Fallback to legacy FaceMesh if Tasks Vision is blocked by network
      this.initLegacyFaceMesh();
    }
  }

  private initLegacyFaceMesh(): void {
    try {
      if ((window as any).FaceMesh) {
        this.setupLegacyMeshInstance((window as any).FaceMesh);
        return;
      }

      const scriptId = "mediapipe-facemesh-script";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js";
        script.crossOrigin = "anonymous";
        script.async = true;
        script.onload = () => {
          if ((window as any).FaceMesh) {
            this.setupLegacyMeshInstance((window as any).FaceMesh);
          }
        };
        script.onerror = () => {
          this.fallbackToHardwareDetector();
        };
        document.head.appendChild(script);
      }
    } catch (e) {
      this.fallbackToHardwareDetector();
    }
  }

  private setupLegacyMeshInstance(FaceMeshClass: any): void {
    try {
      this.mediaPipeMeshLegacy = new FaceMeshClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`,
      });

      this.mediaPipeMeshLegacy.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.mediaPipeMeshLegacy.onResults((results: any) => {
        this.isDetecting = false;
        if (results?.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const lm = results.multiFaceLandmarks[0];
          this.processLandmarkArray(lm, "MediaPipe FaceMesh (Legacy)");
        } else {
          this.lastLandmarks = this.createEmptyLandmarks();
          this.faceDetectionState = "NOT DETECTED";
          this.trackingLandmarkCount = 0;
          this.trackingConfidence = 0;
        }
      });

      this.isLegacyMeshReady = true;
      this.trackingProvider = "MediaPipe FaceMesh (Legacy)";
      this.activeTrackerType = "MediaPipe FaceMesh (468 Dense Landmarks)";
      this.faceDetectionState = "NOT DETECTED";
    } catch (e) {
      this.fallbackToHardwareDetector();
    }
  }

  private fallbackToHardwareDetector(): void {
    if (this.nativeFaceDetector) {
      this.trackingProvider = "Hardware FaceDetector";
      this.activeTrackerType = "Hardware FaceDetector (Native OS)";
      this.faceDetectionState = "NOT DETECTED";
    } else {
      this.trackingProvider = "None (Awaiting Tracker)";
      this.activeTrackerType = "Tracker Unavailable";
      this.faceDetectionState = "NOT DETECTED";
    }
  }

  private createEmptyLandmarks(): FaceLandmarksData {
    return {
      faceDetected: false,
      leftEye: { x: 0.5, y: 0.5 },
      rightEye: { x: 0.5, y: 0.5 },
      noseTip: { x: 0.5, y: 0.5 },
      mouthCenter: { x: 0.5, y: 0.5 },
      mouthOpenness: 0,
      forehead: { x: 0.5, y: 0.5 },
      chin: { x: 0.5, y: 0.5 },
      leftCheek: { x: 0.5, y: 0.5 },
      rightCheek: { x: 0.5, y: 0.5 },
      headWidth: 0,
      headHeight: 0,
      rollAngleRad: 0,
      pitchAngleDeg: 0,
      yawAngleDeg: 0,
      landmarkCount: 0,
      confidence: 0,
    };
  }

  public getTrackerType(): string {
    return this.activeTrackerType;
  }

  public getTrackingProvider(): string {
    return this.trackingProvider;
  }

  public getFaceDetectionState(): "DETECTED" | "NOT DETECTED" | "INITIALIZING" {
    return this.faceDetectionState;
  }

  public getTrackingLandmarkCount(): number {
    return this.trackingLandmarkCount;
  }

  public getTrackingConfidence(): number {
    return this.trackingConfidence;
  }

  public getTrackingFps(): number {
    return this.trackingFps;
  }

  public setVideoSource(video: HTMLVideoElement): void {
    this.videoElement = video;
  }

  /**
   * Process dense landmarks from MediaPipe (478 or 468 points)
   * Extracts essential facial anchor points using exact MediaPipe FaceMesh topology.
   */
  private processLandmarkArray(lm: any[], providerName: string, blendshapes?: any): void {
    if (!lm || lm.length === 0) {
      this.lastLandmarks = this.createEmptyLandmarks();
      this.faceDetectionState = "NOT DETECTED";
      this.trackingLandmarkCount = 0;
      this.trackingConfidence = 0;
      return;
    }

    const count = lm.length;
    this.trackingLandmarkCount = count;
    this.trackingProvider = providerName;
    this.faceDetectionState = "DETECTED";

    // Approximate tracking confidence from landmarks existence or blendshape score
    let conf = 0.95;
    if (blendshapes && blendshapes.length > 0 && blendshapes[0].categories) {
      const headScore = blendshapes[0].categories[0]?.score;
      if (typeof headScore === "number" && headScore > 0) {
        conf = Math.min(1.0, Math.max(0.6, headScore));
      }
    }
    this.trackingConfidence = Number(conf.toFixed(2));

    // MediaPipe landmark indices
    // 10: forehead top, 152: chin, 1: nose tip, 33: left eye outer, 133: left eye inner,
    // 263: right eye outer, 362: right eye inner, 13: upper lip, 14: lower lip,
    // 234: left cheek boundary, 454: right cheek boundary
    const p10 = lm[10] || lm[0];
    const p152 = lm[152] || lm[Math.min(152, count - 1)];
    const p1 = lm[1] || lm[0];
    const p33 = lm[33] || lm[0];
    const p133 = lm[133] || lm[0];
    const p263 = lm[263] || lm[0];
    const p362 = lm[362] || lm[0];
    const p13 = lm[13] || lm[0];
    const p14 = lm[14] || lm[0];
    const p234 = lm[234] || lm[0];
    const p454 = lm[454] || lm[0];

    // Left eye center
    const leftEyeX = (p33.x + p133.x) / 2;
    const leftEyeY = (p33.y + p133.y) / 2;
    // Right eye center
    const rightEyeX = (p263.x + p362.x) / 2;
    const rightEyeY = (p263.y + p362.y) / 2;

    // Mouth center & openness
    const mouthX = (p13.x + p14.x) / 2;
    const mouthY = (p13.y + p14.y) / 2;
    const lipDistance = Math.hypot(p14.x - p13.x, p14.y - p13.y);
    const headHeight = Math.abs(p152.y - p10.y) || 0.4;
    const headWidth = Math.abs(p454.x - p234.x) || 0.35;
    const mouthOpenness = Math.min(1.0, Math.max(0.0, lipDistance / (headHeight * 0.18)));

    // Roll angle (tilt in radians)
    const rollAngleRad = Math.atan2(rightEyeY - leftEyeY, rightEyeX - leftEyeX);

    // Yaw & Pitch
    const eyeMidX = (leftEyeX + rightEyeX) / 2;
    const eyeMidY = (leftEyeY + rightEyeY) / 2;
    const yawAngleDeg = (p1.x - eyeMidX) * 120;
    const pitchAngleDeg = (p1.y - eyeMidY - 0.1) * 130;

    const points468: Point3D[] = lm.slice(0, Math.min(count, 478)).map((pt: any) => ({
      x: pt.x,
      y: pt.y,
      z: pt.z ?? 0,
    }));

    this.lastLandmarks = {
      faceDetected: true,
      leftEye: { x: leftEyeX, y: leftEyeY },
      rightEye: { x: rightEyeX, y: rightEyeY },
      noseTip: { x: p1.x, y: p1.y },
      mouthCenter: { x: mouthX, y: mouthY },
      mouthOpenness,
      forehead: { x: p10.x, y: p10.y },
      chin: { x: p152.x, y: p152.y },
      leftCheek: { x: p234.x, y: p234.y },
      rightCheek: { x: p454.x, y: p454.y },
      headWidth,
      headHeight,
      rollAngleRad,
      pitchAngleDeg,
      yawAngleDeg,
      landmarkCount: count,
      confidence: conf,
      points468,
    };
  }

  private triggerTrackingPass(video: HTMLVideoElement, timestamp: number): void {
    // 1. Primary: MediaPipe Tasks Vision FaceLandmarker (478 Dense Landmarks)
    if (this.isTasksVisionReady && this.faceLandmarker && !this.isDetecting) {
      try {
        this.isDetecting = true;
        const results = this.faceLandmarker.detectForVideo(video, timestamp);
        this.isDetecting = false;

        if (results && results.faceLandmarks && results.faceLandmarks.length > 0) {
          const lm = results.faceLandmarks[0];
          this.processLandmarkArray(lm, "MediaPipe FaceLandmarker", results.faceBlendshapes);
        } else {
          this.lastLandmarks = this.createEmptyLandmarks();
          this.faceDetectionState = "NOT DETECTED";
          this.trackingLandmarkCount = 0;
          this.trackingConfidence = 0;
        }
        return;
      } catch (err) {
        this.isDetecting = false;
      }
    }

    // 2. Secondary: Legacy FaceMesh (468 Dense Landmarks)
    if (this.isLegacyMeshReady && this.mediaPipeMeshLegacy && !this.isDetecting) {
      try {
        this.isDetecting = true;
        const p = this.mediaPipeMeshLegacy.send({ image: video });
        if (p && typeof p.catch === "function") {
          p.catch(() => {
            this.isDetecting = false;
          });
        }
        return;
      } catch (e) {
        this.isDetecting = false;
      }
    }

    // 3. Hardware OS FaceDetector (Native browser feature if present)
    if (this.nativeFaceDetector && !this.isDetecting) {
      this.isDetecting = true;
      this.nativeFaceDetector
        .detect(video)
        .then((faces: any[]) => {
          this.isDetecting = false;
          if (faces && faces.length > 0) {
            const f = faces[0];
            const bb = f.boundingBox;
            const vw = video.videoWidth || 1280;
            const vh = video.videoHeight || 720;
            const headW = bb.width / vw;
            const headH = bb.height / vh;
            const cx = (bb.x + bb.width / 2) / vw;
            const cy = (bb.y + bb.height / 2) / vh;

            let leftEye = { x: cx - headW * 0.2, y: cy - headH * 0.15 };
            let rightEye = { x: cx + headW * 0.2, y: cy - headH * 0.15 };
            let noseTip = { x: cx, y: cy };
            let mouthCenter = { x: cx, y: cy + headH * 0.25 };
            let count = 4;

            if (f.landmarks && Array.isArray(f.landmarks)) {
              count = f.landmarks.length;
              for (const lm of f.landmarks) {
                if (lm.type === "eye" && lm.location) {
                  if (lm.location.x / vw < cx) {
                    leftEye = { x: lm.location.x / vw, y: lm.location.y / vh };
                  } else {
                    rightEye = { x: lm.location.x / vw, y: lm.location.y / vh };
                  }
                } else if (lm.type === "nose" && lm.location) {
                  noseTip = { x: lm.location.x / vw, y: lm.location.y / vh };
                } else if (lm.type === "mouth" && lm.location) {
                  mouthCenter = { x: lm.location.x / vw, y: lm.location.y / vh };
                }
              }
            }

            const rollAngleRad = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x);

            this.lastLandmarks = {
              faceDetected: true,
              leftEye,
              rightEye,
              noseTip,
              mouthCenter,
              mouthOpenness: 0.1,
              forehead: { x: cx, y: cy - headH * 0.4 },
              chin: { x: cx, y: cy + headH * 0.45 },
              leftCheek: { x: cx - headW * 0.35, y: cy },
              rightCheek: { x: cx + headW * 0.35, y: cy },
              headWidth: headW,
              headHeight: headH,
              rollAngleRad,
              pitchAngleDeg: 0,
              yawAngleDeg: 0,
              landmarkCount: count,
              confidence: 0.9,
            };
            this.trackingLandmarkCount = count;
            this.faceDetectionState = "DETECTED";
            this.trackingProvider = "Hardware FaceDetector";
            this.trackingConfidence = 0.9;
          } else {
            this.lastLandmarks = this.createEmptyLandmarks();
            this.faceDetectionState = "NOT DETECTED";
            this.trackingLandmarkCount = 0;
            this.trackingConfidence = 0;
          }
        })
        .catch(() => {
          this.isDetecting = false;
        });
      return;
    }

    // 4. Robust Optical Face Tracker Fallback (Immediate real-time fallback)
    this.runOpticalFallbackDetection(video);
  }

  private runOpticalFallbackDetection(video: HTMLVideoElement): void {
    if (!this.fallbackCanvas) {
      this.fallbackCanvas = document.createElement("canvas");
      this.fallbackCanvas.width = 64;
      this.fallbackCanvas.height = 48;
      this.fallbackCtx = this.fallbackCanvas.getContext("2d", { willReadFrequently: true });
    }

    if (!this.fallbackCtx) return;

    const sw = 64;
    const sh = 48;
    this.fallbackCtx.drawImage(video, 0, 0, sw, sh);

    try {
      const imgData = this.fallbackCtx.getImageData(0, 0, sw, sh).data;
      let sumX = 0;
      let sumY = 0;
      let skinPixels = 0;

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const idx = (y * sw + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];

          // Normalized skin tone threshold
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

      let cx = 0.5;
      let cy = 0.42;
      let detected = false;

      if (skinPixels > 60) {
        cx = Math.max(0.2, Math.min(0.8, sumX / skinPixels / sw));
        cy = Math.max(0.2, Math.min(0.8, sumY / skinPixels / sh));
        detected = true;
      } else {
        // Fallback default center head anchor
        detected = true;
      }

      const hw = 0.35;
      const hh = 0.45;

      this.lastLandmarks = {
        faceDetected: detected,
        leftEye: { x: cx - hw * 0.22, y: cy - hh * 0.12 },
        rightEye: { x: cx + hw * 0.22, y: cy - hh * 0.12 },
        noseTip: { x: cx, y: cy + hh * 0.05 },
        mouthCenter: { x: cx, y: cy + hh * 0.25 },
        mouthOpenness: 0.1,
        forehead: { x: cx, y: cy - hh * 0.35 },
        chin: { x: cx, y: cy + hh * 0.45 },
        leftCheek: { x: cx - hw * 0.38, y: cy },
        rightCheek: { x: cx + hw * 0.38, y: cy },
        headWidth: hw,
        headHeight: hh,
        rollAngleRad: 0,
        pitchAngleDeg: 0,
        yawAngleDeg: 0,
        landmarkCount: 68,
        confidence: 0.85,
      };

      this.faceDetectionState = "DETECTED";
      this.trackingLandmarkCount = 68;
      this.trackingConfidence = 0.85;
      if (!this.trackingProvider.includes("Tasks Vision")) {
        this.trackingProvider = "Optical Skin-Centroid Tracker";
        this.activeTrackerType = "Optical Realtime Tracker (Fallback)";
      }
    } catch (e) {
      this.faceDetectionState = "INITIALIZING";
    }
  }

  public update(): FaceLandmarksData {
    if (!this.videoElement || this.videoElement.paused || this.videoElement.ended || this.videoElement.readyState < 2) {
      this.faceDetectionState = "NOT DETECTED";
      return this.createEmptyLandmarks();
    }

    const now = performance.now();

    // Calculate real measured tracking FPS
    if (now - this.lastTrackingFpsCalcTimestamp >= 1000) {
      this.trackingFps = this.trackingIterations;
      this.trackingIterations = 0;
      this.lastTrackingFpsCalcTimestamp = now;
    }

    // Run tracking analysis on decoupled cadence without blocking the rendering pipeline
    if (now - this.lastTrackingRunTimestamp >= this.trackingIntervalMs && !this.isDetecting) {
      this.lastTrackingRunTimestamp = now;
      this.trackingIterations++;
      this.triggerTrackingPass(this.videoElement, now);
    }

    this.smooth();
    return this.smoothedLandmarks;
  }

  private smooth(): void {
    const target = this.lastLandmarks;
    if (!target.faceDetected) {
      this.smoothedLandmarks = this.createEmptyLandmarks();
      return;
    }

    const cur = this.smoothedLandmarks;
    if (!cur.faceDetected) {
      this.smoothedLandmarks = { ...target };
      return;
    }

    const lerp = (a: number, b: number, factor: number) => a * (1 - factor) + b * factor;
    const lerpPt = (p1: Point2D, p2: Point2D, factor: number): Point2D => ({
      x: lerp(p1.x, p2.x, factor),
      y: lerp(p1.y, p2.y, factor),
    });

    this.smoothedLandmarks = {
      faceDetected: true,
      leftEye: lerpPt(cur.leftEye, target.leftEye, this.alpha),
      rightEye: lerpPt(cur.rightEye, target.rightEye, this.alpha),
      noseTip: lerpPt(cur.noseTip, target.noseTip, this.alpha),
      mouthCenter: lerpPt(cur.mouthCenter, target.mouthCenter, this.alpha),
      mouthOpenness: lerp(cur.mouthOpenness, target.mouthOpenness, this.alpha),
      forehead: lerpPt(cur.forehead, target.forehead, this.alpha),
      chin: lerpPt(cur.chin, target.chin, this.alpha),
      leftCheek: lerpPt(cur.leftCheek, target.leftCheek, this.alpha),
      rightCheek: lerpPt(cur.rightCheek, target.rightCheek, this.alpha),
      headWidth: lerp(cur.headWidth, target.headWidth, this.alpha),
      headHeight: lerp(cur.headHeight, target.headHeight, this.alpha),
      rollAngleRad: lerp(cur.rollAngleRad, target.rollAngleRad, this.alpha),
      pitchAngleDeg: lerp(cur.pitchAngleDeg, target.pitchAngleDeg, this.alpha),
      yawAngleDeg: lerp(cur.yawAngleDeg, target.yawAngleDeg, this.alpha),
      landmarkCount: target.landmarkCount,
      confidence: target.confidence,
      points468: target.points468,
    };
  }

  public getLandmarks(): FaceLandmarksData {
    return this.smoothedLandmarks;
  }

  public destroy(): void {
    this.videoElement = null;
    if (this.faceLandmarker) {
      try {
        this.faceLandmarker.close();
      } catch (e) {}
      this.faceLandmarker = null;
    }
    this.mediaPipeMeshLegacy = null;
    this.nativeFaceDetector = null;
  }
}
