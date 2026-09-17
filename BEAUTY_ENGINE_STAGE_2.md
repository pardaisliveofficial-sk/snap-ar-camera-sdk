# Snap AR Beauty Engine — Stage 2

## Critical pipeline correction
The live CameraView now uses `src/core/tracking/FaceTracker.ts`, the same MediaPipe Tasks Vision FaceLandmarker path used by the Test Lab/SDK, instead of the legacy `src/utils/faceTracker.ts`.

This is important because the legacy path had a procedural 468-point fallback and a separate tracking implementation. The production preview must consume the real dense landmark stream so the skin mask, face warps and AR anchors stay aligned with the actual face.

## Beauty processing
Stage 2 strengthens the GPU retouch pass with: multi-radius edge-aware smoothing, skin-only masking, feature protection, denoise, tone/glow enhancement, vibrance and camera shadow recovery.

## Validation rule
Do not call this Snapchat/TikTok-equivalent until it is visually verified on a real Android/iOS device. The required check is the same phone under comparable lighting: raw device camera vs Snap AR with the beauty engine enabled.
