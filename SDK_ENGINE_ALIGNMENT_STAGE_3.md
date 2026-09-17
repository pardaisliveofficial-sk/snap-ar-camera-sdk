# SnapAR SDK Engine Alignment — Stage 3

## What changed

1. **Public Web SDK now uses the same production FaceTracker as the live CameraView/Test Lab.**
   - `src/lib/cameraSdk.ts` imports `src/core/tracking/FaceTracker`.
   - Camera startup binds the video source with `setVideoSource()`.
   - Frame processing uses `update()`.

2. **Legacy synthetic tracking is no longer allowed to report a face when no face is detected.**
   - The emergency optical fallback now returns `NOT DETECTED` when it has no skin evidence.
   - It is explicitly low-confidence and must not be treated as dense tracking.

3. **Gesture data is carried by the core tracker.**
   - Tasks Vision blendshapes are used for smile/blink/jaw/eyebrow states when available.
   - Head pose is included in the gesture payload.

4. **SDK version bumped to 2.5.0.**

5. **SDK package exporter now points at the core tracker and Tasks Vision dependency instead of the legacy synthetic tracker.**

## Verification status

- Static TypeScript invocation was attempted with the repository's global TypeScript compiler.
- Full typecheck cannot complete until project dependencies are installed; the environment currently has no `node_modules`.
- No claim of device/runtime validation is made by this document.

## Manual validation after importing

1. Open the camera preview.
2. Confirm the face-tracking telemetry reports a real dense mesh (typically 478 points from FaceLandmarker).
3. Move the face left/right/up/down and confirm anchors follow.
4. Cover the camera / point away from a face and confirm state becomes `NOT DETECTED`; AR must not remain falsely anchored to the center.
5. Smile, blink, and open the mouth; verify gesture telemetry changes when Tasks Vision is active.
6. Test the public SDK sample separately from Test Lab so both paths are exercised.
