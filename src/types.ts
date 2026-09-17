export type ARMaskId =
  | "none"
  | "cute_puppy"
  | "golden_hour"
  | "kawaii_cat"
  | "neon_cyber"
  | "flower_crown"
  | "angel_wings"
  | "heart_aura"
  | "soft_glam"
  | "vhs_retro"
  | "sparkle_halo"
  | "matrix_glitch";

export type FilterCategory = "all" | "ar_masks" | "beauty" | "cinematic" | "retro" | "cyber";

export interface ARMaskDefinition {
  id: ARMaskId;
  name: string;
  category: FilterCategory;
  icon: string;
  description: string;
  tag: string;
  presetColors?: {
    primary: string;
    secondary: string;
  };
}

export interface BeautyParameters {
  // Beauty Enhancements
  skinSmoothing: number; // 0 to 100
  skinToneGlow: number; // 0 to 100
  eyeEnlargement: number; // 0 to 100
  eyeBrightening: number; // 0 to 100
  faceSlimming: number; // 0 to 100
  noseSlimming: number; // 0 to 100
  lipTint: number; // 0 to 100
  lipColor: string; // hex color e.g., #ff4d6d
  teethWhitening: number; // 0 to 100

  // Lighting & Ring Light
  virtualRingLight: boolean;
  ringLightIntensity: number; // 0 to 100
  ringLightColor: string; // 'white' | 'warm' | 'pink' | 'cyan'
  ringLightSize: number; // 0 to 100

  // Camera Color & Quality Adjustments
  sharpening: number; // 0 to 100
  noiseReduction: number; // 0 to 100
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  saturation: number; // 0 to 200
  vibrance: number; // 0 to 100
  warmth: number; // -50 to 50
  tint: number; // -50 to 50
  sepia: number; // 0 to 100
  vignette: number; // 0 to 100
  blurBg: boolean; // Virtual background blur
  blurBgAmount: number; // 0 to 100
  virtualBgImage?: string;
}

export interface CapturedMedia {
  id: string;
  type: "photo" | "video";
  url: string;
  thumbnail?: string;
  createdAt: string;
  filterUsed: string;
  duration?: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface GestureStates {
  isSmiling: boolean;
  smileConfidence: number; // 0.0 to 1.0
  isBlinking: boolean;
  blinkLeft: boolean;
  blinkRight: boolean;
  isMouthOpen: boolean;
  mouthOpennessRatio: number; // 0.0 to 1.0
  isEyebrowRaised: boolean;
  headPose: {
    pitch: number; // up/down in degrees
    yaw: number;   // left/right in degrees
    roll: number;  // tilt in degrees
  };
}

export interface FaceLandmarks {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  noseTip: { x: number; y: number };
  mouthCenter: { x: number; y: number };
  mouthOpenness: number;
  forehead: { x: number; y: number };
  chin: { x: number; y: number };
  leftCheek: { x: number; y: number };
  rightCheek: { x: number; y: number };
  headWidth: number;
  headHeight: number;
  faceDetected: boolean;
  points468?: Point3D[];
  gestures?: GestureStates;
}

export type FaceAnchorPoint =
  | "forehead"
  | "leftEye"
  | "rightEye"
  | "bothEyes"
  | "noseTip"
  | "noseBridge"
  | "mouthCenter"
  | "lips"
  | "chin"
  | "cheeks"
  | "fullHead"
  | "screenBackground";

export type TriggerEvent = "always" | "smile" | "blink" | "mouthOpen" | "headTilt";

export interface ARFilter {
  id: string;
  name: string;
  category: string;
  icon?: string;
  previewUrl?: string;
  intensity?: number;
  enabled?: boolean;
}

export interface LensElement {
  id: string;
  name: string;
  type: "2d_overlay" | "svg_vector" | "particle_emitter" | "3d_model" | "text_label" | "chroma_key";
  anchor: FaceAnchorPoint;
  assetUrl: string;
  offsetX: number; // -100 to 100
  offsetY: number; // -100 to 100
  scale: number; // 0.1 to 3.0
  rotation: number; // -180 to 180 deg
  opacity: number; // 0 to 100
  trigger: TriggerEvent;
  color?: string;
  animated?: boolean;
  curve?: "linear" | "ease_in" | "ease_out" | "ease_in_out" | "bounce" | "elastic";
}

export interface LensProject {
  id: string;
  name: string;
  category: string;
  description: string;
  elements: LensElement[];
  author: string;
  status: "Draft" | "Published";
  updatedAt: string;
}

export interface AssetFile {
  id: string;
  name: string;
  type: "png" | "jpg" | "svg" | "gif" | "webm" | "mp4" | "glb" | "gltf" | "audio" | "font";
  size: string;
  category: "2D Overlay" | "Vector HUD" | "Animated Particles" | "3D Model" | "Audio Effect" | "Custom Font";
  url: string;
  thumbnail?: string;
}

export interface CameraEngineSettings {
  cameraFacing: "user" | "environment";
  resolution: "720p" | "1080p" | "4k";
  targetFps: 30 | 60;
  zoomLevel: number; // 1.0 to 5.0
  exposure: number; // -2 to +2
  autoFocus: boolean;
  flashLight: boolean;
  audioEnabled: boolean;
  mirrorPreview: boolean;
}

export interface AiTrackingOptions {
  enableMediaPipe468: boolean;
  trackIris: boolean;
  trackMouthAndSmile: boolean;
  trackBlinkAndEyes: boolean;
  trackHeadPose: boolean;
  trackHandGestures: boolean;
  trackBodyPose: boolean;
}

export interface TelemetryStats {
  fps: number;
  processingTimeMs: number;
  gpuMemoryMb: number;
  faceConfidence: number;
  frameWidth: number;
  frameHeight: number;
  activeFilter: string;
}

export interface CameraSdkConfig {
  apiKey: string;
  cameraFacing?: "user" | "environment";
  resolution?: "720p" | "1080p" | "4k";
  targetFps?: 30 | 60;
  beautyLevel?: number;
  activeFilterId?: string;
}

export type DashboardSection =
  | "mobile_test"
  | "test_lab"
  | "test_report"
  | "camera_preview"
  | "filter_library"
  | "beauty_studio"
  | "lens_studio"
  | "ai_filter_builder"
  | "marketplace"
  | "face_tracking"
  | "camera_settings"
  | "asset_manager"
  | "sdk_playground"
  | "api_keys"
  | "sdk_downloads"
  | "documentation"
  | "sample_integration"
  | "performance_monitor";


