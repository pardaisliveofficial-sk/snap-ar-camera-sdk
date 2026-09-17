# Commercial AR Camera SDK Prototype

A high-performance, GPU-accelerated Camera SDK architecture designed for real-time mobile and web camera experiences similar to TikTok and Snapchat. The engine orchestrates three independent compositing layers on live camera feeds:

1. **Beauty Engine**: GPU-accelerated edge-preserving bilateral skin smoothing, skin tone enhancement, highlight bloom glow, teeth whitening, lip pigmentation, and geometric mesh-warp deformation (face slimming, eye enlargement, nose slimming, jaw contouring).
2. **Effects Engine**: Real-time full-frame fragment shaders including color grading, dream bloom, vintage sepia, neon chromatic aberration, and cinematic film tonemapping.
3. **AR Filter Engine**: Face-anchored 2D and 2.5D visual overlays mapped to 3D facial feature points (forehead, eyes, nose tip, mouth, cheeks) with head roll, pitch, and scale tracking.

---

## System Architecture

```
Camera Input (getUserMedia / Hardware Camera)
   │
   ├──► Face Tracker (MediaPipe FaceMesh 468-pt / Optical CV Fallback)
   │       └── Yields: Normalized landmarks, roll angle, mouth openness, confidence
   │
   └──► GPU Pipeline (WebGL2 / WebGL)
           ├── Pass 1: Geometric Mesh Warp (Face Slim, Eye Scale, Nose Slim, Jaw)
           ├── Pass 2: Bilateral Skin Smooth & Glow & Tone & Teeth & Lips
           ├── Pass 3: Post-Processing Effects (Shaders: Dream, Neon, Cinematic, etc.)
           └── Pass 4: Face-Anchored AR Overlays (Cat, Dog, Glasses, Crown, Mask, etc.)
                   │
                   ▼
         Unified Live Preview Canvas (60 FPS)
                   │
                   ├──► Snapshot Capture (JPEG dataURI)
                   └──► Video Recording (MediaRecorder WebM / MP4)
```

---

## Core Directory Structure

```
/src
  /core
    /camera          # Hardware camera lifecycle & stream management
    /tracking        # MediaPipe & optical CV face detection
    /beauty          # Beauty parameters and deformation specifications
    /effects         # Fragment shaders and color grading algorithms
    /ar              # Face-anchored AR filter rendering
    /renderer        # WebGL2/WebGL shader compilation and render passes
    /types.ts        # Unified type definitions
  /sdk
    /web             # SnapCameraSDK TypeScript implementation
    /index.ts        # Public API exports
  /components
    /testlab         # "AR Camera Test Lab" and Test Report View
```

---

## Public SDK API Reference

### Initialization
```typescript
import { SnapCameraSDK } from './sdk';

// Mount to an existing canvas or let SDK instantiate its own
const sdk = new SnapCameraSDK(document.getElementById('myCanvas'));

await sdk.initialize({
  defaultEffect: 'pink_glow',
  defaultArFilter: 'cat',
  beautyEnabled: true,
  effectsEnabled: true,
  arEnabled: true,
});
```

### Camera Control
```typescript
// Start camera with preferred facing and resolution
await sdk.startCamera('user', '1080p');

// Switch between front and back camera
const newFacing = await sdk.switchCamera();

// Stop camera stream
sdk.stopCamera();
```

### Beauty Engine
```typescript
sdk.enableBeauty();

// Update parameters independently (0-100 scale)
sdk.setBeautyParameter('smooth', 70);    // Bilateral skin smoothing
sdk.setBeautyParameter('glow', 40);      // Highlight diffusion bloom
sdk.setBeautyParameter('faceSlim', 30);  // Geometric cheek slim warp
sdk.setBeautyParameter('eyeScale', 25);  // Radial eye enlargement
sdk.setBeautyParameter('noseSlim', 20);  // Nose width pinch warp
sdk.setBeautyParameter('lips', 35);      // Lip color enhancement
sdk.setBeautyParameter('teeth', 30);     // Teeth whitening

// Reset all beauty adjustments
sdk.resetBeauty();
```

### Effects Engine
```typescript
sdk.setEffect('cinematic'); // Options: pink_glow, soft_glow, dream, vintage, warm, cool, neon, cinematic, sparkle, black_and_white, blur, light_leak
sdk.clearEffect();
```

### AR Filter Engine
```typescript
sdk.setARFilter('glasses'); // Options: cat, dog, elephant, glasses, crown, mask, makeup
sdk.clearARFilter();
```

### Comparison Modes
```typescript
// View isolated layers or combined preview
sdk.setComparisonMode('combined'); // 'original' | 'beauty' | 'effects' | 'ar' | 'combined'
```

### Capture & Recording
```typescript
// High-res photo capture
const dataUri = sdk.capturePhoto();

// Video recording
sdk.startRecording();
const { blobUrl, durationMs } = await sdk.stopRecording();
```

---

## Performance Considerations

- **Zero CPU Readback**: Shaders operate directly on GPU textures uploaded via `gl.texImage2D`. Pixel manipulation happens in fragment shaders, ensuring 60 FPS throughput on mobile GPUs.
- **Adaptive Face Tracking**: When MediaPipe WebAssembly is downloading or constrained, the optical CV fallback analyzes downscaled 160x120 YCbCr skin clusters and eye luminance valleys without blocking the UI thread.
- **Mathematical Warp Bounds**: Mesh deformations (eye enlargement, cheek slimming) use localized `smoothstep` radius clamping, preventing artifacts outside facial boundaries.

---

## Prototype Limitations & Production Roadmap

### Current Web Prototype Limitations
- Native platform compilation (`.aar` for Android, `.xcframework` for iOS) cannot be built directly in a browser container. The current repository provides the architectural bridge contracts and the WebGL/Web SDK reference implementation.
- Dynamic 3D GLTF lighting currently renders in 2.5D canvas perspective rather than a full scene graph (e.g. Three.js / Filament).

### Commercial Roadmap
1. **Phase 1 (Complete)**: Unified WebGL pipeline, 3-layer compositing, real-time beauty shaders, optical CV face tracking, automated test harness.
2. **Phase 2**: C++ Core Engine porting using OpenGL ES 3.0 / Vulkan / Metal for native iOS and Android.
3. **Phase 3**: JNI wrapper for Android (`.aar`) and Swift package / Objective-C bridge for iOS (`.xcframework`).
4. **Phase 4**: Flutter (`flutter_camera_ar`) and React Native (`react-native-snap-camera`) native modules.
5. **Phase 5**: Unity Native Plugin with native texture pointer sharing via `IssuePluginEvent`.


## Mobile result pass
The Mobile Camera Test is intentionally beauty-first: the camera is neutral by default, beauty processing runs before optional filters, and AR/lenses are user-selected. See `MOBILE_BEAUTY_RESULT_QA.md`.
