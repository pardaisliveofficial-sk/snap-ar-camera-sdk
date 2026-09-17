# SnapAR Camera SDK — Handoff Fixes

## This handoff includes

### Camera switching
- Front/rear selection now uses `facingMode: { exact: ... }` instead of `ideal`.
- The SDK verifies the browser-reported physical `facingMode` after opening a stream.
- A device-selection fallback is used only when a browser cannot honor `facingMode`.
- Rapid double-taps on Switch Camera are serialized so two `getUserMedia()` calls cannot race.
- Front-camera mirroring remains an independent setting: `auto` mirrors front and does not mirror rear.
- Tracking state is reset after a camera source change so landmarks from the previous camera are not reused.

### Rendering performance
- WebGL processing is capped to the preview/output size (maximum 1280px wide) instead of always processing the camera's full sensor resolution.
- Beauty bilateral smoothing uses a 3x3 edge-aware kernel (9 reads) instead of 5x5 (25 reads).
- AR pixel diagnostics no longer call `getImageData()` every frame; diagnostic readback is throttled to about 4 times/second.
- The live render path remains real-time and the QA FPS target is 30 FPS.

### Web CameraView
- The legacy CameraView now also honors physical `cameraFacing` changes.
- Its camera request uses exact facing selection and verifies the resulting track.
- Its default mirror state follows front/rear camera selection.

## Important runtime note
A browser/phone can only be fully validated with a real HTTPS origin and a real device. The source code has been statically reviewed here, but hardware camera, GPU FPS, Safari/Chrome behavior, and visual AR quality still require final manual QA after deployment.
