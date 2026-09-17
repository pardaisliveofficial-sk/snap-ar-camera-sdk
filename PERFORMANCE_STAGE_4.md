# SnapAR Performance Stage 4

## Goal
Improve mobile WebGL preview performance without changing the camera capture stream or removing beauty/AR features.

## Changes
- GPU beauty processing is now internally bounded to 720px width on mobile and 960px on desktop.
- Camera capture constraints remain 1280x720 / 30fps where supported.
- The expensive GPU pipeline is throttled to approximately 30 processed frames/sec instead of running on every display refresh.
- FPS telemetry counts processed frames, not raw requestAnimationFrame callbacks.
- GpuPipeline accepts an optional processingMaxWidth while continuing to sample the original camera video texture.

## Expected result
A device that previously showed ~3–5 processed FPS should have substantially lower GPU workload. Actual FPS depends on browser, GPU, camera resolution and device thermals.

## Validation
Test on a real Android Chrome device and iPhone Safari:
1. Camera only.
2. Beauty OFF.
3. Beauty ON at default settings.
4. Beauty ON + AR filter.
5. Move face continuously left/right/up/down.
6. Smile and blink.
7. Switch front/rear camera.
8. Confirm the image remains upright and front-camera mirroring is correct.
9. Observe FPS for 20–30 seconds after the device settles.

Do not call this production-validated until these device tests are performed.
