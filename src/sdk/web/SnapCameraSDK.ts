import { CameraManager } from "../../core/camera/CameraManager";
import { FaceTracker } from "../../core/tracking/FaceTracker";
import { GpuPipeline } from "../../core/renderer/GpuPipeline";
import { ArFilterEngine } from "../../core/ar/ArFilterEngine";
import {
  ArDiagnosticsData,
  ArFilterId,
  BeautyConfig,
  DEFAULT_BEAUTY_CONFIG,
  EffectId,
  FaceLandmarksData,
  OrientationTelemetry,
  RealtimePerformanceStats,
  RenderComparisonMode,
} from "../../core/types";

export interface SDKInitConfig {
  apiKey?: string;
  facingMode?: "user" | "environment";
  resolution?: "720p" | "1080p" | "4k";
  defaultEffect?: EffectId;
  defaultArFilter?: ArFilterId;
  beautyEnabled?: boolean;
  effectsEnabled?: boolean;
  arEnabled?: boolean;
  mirroringMode?: "auto" | "on" | "off";
}

export class SnapCameraSDK {
  private cameraManager: CameraManager;
  private faceTracker: FaceTracker;
  private gpuPipeline: GpuPipeline;
  private arFilterEngine: ArFilterEngine;

  // Output Canvas & Context
  private outputCanvas: HTMLCanvasElement;
  private outputCtx: CanvasRenderingContext2D | null = null;

  // Dedicated AR Offscreen Canvas & Framebuffer diagnostics
  private arCanvas: HTMLCanvasElement;
  private arCtx: CanvasRenderingContext2D | null = null;
  private lastArRenderedPixels: number = 0;
  private isArDebugOverlayEnabled: boolean = false;

  // State
  private isInitialized: boolean = false;
  private isLoopRunning: boolean = false;
  private animFrameId: number | null = null;
  private mirroringMode: "auto" | "on" | "off" = "auto";

  // Active settings
  private beautyConfig: BeautyConfig = { ...DEFAULT_BEAUTY_CONFIG };
  private isBeautyEnabled: boolean = true;
  private activeEffect: EffectId = "none";
  private effectIntensity: number = 1.0;
  private isEffectsEnabled: boolean = true;
  private activeArFilter: ArFilterId = "none";
  private isArEnabled: boolean = true;
  private comparisonMode: RenderComparisonMode = "combined";

  // Real-time telemetry tracking
  private lastFrameTimestamp: number = performance.now();
  private frameCount: number = 0;
  private currentRenderFps: number = 0;
  private currentProcessingFps: number = 0;
  private lastProcessingDurationMs: number = 0;

  constructor(targetCanvas?: HTMLCanvasElement) {
    this.outputCanvas = targetCanvas || document.createElement("canvas");
    this.outputCanvas.width = 1280;
    this.outputCanvas.height = 720;
    this.outputCtx = this.outputCanvas.getContext("2d");

    this.arCanvas = document.createElement("canvas");
    this.arCanvas.width = 1280;
    this.arCanvas.height = 720;
    this.arCtx = this.arCanvas.getContext("2d", { willReadFrequently: true });

    this.cameraManager = new CameraManager();
    this.faceTracker = new FaceTracker();
    this.gpuPipeline = new GpuPipeline();
    this.arFilterEngine = new ArFilterEngine();
  }

  public async initialize(config?: SDKInitConfig): Promise<void> {
    if (config?.defaultEffect) this.activeEffect = config.defaultEffect;
    if (config?.defaultArFilter) this.activeArFilter = config.defaultArFilter;
    if (config?.beautyEnabled !== undefined) this.isBeautyEnabled = config.beautyEnabled;
    if (config?.effectsEnabled !== undefined) this.isEffectsEnabled = config.effectsEnabled;
    if (config?.arEnabled !== undefined) this.isArEnabled = config.arEnabled;

    this.isInitialized = true;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.outputCanvas;
  }

  public async startCamera(
    facing: "user" | "environment" = "user",
    resolution: "720p" | "1080p" | "4k" = "1080p"
  ): Promise<MediaStream> {
    const stream = await this.cameraManager.startCamera(facing, resolution);
    const video = this.cameraManager.getVideoElement();
    this.faceTracker.setVideoSource(video);

    this.startRenderingLoop();
    return stream;
  }

  public stopCamera(): void {
    this.stopRenderingLoop();
    this.cameraManager.stopCamera();
  }

  public async switchCamera(): Promise<"user" | "environment"> {
    const newFacing = await this.cameraManager.switchCamera();
    const video = this.cameraManager.getVideoElement();
    this.faceTracker.setVideoSource(video);
    return newFacing;
  }

  public enableBeauty(): void {
    this.isBeautyEnabled = true;
  }

  public disableBeauty(): void {
    this.isBeautyEnabled = false;
  }

  public isBeautyActive(): boolean {
    return this.isBeautyEnabled;
  }

  public setBeautyParameter<K extends keyof BeautyConfig>(key: K, value: BeautyConfig[K]): void {
    this.beautyConfig[key] = value;
  }

  public getBeautyConfig(): BeautyConfig {
    return { ...this.beautyConfig };
  }

  public setBeautyConfig(config: Partial<BeautyConfig>): void {
    this.beautyConfig = { ...this.beautyConfig, ...config };
  }

  public resetBeauty(): void {
    this.beautyConfig = { ...DEFAULT_BEAUTY_CONFIG };
  }

  public setEffect(effectId: EffectId, intensity: number = 1.0): void {
    this.activeEffect = effectId;
    this.effectIntensity = Math.max(0, Math.min(1.0, intensity));
    this.isEffectsEnabled = true;
  }

  public setEffectIntensity(intensity: number): void {
    this.effectIntensity = Math.max(0, Math.min(1.0, intensity));
  }

  public getEffectIntensity(): number {
    return this.effectIntensity;
  }

  public getGpuPipeline(): GpuPipeline {
    return this.gpuPipeline;
  }

  public getCameraManager(): CameraManager {
    return this.cameraManager;
  }

  public getFaceTracker(): FaceTracker {
    return this.faceTracker;
  }

  public getArFilterEngine(): ArFilterEngine {
    return this.arFilterEngine;
  }

  public clearEffect(): void {
    this.activeEffect = "none";
  }

  public enableEffects(): void {
    this.isEffectsEnabled = true;
  }

  public disableEffects(): void {
    this.isEffectsEnabled = false;
  }

  public isEffectsActive(): boolean {
    return this.isEffectsEnabled && this.activeEffect !== "none";
  }

  public getActiveEffect(): EffectId {
    return this.activeEffect;
  }

  public setARFilter(filterId: ArFilterId): void {
    this.activeArFilter = filterId;
    this.isArEnabled = true;
  }

  public clearARFilter(): void {
    this.activeArFilter = "none";
  }

  public enableAR(): void {
    this.isArEnabled = true;
  }

  public disableAR(): void {
    this.isArEnabled = false;
  }

  public isArActive(): boolean {
    return this.isArEnabled && this.activeArFilter !== "none";
  }

  public getActiveArFilter(): ArFilterId {
    return this.activeArFilter;
  }

  public getArDiagnostics(): ArDiagnosticsData {
    return this.arFilterEngine.getDiagnostics(
      this.activeArFilter,
      this.faceTracker.getLandmarks(),
      this.lastArRenderedPixels
    );
  }

  public setArDebugOverlay(enabled: boolean): void {
    this.isArDebugOverlayEnabled = enabled;
  }

  public getArDebugOverlay(): boolean {
    return this.isArDebugOverlayEnabled;
  }

  public getArRenderedPixels(): number {
    return this.lastArRenderedPixels;
  }

  public setComparisonMode(mode: RenderComparisonMode): void {
    this.comparisonMode = mode;
  }

  public getComparisonMode(): RenderComparisonMode {
    return this.comparisonMode;
  }

  public resetAll(): void {
    this.resetBeauty();
    this.clearEffect();
    this.clearARFilter();
    this.isBeautyEnabled = true;
    this.isEffectsEnabled = true;
    this.isArEnabled = true;
    this.comparisonMode = "combined";
  }

  public capturePhoto(): string {
    return this.outputCanvas.toDataURL("image/jpeg", 0.95);
  }

  public startRecording(): void {
    this.cameraManager.startRecording(this.outputCanvas);
  }

  public stopRecording(): Promise<{ blobUrl: string; durationMs: number; blob: Blob }> {
    return this.cameraManager.stopRecording();
  }

  public isRecording(): boolean {
    return this.cameraManager.isRecording();
  }

  public getTrackingState(): FaceLandmarksData {
    return this.faceTracker.getLandmarks();
  }

  public setMirroringMode(mode: "auto" | "on" | "off"): void {
    this.mirroringMode = mode;
  }

  public getMirroringMode(): "auto" | "on" | "off" {
    return this.mirroringMode;
  }

  public toggleMirroring(): "ON" | "OFF" {
    if (this.mirroringMode === "auto") {
      this.mirroringMode = this.isMirroringActive() ? "off" : "on";
    } else {
      this.mirroringMode = this.mirroringMode === "on" ? "off" : "on";
    }
    return this.isMirroringActive() ? "ON" : "OFF";
  }

  public isMirroringActive(): boolean {
    if (this.mirroringMode === "on") return true;
    if (this.mirroringMode === "off") return false;
    return this.cameraManager.isFrontFacing();
  }

  public getDisplayRotation(): "0°" | "90°" | "180°" | "270°" {
    if (typeof window !== "undefined") {
      const angle =
        window.screen?.orientation?.angle ??
        (window as any).orientation ??
        0;
      if (angle === 90 || angle === -270) return "90°";
      if (angle === 180 || angle === -180) return "180°";
      if (angle === 270 || angle === -90) return "270°";
    }
    return "0°";
  }

  public getCameraOrientation(): "UPRIGHT" | "ROTATED" {
    const rot = this.getDisplayRotation();
    return rot === "0°" ? "UPRIGHT" : "ROTATED";
  }

  public getOrientationTelemetry(): OrientationTelemetry {
    const isFront = this.cameraManager.isFrontFacing();
    return {
      cameraOrientation: this.getCameraOrientation(),
      cameraMirroring: this.isMirroringActive() ? "ON" : "OFF",
      displayRotation: this.getDisplayRotation(),
      textureYFlip: this.gpuPipeline.isTextureYFlipActive() ? "ON" : "OFF",
      frontCamera: isFront ? "YES" : "NO",
      backCamera: !isFront ? "YES" : "NO",
    };
  }

  public getPerformanceStats(): RealtimePerformanceStats {
    const lm = this.faceTracker.getLandmarks();
    const isFront = this.cameraManager.isFrontFacing();
    const provider = this.faceTracker.getTrackingProvider();
    const detState = this.faceTracker.getFaceDetectionState();
    const count = this.faceTracker.getTrackingLandmarkCount();
    const conf = this.faceTracker.getTrackingConfidence();
    const trackFps = this.faceTracker.getTrackingFps();

    return {
      cameraActive: this.cameraManager.isActive(),
      faceDetected: lm.faceDetected,
      trackingActive: lm.faceDetected && count > 0,
      trackingProvider: provider,
      landmarkCount: count,
      trackingLandmarkCount: count,
      trackingConfidence: conf,
      faceDetectionState: detState,
      processingFps: this.currentProcessingFps,
      renderFps: this.currentRenderFps,
      processingLatencyMs: this.lastProcessingDurationMs > 0 ? Number(this.lastProcessingDurationMs.toFixed(1)) : null,
      cameraResolution: this.cameraManager.getResolutionString(),
      webglAvailable: this.gpuPipeline.isAvailable(),
      activeBeautyCount: this.isBeautyEnabled ? Object.keys(this.beautyConfig).length : 0,
      activeEffect: this.isEffectsEnabled ? this.activeEffect : "disabled",
      activeArFilter: this.isArEnabled ? this.activeArFilter : "disabled",
      trackerType: this.faceTracker.getTrackerType(),
      cameraFps: this.currentRenderFps,
      trackingFps: trackFps,
      effectIntensity: this.effectIntensity,
      // Verified runtime orientation telemetry
      cameraOrientation: this.getCameraOrientation(),
      cameraMirroring: this.isMirroringActive() ? "ON" : "OFF",
      displayRotation: this.getDisplayRotation(),
      textureYFlip: this.gpuPipeline.isTextureYFlipActive() ? "ON" : "OFF",
      frontCamera: isFront ? "YES" : "NO",
      backCamera: !isFront ? "YES" : "NO",
    };
  }

  // Real-time render loop
  private startRenderingLoop(): void {
    if (this.isLoopRunning) return;
    this.isLoopRunning = true;

    let lastFpsUpdate = performance.now();
    let framesThisSecond = 0;

    const renderLoop = () => {
      if (!this.isLoopRunning) return;

      const frameStart = performance.now();
      const video = this.cameraManager.getVideoElement();

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        // Sync canvas dimensions to optimized video bounds (HD 720p maximum to sustain 30-60 FPS)
        let targetW = video.videoWidth;
        let targetH = video.videoHeight;
        if (targetW > 1280) {
          targetH = Math.round(targetH * (1280 / targetW));
          targetW = 1280;
        }

        if (this.outputCanvas.width !== targetW || this.outputCanvas.height !== targetH) {
          this.outputCanvas.width = targetW;
          this.outputCanvas.height = targetH;
        }

        // 1. Update Face Tracking
        const landmarks = this.faceTracker.update();

        // 2. GPU Render Pass (Beauty + Effects Multi-Pass)
        const gpuCanvas = this.gpuPipeline.render(
          video,
          this.beautyConfig,
          this.isBeautyEnabled,
          this.activeEffect,
          this.isEffectsEnabled,
          landmarks,
          this.comparisonMode,
          this.effectIntensity
        );

        // 3. AR Filter Pass (Render to dedicated isolated buffer for framebuffer diagnostics)
        const shouldRenderAR =
          (this.comparisonMode === "ar" ||
            this.comparisonMode === "beauty_ar" ||
            this.comparisonMode === "effects_ar" ||
            this.comparisonMode === "combined") &&
          this.isArEnabled &&
          this.activeArFilter !== "none";

        if (this.arCanvas.width !== targetW || this.arCanvas.height !== targetH) {
          this.arCanvas.width = targetW;
          this.arCanvas.height = targetH;
        }

        if (this.arCtx) {
          this.arCtx.clearRect(0, 0, targetW, targetH);
        }

        if (shouldRenderAR || (this.isArDebugOverlayEnabled && landmarks.faceDetected)) {
          if (this.arCtx) {
            this.arFilterEngine.render(
              this.arCtx,
              targetW,
              targetH,
              this.activeArFilter,
              landmarks,
              this.isArEnabled,
              this.isArDebugOverlayEnabled
            );
            this.lastArRenderedPixels = this.calculateArRenderedPixels(
              this.arCtx,
              targetW,
              targetH,
              landmarks
            );
          }
        } else {
          this.lastArRenderedPixels = 0;
        }

        // 4. Composite into Output Canvas with upright orientation guarantee
        if (this.outputCtx) {
          this.outputCtx.save();

          // Apply horizontal selfie mirroring ONLY when mirroring is active (separate from orientation)
          if (this.isMirroringActive()) {
            this.outputCtx.translate(this.outputCanvas.width, 0);
            this.outputCtx.scale(-1, 1);
          }

          if (gpuCanvas) {
            this.outputCtx.drawImage(gpuCanvas, 0, 0);
          } else {
            // Fallback pass-through
            this.outputCtx.drawImage(video, 0, 0);
          }

          // Composite AR layer on top of processed camera frame
          if (this.lastArRenderedPixels > 0 || (this.isArDebugOverlayEnabled && landmarks.faceDetected)) {
            this.outputCtx.drawImage(this.arCanvas, 0, 0);
          }

          this.outputCtx.restore();
        }
      }

      const frameEnd = performance.now();
      this.lastProcessingDurationMs = frameEnd - frameStart;

      // Calculate FPS
      framesThisSecond++;
      if (frameEnd - lastFpsUpdate >= 1000) {
        this.currentRenderFps = framesThisSecond;
        this.currentProcessingFps = Math.min(framesThisSecond, Math.round(1000 / (this.lastProcessingDurationMs || 16)));
        framesThisSecond = 0;
        lastFpsUpdate = frameEnd;
      }

      this.animFrameId = requestAnimationFrame(renderLoop);
    };

    this.animFrameId = requestAnimationFrame(renderLoop);
  }

  private calculateArRenderedPixels(
    ctx: CanvasRenderingContext2D | null,
    w: number,
    h: number,
    lm: FaceLandmarksData
  ): number {
    if (!ctx || !lm.faceDetected) return 0;
    try {
      const headW = lm.headWidth * w;
      const headH = lm.headHeight * h;
      // Sample bounding area around face and above forehead (ears)
      const minX = Math.max(0, Math.floor(lm.forehead.x * w - headW * 0.7));
      const minY = Math.max(0, Math.floor(lm.forehead.y * h - headH * 0.65));
      const sampleW = Math.min(w - minX, Math.floor(headW * 1.4));
      const sampleH = Math.min(h - minY, Math.floor(headH * 1.8));

      if (sampleW <= 0 || sampleH <= 0) return 0;

      const imgData = ctx.getImageData(minX, minY, sampleW, sampleH).data;
      let nonTransparent = 0;
      // Step by 4 pixels (16 bytes) for fast 60 FPS sampling
      for (let i = 3; i < imgData.length; i += 16) {
        if (imgData[i] > 15) {
          nonTransparent++;
        }
      }
      return nonTransparent * 4;
    } catch (e) {
      return 0;
    }
  }

  private stopRenderingLoop(): void {
    this.isLoopRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public destroy(): void {
    this.stopRenderingLoop();
    this.cameraManager.destroy();
    this.faceTracker.destroy();
    this.gpuPipeline.destroy();
    this.isInitialized = false;
  }
}
