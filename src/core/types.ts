export interface Point2D {
  x: number; // Normalized 0.0 to 1.0
  y: number; // Normalized 0.0 to 1.0
}

export interface Point3D extends Point2D {
  z: number;
}

export interface FaceLandmarksData {
  faceDetected: boolean;
  leftEye: Point2D;
  rightEye: Point2D;
  noseTip: Point2D;
  mouthCenter: Point2D;
  mouthOpenness: number; // 0.0 to 1.0
  forehead: Point2D;
  chin: Point2D;
  leftCheek: Point2D;
  rightCheek: Point2D;
  headWidth: number; // Normalized width
  headHeight: number; // Normalized height
  rollAngleRad: number; // Head rotation in radians
  pitchAngleDeg: number;
  yawAngleDeg: number;
  landmarkCount: number;
  confidence: number; // 0.0 to 1.0
  points468?: Point3D[];
}

export interface BeautyConfig {
  smooth: number; // 0 to 100 (Skin smoothing)
  glow: number; // 0 to 100 (Face glow)
  tone: number; // 0 to 100 (Skin tone enhancement)
  brightness: number; // 50 to 150 (Default 100)
  contrast: number; // 50 to 150 (Default 100)
  saturation: number; // 0 to 200 (Default 100)
  sharpness: number; // 0 to 100 (Skin/feature sharpness)
  faceSlim: number; // 0 to 100 (Cheek & jawline slim)
  eyeScale: number; // 0 to 100 (Eye enlargement)
  noseSlim: number; // 0 to 100 (Nose width reduction)
  jaw: number; // 0 to 100 (Jaw contouring)
  lips: number; // 0 to 100 (Lip enhancement & color)
  teeth: number; // 0 to 100 (Teeth whitening)
}

export const DEFAULT_BEAUTY_CONFIG: BeautyConfig = {
  smooth: 50,
  glow: 35,
  tone: 30,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  sharpness: 20,
  faceSlim: 25,
  eyeScale: 20,
  noseSlim: 20,
  jaw: 20,
  lips: 30,
  teeth: 30,
};

export type EffectId =
  | "none"
  | "pink_glow"
  | "soft_glow"
  | "dream"
  | "vintage"
  | "warm"
  | "cool"
  | "neon"
  | "cinematic"
  | "sparkle"
  | "snow"
  | "black_and_white"
  | "blur"
  | "light_leak";

export interface EffectDefinition {
  id: EffectId;
  name: string;
  category: "Glow" | "Color" | "Retro" | "Artistic";
  description: string;
  intensity: number; // 0 to 100
  compatibleWithBeauty: boolean;
  compatibleWithAR: boolean;
}

export type ArFilterId =
  | "none"
  | "cat"
  | "dog"
  | "elephant"
  | "glasses"
  | "crown"
  | "mask"
  | "makeup";

export interface ArFilterDefinition {
  id: ArFilterId;
  name: string;
  description: string;
  category: "Animals" | "Fashion" | "Face Art";
  anchors: string[];
}

export type RenderComparisonMode =
  | "original"
  | "beauty"
  | "effects"
  | "ar"
  | "beauty_effects"
  | "beauty_ar"
  | "effects_ar"
  | "combined";

export interface OrientationTelemetry {
  cameraOrientation: "UPRIGHT" | "ROTATED";
  cameraMirroring: "ON" | "OFF";
  displayRotation: "0°" | "90°" | "180°" | "270°";
  textureYFlip: "ON" | "OFF";
  frontCamera: "YES" | "NO";
  backCamera: "YES" | "NO";
}

export interface RealtimePerformanceStats {
  cameraActive: boolean;
  faceDetected: boolean;
  trackingActive: boolean;
  trackerType: string;
  trackingProvider: string;
  landmarkCount: number;
  trackingLandmarkCount: number;
  trackingConfidence: number;
  faceDetectionState: "DETECTED" | "NOT DETECTED" | "INITIALIZING";
  cameraFps: number;
  trackingFps: number;
  renderFps: number;
  processingFps: number;
  processingLatencyMs: number | null;
  cameraResolution: string;
  webglAvailable: boolean;
  activeBeautyCount: number;
  activeEffect: string;
  effectIntensity: number;
  activeArFilter: string;
  // Orientation & Mirroring Telemetry
  cameraOrientation: "UPRIGHT" | "ROTATED";
  cameraMirroring: "ON" | "OFF";
  displayRotation: "0°" | "90°" | "180°" | "270°";
  textureYFlip: "ON" | "OFF";
  frontCamera: "YES" | "NO";
  backCamera: "YES" | "NO";
}

export interface TestItemResult {
  id: string;
  name: string;
  category: "Unit" | "Integration" | "Runtime Camera" | "Visual / Manual";
  status: "PASS" | "FAIL" | "NOT TESTABLE IN THIS ENVIRONMENT";
  details: string;
  durationMs: number;
}

export interface ArDiagnosticsData {
  filterId: ArFilterId;
  assetStatus: "LOADING" | "LOADED" | "ERROR";
  textureStatus: "VALID" | "INVALID";
  dimensions: string;
  alphaPresent: "YES" | "NO";
  rendererDrawn: "DRAWN" | "NOT DRAWN";
  anchorStatus: "VALID" | "INVALID";
  finalComposite: "AR PIXELS DETECTED" | "NOT DETECTED";
  arRenderedPixels: number;
}
